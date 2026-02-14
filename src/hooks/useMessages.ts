import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  getMessages,
  sendMessage as sendMessageService,
  markConversationRead,
} from '../services/messages';
import { useAuth } from './useAuth';
import type { Message } from '../types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useMessages(conversationId: string): UseMessagesReturn {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
      setHasMore(data.length >= 50);
      // Mark as read on initial load
      if (userId) {
        markConversationRead(conversationId, userId).catch(console.error);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to new messages in this conversation
  useEffect(() => {
    const channel = supabase
      .channel(`messages:conversation_id=eq.${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          // Mark as read
          if (userId) {
            markConversationRead(conversationId, userId).catch(console.error);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, userId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!userId) throw new Error('Must be logged in to send messages');
      const message = await sendMessageService(conversationId, userId, content);
      // Optimistic update (deduplicated against realtime)
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    },
    [conversationId, userId],
  );

  const loadMore = useCallback(async () => {
    if (messages.length === 0 || !hasMore) return;
    const oldest = messages[0];
    const older = await getMessages(conversationId, 50, oldest.created_at);
    if (older.length < 50) setHasMore(false);
    setMessages((prev) => [...older, ...prev]);
  }, [messages, hasMore, conversationId]);

  return { messages, loading, sendMessage, loadMore, hasMore };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getConversations } from '../services/messages';
import { useAuth } from './useAuth';
import type { Conversation } from '../types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  unreadCount: number;
  refresh: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscribe to conversation updates (new messages update last_message_at)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('conversations-inbox')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadConversations();
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
  }, [userId, loadConversations]);

  const unreadCount = conversations.filter((conv) => {
    const myParticipant = conv.participants?.find((p) => p.user_id === userId);
    if (!myParticipant) return false;
    return (
      new Date(conv.last_message_at) > new Date(myParticipant.last_read_at)
    );
  }).length;

  return { conversations, loading, unreadCount, refresh: loadConversations };
}

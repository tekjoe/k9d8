import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  sendFriendRequest as sendFriendRequestService,
  acceptFriendRequest as acceptService,
  declineFriendRequest as declineService,
  removeFriend as removeService,
} from '../services/friends';
import { useAuth } from './useAuth';
import type { Profile, Friendship } from '../types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseFriendsReturn {
  friends: Profile[];
  pendingRequests: Friendship[];
  sentRequests: Friendship[];
  pendingCount: number;
  loading: boolean;
  sendFriendRequest: (addresseeId: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  declineFriendRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFriends(): UseFriendsReturn {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    try {
      const [friendsList, pending, sent] = await Promise.all([
        getFriends(userId),
        getPendingRequests(userId),
        getSentRequests(userId),
      ]);
      setFriends(friendsList);
      setPendingRequests(pending);
      setSentRequests(sent);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Subscribe to friendships table changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('friendships-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friendships' },
        () => {
          loadFriends();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'friendships' },
        () => {
          loadFriends();
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'friendships' },
        () => {
          loadFriends();
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
  }, [userId, loadFriends]);

  const sendFriendRequest = useCallback(
    async (addresseeId: string) => {
      if (!userId) throw new Error('Must be logged in');
      await sendFriendRequestService(userId, addresseeId);
    },
    [userId],
  );

  const acceptFriendRequest = useCallback(
    async (friendshipId: string) => {
      await acceptService(friendshipId);
    },
    [],
  );

  const declineFriendRequest = useCallback(
    async (friendshipId: string) => {
      await declineService(friendshipId);
    },
    [],
  );

  const removeFriend = useCallback(async (friendshipId: string) => {
    await removeService(friendshipId);
  }, []);

  return {
    friends,
    pendingRequests,
    sentRequests,
    pendingCount: pendingRequests.length,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    refresh: loadFriends,
  };
}

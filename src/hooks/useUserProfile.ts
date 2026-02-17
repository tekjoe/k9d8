import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { supabase } from '@/src/lib/supabase';
import { getDogsByOwner } from '@/src/services/dogs';
import {
  getFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
} from '@/src/services/friends';
import { getOrCreateConversation } from '@/src/services/messages';
import type { Profile, Dog, Friendship } from '@/src/types/database';

export function useUserProfile(id: string | undefined) {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    try {
      const [profileRes, dogsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        getDogsByOwner(id),
      ]);
      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data as Profile);
      setDogs(dogsRes);

      if (userId && userId !== id) {
        const fs = await getFriendshipStatus(userId, id);
        setFriendship(fs);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isOwnProfile = userId === id;
  const isPending = friendship?.status === 'pending';
  const isSentByMe = isPending && friendship?.requester_id === userId;
  const isSentToMe = isPending && friendship?.addressee_id === userId;
  const isFriend = friendship?.status === 'accepted';

  const handleSendRequest = useCallback(async () => {
    if (!userId || !id) return;
    setActionLoading(true);
    try {
      const fs = await sendFriendRequest(userId, id);
      setFriendship(fs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send request';
      Alert.alert('Error', message);
    } finally {
      setActionLoading(false);
    }
  }, [userId, id]);

  const handleAccept = useCallback(async () => {
    if (!friendship) return;
    setActionLoading(true);
    try {
      await acceptFriendRequest(friendship.id);
      setFriendship({ ...friendship, status: 'accepted' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept request';
      Alert.alert('Error', message);
    } finally {
      setActionLoading(false);
    }
  }, [friendship]);

  const handleRemoveFriend = useCallback(async () => {
    if (!friendship) return;
    Alert.alert('Remove Friend', 'Are you sure you want to unfriend this person?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await removeFriend(friendship.id);
            setFriendship(null);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to remove friend';
            Alert.alert('Error', message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }, [friendship]);

  const handleMessage = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const conversationId = await getOrCreateConversation(id);
      router.push(`/messages/${conversationId}`);
    } catch {
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [id, router]);

  return {
    profile,
    dogs,
    loading,
    actionLoading,
    isOwnProfile,
    isPending,
    isSentByMe,
    isSentToMe,
    isFriend,
    handleSendRequest,
    handleAccept,
    handleRemoveFriend,
    handleMessage,
  };
}

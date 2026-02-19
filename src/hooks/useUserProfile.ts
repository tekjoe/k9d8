import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
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
import { getBlockStatus, blockUser, unblockUser } from '@/src/services/blocks';
import type { Profile, Dog, Friendship } from '@/src/types/database';

export function useUserProfile(id: string | undefined) {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [blockStatus, setBlockStatus] = useState<'blocked' | 'blocked_by' | null>(null);
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
        const [fs, bs] = await Promise.all([
          getFriendshipStatus(userId, id),
          getBlockStatus(id),
        ]);
        setFriendship(fs);
        setBlockStatus(bs);
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

  const doRemoveFriend = useCallback(async () => {
    if (!friendship) return;
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
  }, [friendship]);

  const handleRemoveFriend = useCallback(async () => {
    if (!friendship) return;

    if (Platform.OS === 'web') {
      // Web screens handle their own confirmation UI
      await doRemoveFriend();
    } else {
      Alert.alert('Remove Friend', 'Are you sure you want to unfriend this person?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemoveFriend },
      ]);
    }
  }, [friendship, doRemoveFriend]);

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

  const doBlockUser = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await blockUser(id);
      setBlockStatus('blocked');
      setFriendship(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to block user';
      Alert.alert('Error', message);
    } finally {
      setActionLoading(false);
    }
  }, [id]);

  const handleBlockUser = useCallback(async () => {
    if (!id) return;

    if (Platform.OS === 'web') {
      // Web screens handle their own confirmation UI
      await doBlockUser();
    } else {
      Alert.alert(
        'Block User',
        'Are you sure you want to block this user? This will also remove any friendship.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: doBlockUser },
        ],
      );
    }
  }, [id, doBlockUser]);

  const handleUnblockUser = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await unblockUser(id);
      setBlockStatus(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unblock user';
      Alert.alert('Error', message);
    } finally {
      setActionLoading(false);
    }
  }, [id]);

  const isBlocked = blockStatus === 'blocked';
  const isBlockedByThem = blockStatus === 'blocked_by';

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
    isBlocked,
    isBlockedByThem,
    handleSendRequest,
    handleAccept,
    handleRemoveFriend,
    handleMessage,
    handleBlockUser,
    handleUnblockUser,
    doBlockUser,
    doRemoveFriend,
  };
}

import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/');
  }, [router]);

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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-base text-error text-center px-8">User not found</Text>
      </View>
    );
  }

  const isOwnProfile = userId === id;
  const isPending = friendship?.status === 'pending';
  const isSentByMe = isPending && friendship?.requester_id === userId;
  const isSentToMe = isPending && friendship?.addressee_id === userId;
  const isFriend = friendship?.status === 'accepted';

  return (
    <View className="flex-1 bg-background">
      {/* Hero */}
      <View className="relative bg-secondary/20 h-[180px] justify-end items-center">
        <Pressable
          onPress={handleBack}
          className="absolute left-4 w-10 h-10 rounded-full bg-white/90 justify-center items-center shadow-sm"
          style={{ top: insets.top + 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>

        <View className="w-24 h-24 rounded-full border-[3px] border-white bg-white mb-[-48px]">
          <Image
            source={{
              uri:
                profile.avatar_url ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
            }}
            className="w-full h-full rounded-full"
            resizeMode="cover"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View className="items-center px-8 pt-14 pb-4">
          <Text className="text-2xl font-bold text-text text-center">
            {profile.display_name || 'Dog Owner'}
          </Text>
        </View>

        {/* Action Buttons */}
        {!isOwnProfile && userId && (
          <View className="px-5 mb-6 gap-3">
            {/* Friendship button */}
            {!friendship && (
              <Pressable
                onPress={handleSendRequest}
                disabled={actionLoading}
                className="flex-row items-center justify-center bg-secondary py-3.5 rounded-xl"
              >
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text className="text-white text-[15px] font-semibold ml-2">
                  Add Friend
                </Text>
              </Pressable>
            )}

            {isSentByMe && (
              <View className="flex-row items-center justify-center bg-border py-3.5 rounded-xl">
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text className="text-text-secondary text-[15px] font-semibold ml-2">
                  Request Sent
                </Text>
              </View>
            )}

            {isSentToMe && (
              <Pressable
                onPress={handleAccept}
                disabled={actionLoading}
                className="flex-row items-center justify-center bg-secondary py-3.5 rounded-xl"
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text className="text-white text-[15px] font-semibold ml-2">
                  Accept Friend Request
                </Text>
              </Pressable>
            )}

            {isFriend && (
              <>
                <Pressable
                  onPress={handleMessage}
                  disabled={actionLoading}
                  className="flex-row items-center justify-center bg-secondary py-3.5 rounded-xl"
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                  <Text className="text-white text-[15px] font-semibold ml-2">
                    Message
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleRemoveFriend}
                  disabled={actionLoading}
                  className="flex-row items-center justify-center bg-white border border-border py-3.5 rounded-xl"
                >
                  <Ionicons name="person-remove-outline" size={18} color="#6B7280" />
                  <Text className="text-text-secondary text-[15px] font-medium ml-2">
                    Remove Friend
                  </Text>
                </Pressable>
              </>
            )}

            {/* Message button when not yet friends */}
            {!isFriend && (
              <Pressable
                onPress={handleMessage}
                disabled={actionLoading}
                className="flex-row items-center justify-center bg-white border border-secondary py-3.5 rounded-xl"
              >
                <Ionicons name="chatbubble-outline" size={20} color="#6FCF97" />
                <Text className="text-secondary text-[15px] font-semibold ml-2">
                  Message
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Dogs */}
        {dogs.length > 0 && (
          <View className="px-5">
            <Text className="text-lg font-bold text-text mb-3">
              {isOwnProfile ? 'My Dogs' : 'Their Dogs'}
            </Text>
            {dogs.map((dog) => (
              <Pressable
                key={dog.id}
                onPress={() => router.push(`/dogs/${dog.id}`)}
                className="flex-row items-center bg-white p-3 rounded-xl mb-2"
              >
                <Image
                  source={{
                    uri:
                      dog.photo_url ||
                      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
                  }}
                  className="w-12 h-12 rounded-full mr-3"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-text">{dog.name}</Text>
                  <Text className="text-sm text-text-secondary">
                    {[dog.breed, dog.age_years ? `${dog.age_years} yrs` : '']
                      .filter(Boolean)
                      .join(', ') || 'Mixed breed'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

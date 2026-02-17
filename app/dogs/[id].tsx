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
import { Colors } from '@/src/constants/colors';
import { useAuth } from '@/src/hooks/useAuth';
import { getDogWithOwner } from '@/src/services/dogs';
import { getOrCreateConversation } from '@/src/services/messages';
import {
  getFriendshipStatus,
  sendFriendRequest,
} from '@/src/services/friends';
import type { DogWithOwner } from '@/src/services/dogs';
import type { DogSize, DogTemperament, Friendship } from '@/src/types/database';

function formatSize(size: DogSize): string {
  const map: Record<DogSize, string> = {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    extra_large: 'Extra Large',
  };
  return map[size];
}

function formatTemperament(temperaments: DogTemperament[]): string {
  const map: Record<DogTemperament, string> = {
    calm: 'Calm',
    friendly: 'Friendly',
    energetic: 'Energetic',
    anxious: 'Anxious',
    aggressive: 'Aggressive',
  };
  return temperaments.map((t) => map[t]).join(', ');
}

interface InfoTagProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

function InfoTag({ icon, label }: InfoTagProps) {
  return (
    <View className="flex-row items-center bg-white px-4 py-2.5 rounded-full border border-border">
      <Ionicons name={icon} size={16} color="#6D6C6A" style={{ marginRight: 8 }} />
      <Text className="text-sm text-text">{label}</Text>
    </View>
  );
}

export default function DogProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [dog, setDog] = useState<DogWithOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [friendLoading, setFriendLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function fetchDog() {
      try {
        const data = await getDogWithOwner(id!);
        if (isMounted) {
          setDog(data);
          // Check friendship status with the dog's owner
          if (userId && userId !== data.owner_id) {
            const fs = await getFriendshipStatus(userId, data.owner_id);
            if (isMounted) setFriendship(fs);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message: unknown }).message)
              : err instanceof Error
                ? err.message
                : 'Failed to load dog profile';
          const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
          setError(code === 'PGRST116' ? 'Dog not found' : msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDog();

    return () => {
      isMounted = false;
    };
  }, [id, userId]);

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/');
  }, [router]);

  const handleMessageOwner = useCallback(async () => {
    if (!dog || !userId) return;
    setMessageLoading(true);
    try {
      const conversationId = await getOrCreateConversation(dog.owner_id);
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    } finally {
      setMessageLoading(false);
    }
  }, [dog, userId, router]);

  const handleAddFriend = useCallback(async () => {
    if (!dog || !userId) return;
    setFriendLoading(true);
    try {
      const fs = await sendFriendRequest(userId, dog.owner_id);
      setFriendship(fs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send request';
      Alert.alert('Error', msg);
    } finally {
      setFriendLoading(false);
    }
  }, [dog, userId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#3D8A5A" />
      </View>
    );
  }

  if (error || !dog) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-base text-error text-center px-8">
          {error ?? 'Dog not found'}
        </Text>
      </View>
    );
  }

  const isOwnDog = userId === dog.owner_id;

  return (
    <View className="flex-1 bg-background">
      {/* Hero Photo */}
      <View className="relative">
        <Image
          source={{
            uri:
              dog.photo_url ||
              'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=400&fit=crop',
          }}
          className="w-full h-[280px]"
          resizeMode="cover"
        />
        {/* Back Button */}
        <Pressable
          onPress={handleBack}
          className="absolute left-4 w-10 h-10 rounded-full bg-white/90 justify-center items-center shadow-sm"
          style={{ top: insets.top + 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name & Breed */}
        <View className="items-center px-8 pt-5 pb-4">
          <Text className="text-2xl font-bold text-text text-center">
            {dog.name}
          </Text>
          {dog.breed && (
            <Text className="text-[15px] text-text-secondary mt-1.5">
              {dog.breed}
            </Text>
          )}
        </View>

        {/* Info Tags */}
        <View className="flex-row flex-wrap justify-center gap-3 px-5 mb-6">
          <InfoTag icon="resize-outline" label={formatSize(dog.size)} />
          <InfoTag icon="happy-outline" label={formatTemperament(dog.temperament)} />
          {dog.age_years != null && (
            <InfoTag
              icon="calendar-outline"
              label={`${dog.age_years} ${dog.age_years === 1 ? 'year' : 'years'}`}
            />
          )}
        </View>

        {/* Notes */}
        {dog.notes && (
          <View className="px-5 mb-6">
            <Text className="text-lg font-bold text-text mb-2">About</Text>
            <Text className="text-[15px] text-text-secondary leading-6">
              {dog.notes}
            </Text>
          </View>
        )}

        {/* Owner Section */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-bold text-text mb-3">Owner</Text>
          <Pressable
            onPress={() => router.push(`/users/${dog.owner_id}`)}
            className="flex-row items-center bg-white p-4 rounded-2xl border border-border"
          >
            <Image
              source={{
                uri:
                  dog.owner.avatar_url ||
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
              }}
              className="w-12 h-12 rounded-full mr-3"
              resizeMode="cover"
            />
            <Text className="flex-1 text-base font-semibold text-text">
              {dog.owner.display_name || 'Dog Owner'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6D6C6A" />
          </Pressable>
        </View>

        {/* Message Owner Button */}
        {!isOwnDog && userId && (
          <View className="px-5">
            <Pressable
              onPress={handleMessageOwner}
              disabled={messageLoading}
              className="flex-row items-center justify-center bg-secondary py-3.5 rounded-xl"
            >
              {messageLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                  <Text className="text-white text-[15px] font-semibold ml-2">
                    Message Owner
                  </Text>
                </>
              )}
            </Pressable>

            {/* Add Friend Button */}
            {!friendship && (
              <Pressable
                onPress={handleAddFriend}
                disabled={friendLoading}
                className="flex-row items-center justify-center bg-white border border-secondary py-3.5 rounded-xl mt-3"
              >
                {friendLoading ? (
                  <ActivityIndicator size="small" color="#3D8A5A" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={20} color="#3D8A5A" />
                    <Text className="text-secondary text-[15px] font-semibold ml-2">
                      Add Friend
                    </Text>
                  </>
                )}
              </Pressable>
            )}

            {friendship?.status === 'pending' && (
              <View className="flex-row items-center justify-center bg-border py-3.5 rounded-xl mt-3">
                <Ionicons name="time-outline" size={20} color="#6D6C6A" />
                <Text className="text-text-secondary text-[15px] font-semibold ml-2">
                  {friendship.requester_id === userId ? 'Request Sent' : 'Request Pending'}
                </Text>
              </View>
            )}

            {friendship?.status === 'accepted' && (
              <View className="flex-row items-center justify-center bg-secondary/10 py-3.5 rounded-xl mt-3">
                <Ionicons name="checkmark-circle" size={20} color="#3D8A5A" />
                <Text className="text-secondary text-[15px] font-semibold ml-2">
                  Friends
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

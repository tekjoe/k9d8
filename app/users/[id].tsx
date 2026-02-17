import React from 'react';
import {
  ActivityIndicator,
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
import { useUserProfile } from '@/src/hooks/useUserProfile';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    profile,
    dogs,
    loading,
    actionLoading,
    isOwnProfile,
    isFriend,
    isPending,
    isSentByMe,
    isSentToMe,
    handleSendRequest,
    handleAccept,
    handleRemoveFriend,
    handleMessage,
  } = useUserProfile(id);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#3D8A5A" />
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

  return (
    <View className="flex-1 bg-background">
      {/* Hero */}
      <View className="relative bg-secondary/20 h-[180px] justify-end items-center">
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          className="absolute left-4 w-10 h-10 rounded-full bg-white/90 justify-center items-center shadow-sm"
          style={{ top: insets.top + 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
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
        {!isOwnProfile && (
          <View className="px-5 mb-6 gap-3">
            {/* Friendship button */}
            {!isPending && !isFriend && (
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
                <Ionicons name="time-outline" size={20} color="#6D6C6A" />
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
                  <Ionicons name="person-remove-outline" size={18} color="#6D6C6A" />
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
                <Ionicons name="chatbubble-outline" size={20} color="#3D8A5A" />
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
                <Ionicons name="chevron-forward" size={20} color="#6D6C6A" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

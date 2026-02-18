import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useUserProfile } from '@/src/hooks/useUserProfile';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F4F1' }}>
        <ActivityIndicator size="large" color="#3D8A5A" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F5F4F1' }}>
        <Text style={{ fontSize: 16, color: '#B5725E', textAlign: 'center' }}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
        }}
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginLeft: 12 }}>
          {profile.display_name || 'Profile'}
        </Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* Profile Header */}
        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              borderWidth: 3,
              borderColor: '#E5E4E1',
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <Image
              source={{
                uri:
                  profile.avatar_url ||
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
              }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A1918' }}>
            {profile.display_name || 'Dog Owner'}
          </Text>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View
              style={{
                flexDirection: 'column',
                gap: 12,
                marginTop: 20,
                width: '100%',
              }}
            >
              {!isPending && !isFriend && (
                <Pressable
                  onPress={handleSendRequest}
                  disabled={actionLoading}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#3D8A5A',
                    paddingVertical: 12,
                    borderRadius: 12,
                    gap: 8,
                  }}
                >
                  <Ionicons name="person-add-outline" size={20} color="#fff" />
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Add Friend</Text>
                </Pressable>
              )}

              {isSentByMe && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EDECEA',
                    paddingVertical: 12,
                    borderRadius: 12,
                    gap: 8,
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="#6D6C6A" />
                  <Text style={{ color: '#6D6C6A', fontSize: 15, fontWeight: '600' }}>Request Sent</Text>
                </View>
              )}

              {isSentToMe && (
                <Pressable
                  onPress={handleAccept}
                  disabled={actionLoading}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#3D8A5A',
                    paddingVertical: 12,
                    borderRadius: 12,
                    gap: 8,
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Accept Request</Text>
                </Pressable>
              )}

              {isFriend && (
                <Pressable
                  onPress={handleRemoveFriend}
                  disabled={actionLoading}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E5E4E1',
                    paddingVertical: 12,
                    borderRadius: 12,
                    gap: 8,
                  }}
                >
                  <Ionicons name="person-remove-outline" size={18} color="#6D6C6A" />
                  <Text style={{ color: '#6D6C6A', fontSize: 15, fontWeight: '500' }}>Remove Friend</Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleMessage}
                disabled={actionLoading}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isFriend ? '#3D8A5A' : '#FFFFFF',
                  borderWidth: isFriend ? 0 : 1,
                  borderColor: '#3D8A5A',
                  paddingVertical: 12,
                  borderRadius: 12,
                  gap: 8,
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color={isFriend ? '#fff' : '#3D8A5A'} />
                <Text style={{ color: isFriend ? '#FFFFFF' : '#3D8A5A', fontSize: 15, fontWeight: '600' }}>
                  Message
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Dogs Section */}
        {dogs.length > 0 && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1918', marginBottom: 16 }}>
              {isOwnProfile ? 'My Dogs' : 'Their Dogs'}
            </Text>
            <View style={{ gap: 12 }}>
              {dogs.map((dog) => (
                <Pressable
                  key={dog.id}
                  onPress={() => router.push(`/dogs/${dog.id}`)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    padding: 16,
                    borderRadius: 12,
                  }}
                >
                  <Image
                    source={{
                      uri:
                        dog.photo_url ||
                        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
                    }}
                    style={{ width: 56, height: 56, borderRadius: 28, marginRight: 12 }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }}>{dog.name}</Text>
                    <Text style={{ fontSize: 14, color: '#6D6C6A', marginTop: 2 }}>
                      {[dog.breed, dog.age_years ? `${dog.age_years} yrs` : '']
                        .filter(Boolean)
                        .join(', ') || 'Mixed breed'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6D6C6A" />
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

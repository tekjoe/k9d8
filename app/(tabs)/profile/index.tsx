import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/hooks/useAuth';
import { signOut } from '@/src/services/auth';
import { useDogs } from '@/src/hooks/useDogs';
import { useFriends } from '@/src/hooks/useFriends';
import type { Dog, Friendship, Profile } from '@/src/types/database';

// Dog List Row Component
interface DogListRowProps {
  dog: Dog;
  onPress: () => void;
}

function DogListRow({ dog, onPress }: DogListRowProps) {
  const ageText = dog.age_years ? `${dog.age_years} ${dog.age_years === 1 ? 'yr' : 'yrs'}` : '';
  const subtitle = [dog.breed, ageText].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
      }}
    >
      <Image
        source={{
          uri:
            dog.photo_url ||
            'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
        }}
        style={{ width: 48, height: 48, borderRadius: 24, marginRight: 16 }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918', marginBottom: 2 }}>
          {dog.name}
        </Text>
        <Text style={{ fontSize: 14, color: '#6D6C6A' }}>
          {subtitle || 'Mixed breed'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D0CD" />
    </Pressable>
  );
}

// Friend Row Component
function FriendRow({ friend, onPress }: { friend: Profile; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
      }}
    >
      <Image
        source={{
          uri:
            friend.avatar_url ||
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        }}
        style={{ width: 48, height: 48, borderRadius: 24, marginRight: 16 }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }}>
          {friend.display_name || 'User'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D0CD" />
    </Pressable>
  );
}

// Pending Request Row Component
function PendingRequestRow({
  request,
  variant,
  onAccept,
  onDecline,
}: {
  request: Friendship;
  variant: 'received' | 'sent';
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const [acting, setActing] = useState(false);
  const person = variant === 'received' ? request.requester : request.addressee;

  async function handleAction(action: (() => void) | undefined) {
    if (!action) return;
    setActing(true);
    try {
      await action();
    } catch {
      setActing(false);
    }
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
      }}
    >
      <Image
        source={{
          uri:
            person?.avatar_url ||
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        }}
        style={{ width: 48, height: 48, borderRadius: 24, marginRight: 16 }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }}>
          {person?.display_name || 'User'}
        </Text>
      </View>
      {variant === 'received' ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => handleAction(onAccept)}
            disabled={acting}
            style={{
              backgroundColor: '#3D8A5A',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 9999,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Accept</Text>
          </Pressable>
          <Pressable
            onPress={() => handleAction(onDecline)}
            disabled={acting}
            style={{
              borderWidth: 1,
              borderColor: '#E5E4E1',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 9999,
            }}
          >
            <Text style={{ color: '#6D6C6A', fontSize: 13, fontWeight: '500' }}>Decline</Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: '#F5EFE0',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 9999,
          }}
        >
          <Text style={{ color: '#B8893D', fontSize: 12, fontWeight: '600' }}>Pending</Text>
        </View>
      )}
    </View>
  );
}

export default function ProfilePage() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { dogs, loading, loadDogs } = useDogs(userId);

  useFocusEffect(
    useCallback(() => {
      loadDogs();
    }, [loadDogs])
  );
  const { friends, pendingRequests, sentRequests, acceptFriendRequest, declineFriendRequest } = useFriends();

  const displayName = session?.user?.user_metadata?.display_name || '';
  const handle = session?.user?.email?.split('@')[0] || '';
  const bio = session?.user?.user_metadata?.bio || '';
  const avatarUrl = session?.user?.user_metadata?.avatar_url;

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      Alert.alert('Error', message);
    }
  }

  function handleAddDog() {
    router.push('/(tabs)/profile/dogs/create');
  }

  function handleDogPress(dog: Dog) {
    router.push(`/(tabs)/profile/dogs/${dog.id}`);
  }

  function handleEditProfile() {
    router.push('/(tabs)/profile/edit');
  }

  const friendsCount = friends.length;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View 
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: '#fff',
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '600', color: '#1A1918' }}>
          Profile
        </Text>
        <Pressable 
          onPress={handleEditProfile}
          style={{ 
            borderWidth: 1, 
            borderColor: '#E5E4E1', 
            paddingHorizontal: 16, 
            paddingVertical: 8, 
            borderRadius: 9999,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1918' }}>
            Edit Profile
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Profile Card */}
        <View 
          style={{ 
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          {/* Avatar */}
          <View 
            style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 50, 
              borderWidth: 3, 
              borderColor: '#3D8A5A',
              padding: 3,
              marginBottom: 16,
            }}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: '100%', height: '100%', borderRadius: 50 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: '100%', height: '100%', borderRadius: 50, backgroundColor: '#E5E4E1', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="person" size={40} color="#878685" />
              </View>
            )}
          </View>

          {/* Name & Handle */}
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#1A1918', marginBottom: 4 }}>
            {displayName || 'New User'}
          </Text>
          {handle ? (
            <Text style={{ fontSize: 14, color: '#878685', marginBottom: 12 }}>
              @{handle}
            </Text>
          ) : null}

          {/* Bio */}
          {bio ? (
            <Text
              style={{
                fontSize: 14,
                color: '#6D6C6A',
                textAlign: 'center',
                lineHeight: 21,
                marginBottom: 16,
              }}
            >
              {bio}
            </Text>
          ) : null}

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 24 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1918' }}>{friendsCount}</Text>
              <Text style={{ fontSize: 12, color: '#6D6C6A', marginTop: 2 }}>Friends</Text>
            </View>
          </View>
        </View>

        {/* My Dogs Section */}
        <View style={{ marginBottom: 24 }}>
          <View 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>
              My Dogs
            </Text>
            <Pressable 
              onPress={handleAddDog}
              style={{ 
                backgroundColor: '#3D8A5A', 
                paddingHorizontal: 16, 
                paddingVertical: 8, 
                borderRadius: 9999,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Add Dog</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#3D8A5A" />
            </View>
          ) : dogs.length > 0 ? (
            <View style={{ borderRadius: 12, overflow: 'hidden' }}>
              {dogs.map((dog, index) => (
                <View key={dog.id}>
                  {index > 0 && <View style={{ height: 1, backgroundColor: '#E5E4E1', marginLeft: 80 }} />}
                  <DogListRow
                    dog={dog}
                    onPress={() => handleDogPress(dog)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#6D6C6A', marginBottom: 16 }}>
                No dogs added yet
              </Text>
              <Pressable 
                onPress={handleAddDog}
                style={{ 
                  backgroundColor: '#3D8A5A', 
                  paddingHorizontal: 20, 
                  paddingVertical: 10, 
                  borderRadius: 9999,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                  Add your first dog
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* My Friends Section */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>
              My Friends
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/profile/friends')}
              style={{
                borderWidth: 1,
                borderColor: '#E5E4E1',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1918' }}>View All</Text>
            </Pressable>
          </View>

          {/* Pending Received Requests */}
          {pendingRequests.length > 0 && (
            <View style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#878685', textTransform: 'uppercase' }}>
                  Requests Received
                </Text>
              </View>
              {pendingRequests.map((request, index) => (
                <View key={request.id}>
                  <View style={{ height: 1, backgroundColor: '#E5E4E1', marginLeft: 80 }} />
                  <PendingRequestRow
                    request={request}
                    variant="received"
                    onAccept={() => acceptFriendRequest(request.id)}
                    onDecline={() => declineFriendRequest(request.id)}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Pending Sent Requests */}
          {sentRequests.length > 0 && (
            <View style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#878685', textTransform: 'uppercase' }}>
                  Requests Sent
                </Text>
              </View>
              {sentRequests.map((request, index) => (
                <View key={request.id}>
                  <View style={{ height: 1, backgroundColor: '#E5E4E1', marginLeft: 80 }} />
                  <PendingRequestRow
                    request={request}
                    variant="sent"
                  />
                </View>
              ))}
            </View>
          )}

          {/* Accepted Friends */}
          {friends.length > 0 ? (
            <View style={{ borderRadius: 12, overflow: 'hidden' }}>
              {friends.slice(0, 5).map((friend, index) => (
                <View key={friend.id}>
                  {index > 0 && <View style={{ height: 1, backgroundColor: '#E5E4E1', marginLeft: 80 }} />}
                  <FriendRow
                    friend={friend}
                    onPress={() => router.push(`/users/${friend.id}`)}
                  />
                </View>
              ))}
            </View>
          ) : pendingRequests.length === 0 && sentRequests.length === 0 ? (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center' }}>
              <Ionicons name="people-outline" size={36} color="#878685" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 14, color: '#6D6C6A', textAlign: 'center' }}>
                No friends yet. Visit a dog profile to connect with other owners.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Sign Out Button */}
        <Pressable 
          onPress={handleSignOut}
          style={{ 
            paddingVertical: 14, 
            borderRadius: 12, 
            borderWidth: 1, 
            borderColor: '#B5725E',
            backgroundColor: '#fff',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#B5725E', fontSize: 16, fontWeight: '600' }}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

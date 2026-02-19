import { useState } from 'react';
import { SEOHead } from '@/src/components/seo';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '@/src/hooks/useFriends';
import { useResponsiveLayout } from '@/src/hooks/useResponsiveLayout';
import WebPageLayout from '@/src/components/ui/WebPageLayout';
import type { Profile } from '@/src/types/database';

interface FriendCardProps {
  friend: Profile;
  onPress: () => void;
  onRemove: () => void;
}

function FriendCard({ friend, onPress, onRemove }: FriendCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
      }}
    >
      <Image
        source={{
          uri:
            friend.avatar_url ||
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        }}
        style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1918' }}>
          {friend.display_name || 'User'}
        </Text>
      </View>
      {hovered && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{ padding: 4, marginRight: 4 }}
        >
          <Ionicons name="person-remove-outline" size={18} color="#B5725E" />
        </Pressable>
      )}
      <Ionicons name="chevron-forward" size={20} color="#6D6C6A" />
    </Pressable>
  );
}

export default function FriendsListWebScreen() {
  const router = useRouter();
  const { friends, pendingCount, loading, refresh, removeFriendByUserId } = useFriends();

  const handleRemoveFriend = async (friend: Profile) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${friend.display_name || 'this person'} as a friend?`
    );
    if (!confirmed) return;
    try {
      await removeFriendByUserId(friend.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove friend';
      window.alert(message);
    }
  };
  const { isMobile, isDesktop } = useResponsiveLayout();

  const columns = isDesktop ? 3 : isMobile ? 1 : 2;

  return (
    <>
    <SEOHead title="Friends" description="Manage your k9d8 friends and connections." url="/profile/friends" />
    <WebPageLayout maxWidth={960}>
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: isMobile ? 20 : 24, fontWeight: '700', color: '#1A1918' }}>
          Friends
        </Text>
      </View>

      {/* Pending Requests Banner */}
      {pendingCount > 0 && (
        <Pressable
          onPress={() => router.push('/(tabs)/profile/friends/requests')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                backgroundColor: '#B5725E',
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                {pendingCount}
              </Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1918' }}>
              Pending Requests
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6D6C6A" />
        </Pressable>
      )}

      {/* Friends Grid */}
      {friends.length === 0 && !loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 64 }}>
          <Ionicons name="people-outline" size={48} color="#878685" />
          <Text style={{ fontSize: 15, color: '#6D6C6A', marginTop: 16, marginBottom: 8 }}>
            No friends yet
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#6D6C6A',
              textAlign: 'center',
              maxWidth: 300,
            }}
          >
            Visit a dog profile and tap "Add Friend" to connect with other dog owners.
          </Text>
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {friends.map((friend) => (
            <View
              key={friend.id}
              style={{
                width: columns === 1 ? '100%' : `${(100 - (columns - 1) * 1.5) / columns}%`,
              }}
            >
              <FriendCard
                friend={friend}
                onPress={() => router.push(`/users/${friend.id}`)}
                onRemove={() => handleRemoveFriend(friend)}
              />
            </View>
          ))}
        </View>
      )}
    </WebPageLayout>
    </>
  );
}

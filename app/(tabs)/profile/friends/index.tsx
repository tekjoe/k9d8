import { Image, Pressable, Text, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '@/src/hooks/useFriends';
import type { Profile } from '@/src/types/database';

interface FriendCardProps {
  friend: Profile;
  onPress: () => void;
}

function FriendCard({ friend, onPress }: FriendCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
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
      <Ionicons name="chevron-forward" size={20} color="#6D6C6A" />
    </Pressable>
  );
}

export default function FriendsListScreen() {
  const router = useRouter();
  const { friends, pendingCount, loading } = useFriends();

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E4E1' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1918' }}>
          Friends
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
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
              marginBottom: 16,
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

        {/* Friends List */}
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
          friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              onPress={() => router.push(`/users/${friend.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

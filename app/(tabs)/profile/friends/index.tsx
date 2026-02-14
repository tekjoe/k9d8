import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '@/src/hooks/useFriends';
import type { Profile } from '@/src/types/database';

interface FriendItemProps {
  friend: Profile;
  onPress: () => void;
}

function FriendItem({ friend, onPress }: FriendItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white p-3 rounded-xl mb-2"
    >
      <Image
        source={{
          uri:
            friend.avatar_url ||
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        }}
        className="w-12 h-12 rounded-full mr-3"
        resizeMode="cover"
      />
      <View className="flex-1">
        <Text className="text-base font-semibold text-text">
          {friend.display_name || 'User'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </Pressable>
  );
}

export default function FriendsListScreen() {
  const router = useRouter();
  const { friends, pendingCount, loading, refresh } = useFriends();

  return (
    <View className="flex-1 bg-background">
      {pendingCount > 0 && (
        <Pressable
          onPress={() => router.push('/(tabs)/profile/friends/requests')}
          className="flex-row items-center justify-between bg-white mx-4 mt-4 p-4 rounded-xl"
        >
          <View className="flex-row items-center">
            <View className="bg-error w-8 h-8 rounded-full justify-center items-center mr-3">
              <Text className="text-white text-sm font-bold">{pendingCount}</Text>
            </View>
            <Text className="text-base font-semibold text-text">
              Pending Requests
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </Pressable>
      )}

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FriendItem
            friend={item}
            onPress={() => router.push(`/users/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <View className="items-center py-16">
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text className="text-base text-text-secondary mt-4 mb-2">
                No friends yet
              </Text>
              <Text className="text-sm text-text-secondary text-center px-12">
                Visit a dog profile and tap "Add Friend" to connect with other dog owners.
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onRefresh={refresh}
        refreshing={loading}
      />
    </View>
  );
}

import { useState } from 'react';
import { Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '@/src/hooks/useFriends';
import type { Friendship } from '@/src/types/database';

interface RequestItemProps {
  request: Friendship;
  onAccept: () => void;
  onDecline: () => void;
}

function RequestItem({ request, onAccept, onDecline }: RequestItemProps) {
  const [acting, setActing] = useState(false);

  async function handleAccept() {
    setActing(true);
    try {
      await onAccept();
    } catch {
      setActing(false);
    }
  }

  async function handleDecline() {
    setActing(true);
    try {
      await onDecline();
    } catch {
      setActing(false);
    }
  }

  return (
    <View className="flex-row items-center bg-white p-3 rounded-xl mb-2">
      <Image
        source={{
          uri:
            request.requester?.avatar_url ||
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        }}
        className="w-12 h-12 rounded-full mr-3"
        resizeMode="cover"
      />
      <View className="flex-1">
        <Text className="text-base font-semibold text-text">
          {request.requester?.display_name || 'User'}
        </Text>
      </View>
      <Pressable
        onPress={handleAccept}
        disabled={acting}
        className="bg-secondary px-4 py-2 rounded-full mr-2"
      >
        <Text className="text-white text-sm font-semibold">Accept</Text>
      </Pressable>
      <Pressable
        onPress={handleDecline}
        disabled={acting}
        className="bg-white border border-border px-4 py-2 rounded-full"
      >
        <Text className="text-text-secondary text-sm font-medium">Decline</Text>
      </Pressable>
    </View>
  );
}

export default function FriendRequestsScreen() {
  const { pendingRequests, acceptFriendRequest, declineFriendRequest, loading, refresh } =
    useFriends();

  async function handleAccept(friendshipId: string) {
    try {
      await acceptFriendRequest(friendshipId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept request';
      Alert.alert('Error', message);
    }
  }

  async function handleDecline(friendshipId: string) {
    try {
      await declineFriendRequest(friendshipId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to decline request';
      Alert.alert('Error', message);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={pendingRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestItem
            request={item}
            onAccept={() => handleAccept(item.id)}
            onDecline={() => handleDecline(item.id)}
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <View className="items-center py-16">
              <Ionicons name="mail-open-outline" size={48} color="#878685" />
              <Text className="text-base text-text-secondary mt-4">
                No pending requests
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

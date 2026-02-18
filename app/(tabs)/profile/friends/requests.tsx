import { useState } from 'react';
import { Alert, Image, Pressable, Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '@/src/hooks/useFriends';
import type { Friendship } from '@/src/types/database';

interface RequestCardProps {
  request: Friendship;
  onAccept: () => void;
  onDecline: () => void;
}

function RequestCard({ request, onAccept, onDecline }: RequestCardProps) {
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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      <Image
        source={{
          uri:
            request.requester?.avatar_url ||
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        }}
        style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1918' }}>
          {request.requester?.display_name || 'User'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={handleAccept}
          disabled={acting}
          style={{
            backgroundColor: '#3D8A5A',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 9999,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Accept</Text>
        </Pressable>
        <Pressable
          onPress={handleDecline}
          disabled={acting}
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E5E4E1',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 9999,
          }}
        >
          <Text style={{ color: '#6D6C6A', fontSize: 14, fontWeight: '500' }}>Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function FriendRequestsScreen() {
  const { pendingRequests, acceptFriendRequest, declineFriendRequest, loading } = useFriends();

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
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E4E1' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1918' }}>
          Friend Requests
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {pendingRequests.length === 0 && !loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <Ionicons name="mail-open-outline" size={48} color="#878685" />
            <Text style={{ fontSize: 15, color: '#6D6C6A', marginTop: 16 }}>
              No pending requests
            </Text>
          </View>
        ) : (
          pendingRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAccept={() => handleAccept(request.id)}
              onDecline={() => handleDecline(request.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

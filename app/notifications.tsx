import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationsData } from '@/src/hooks/useNotificationsData';
import type { Notification } from '@/src/services/notifications';
import { SkeletonList } from '@/src/components/ui/Skeleton';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getNotificationIcon(type: Notification['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'friend_request':
    case 'friend_accepted':
      return 'person-add';
    case 'playdate_invite':
    case 'playdate_reminder':
      return 'calendar';
    case 'message':
      return 'chatbubble';
    case 'check_in':
      return 'location';
    case 'system':
    default:
      return 'notifications';
  }
}

function getNotificationColor(type: Notification['type']): string {
  switch (type) {
    case 'friend_request':
    case 'friend_accepted':
      return '#3D8A5A';
    case 'playdate_invite':
    case 'playdate_reminder':
      return '#D89575';
    case 'message':
      return '#3D8A5A';
    case 'check_in':
      return '#3D8A5A';
    case 'system':
    default:
      return '#6D6C6A';
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationsData({
    limit: 20,
    unreadOnly: filter === 'unread',
  });

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    switch (notification.type) {
      case 'friend_request':
      case 'friend_accepted':
        router.push('/(tabs)/profile/friends/requests');
        break;
      case 'playdate_invite':
      case 'playdate_reminder':
        if (notification.data?.playdate_id) {
          router.push(`/playdates/${notification.data.playdate_id}`);
        }
        break;
      case 'message':
        if (notification.data?.conversation_id) {
          router.push(`/messages/${notification.data.conversation_id}`);
        }
        break;
      case 'check_in':
        if (notification.data?.park_id) {
          router.push(`/dog-parks/${notification.data.park_id}`);
        }
        break;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                notifications.map((n) => removeNotification(n.id))
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
            style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View
              style={{
                backgroundColor: '#B5725E',
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
        {notifications.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {unreadCount > 0 && (
              <Pressable onPress={handleMarkAllRead}>
                <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '500' }}>
                  Mark all read
                </Text>
              </Pressable>
            )}
            <Pressable onPress={handleClearAll}>
              <Text style={{ fontSize: 14, color: '#B5725E', fontWeight: '500' }}>
                Clear all
              </Text>
              </Pressable>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
          gap: 24,
        }}
      >
        <Pressable onPress={() => setFilter('all')}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: filter === 'all' ? '600' : '400',
              color: filter === 'all' ? '#3D8A5A' : '#6D6C6A',
            }}
          >
            All
          </Text>
        </Pressable>
        <Pressable onPress={() => setFilter('unread')}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: filter === 'unread' ? '600' : '400',
              color: filter === 'unread' ? '#3D8A5A' : '#6D6C6A',
            }}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </Pressable>
      </View>

      {/* Error State */}
      {error && !loading && (
        <View style={{ padding: 16, backgroundColor: '#F5E8E3' }}>
          <Text style={{ color: '#B5725E' }}>{error}</Text>
          <Pressable onPress={refresh} style={{ marginTop: 8 }}>
            <Text style={{ color: '#3D8A5A', fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <SkeletonList count={6} type="notification" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="notifications-off-outline" size={64} color="#D1D0CD" />
          <Text style={{ fontSize: 16, color: '#6D6C6A', marginTop: 16 }}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {notifications.map((notification) => {
            const icon = getNotificationIcon(notification.type);
            const color = getNotificationColor(notification.type);
            const actor = notification.actor;

            return (
              <Pressable
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: notification.read ? '#FFFFFF' : 'rgba(61, 138, 90, 0.05)',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E4E1',
                }}
              >
                {actor?.avatar_url ? (
                  <Image
                    source={{ uri: actor.avatar_url }}
                    style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
                  />
                ) : actor?.display_name ? (
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: `${color}20`,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '600', color }}>
                      {actor.display_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: `${color}20`,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name={icon} size={24} color={color} />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: notification.read ? '400' : '600',
                      color: '#1A1918',
                    }}
                  >
                    {notification.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6D6C6A', marginTop: 2 }} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#878685', marginTop: 4 }}>
                    {formatRelativeTime(notification.created_at)}
                  </Text>
                </View>

                {!notification.read && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#3D8A5A',
                      marginLeft: 8,
                    }}
                  />
                )}
              </Pressable>
            );
          })}
          
          {/* Load More */}
          {hasMore && (
            <Pressable
              onPress={loadMore}
              disabled={loading}
              style={{
                padding: 16,
                alignItems: 'center',
              }}
            >
              {loading ? (
                <View style={{ paddingVertical: 8 }}>
                  <SkeletonList count={2} type="notification" />
                </View>
              ) : (
                <Text style={{ color: '#3D8A5A', fontWeight: '600' }}>
                  Load more
                </Text>
              )}
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}

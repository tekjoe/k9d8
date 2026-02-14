import { Image, Pressable, Text, View } from 'react-native';
import type { Conversation } from '@/src/types/database';

interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function ConversationListItem({
  conversation,
  currentUserId,
  onPress,
}: ConversationListItemProps) {
  const otherParticipant = conversation.participants?.find(
    (p) => p.user_id !== currentUserId,
  );
  const myParticipant = conversation.participants?.find(
    (p) => p.user_id === currentUserId,
  );

  const isUnread =
    myParticipant &&
    new Date(conversation.last_message_at) >
      new Date(myParticipant.last_read_at);

  const displayName =
    otherParticipant?.profile?.display_name || 'Unknown User';
  const avatarUrl = otherParticipant?.profile?.avatar_url;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-3.5 bg-white active:bg-gray-50"
    >
      {/* Avatar */}
      <Image
        source={{
          uri:
            avatarUrl ||
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        }}
        className="w-12 h-12 rounded-full mr-3"
      />

      {/* Content */}
      <View className="flex-1 mr-2">
        <Text
          className={`text-[15px] ${isUnread ? 'font-bold text-text' : 'font-medium text-text'}`}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Text
          className={`text-sm mt-0.5 ${isUnread ? 'font-medium text-text' : 'text-text-secondary'}`}
          numberOfLines={1}
        >
          {conversation.last_message_preview || 'No messages yet'}
        </Text>
      </View>

      {/* Time + Unread indicator */}
      <View className="items-end">
        <Text
          className={`text-xs ${isUnread ? 'text-secondary font-semibold' : 'text-text-secondary'}`}
        >
          {formatRelativeTime(conversation.last_message_at)}
        </Text>
        {isUnread && (
          <View className="w-2.5 h-2.5 rounded-full bg-secondary mt-1.5" />
        )}
      </View>
    </Pressable>
  );
}

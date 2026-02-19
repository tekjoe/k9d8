import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Message } from '@/src/types/database';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReport?: (messageId: string) => void;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MessageBubble({ message, isOwn, onReport }: MessageBubbleProps) {
  const handleLongPress = useCallback(() => {
    if (isOwn || !onReport) return;
    onReport(message.id);
  }, [isOwn, onReport, message.id]);

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={500}
      disabled={isOwn || !onReport}
    >
      <View className={`mb-2 px-4 ${isOwn ? 'items-end' : 'items-start'}`}>
        <View
          className={`max-w-[80%] px-3.5 py-2.5 ${
            isOwn
              ? 'bg-secondary rounded-2xl rounded-br-md'
              : 'bg-[#EDECEA] rounded-2xl rounded-bl-md'
          }`}
        >
          <Text
            className={`text-[15px] ${isOwn ? 'text-white' : 'text-text'}`}
          >
            {message.content}
          </Text>
        </View>
        <Text className="text-[11px] text-text-secondary mt-1 px-1">
          {formatTime(message.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}

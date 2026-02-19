import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useAuth } from '@/src/hooks/useAuth';
import { useMessages } from '@/src/hooks/useMessages';
import { useConversations } from '@/src/hooks/useConversations';
import { getBlockStatus } from '@/src/services/blocks';
import MessageBubble from '@/src/components/messages/MessageBubble';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { messages, loading, sendMessage, loadMore, hasMore } = useMessages(
    id!,
  );
  const { conversations } = useConversations();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Find the other participant's name
  const conversation = conversations.find((c) => c.id === id);
  const otherParticipant = conversation?.participants?.find(
    (p) => p.user_id !== userId,
  );
  const otherUserId = otherParticipant?.user_id;
  const displayName =
    otherParticipant?.profile?.display_name || 'Conversation';
  const avatarUrl = otherParticipant?.profile?.avatar_url;

  // Check if blocked
  useEffect(() => {
    if (!otherUserId) return;
    getBlockStatus(otherUserId).then((status) => {
      if (status === 'blocked' || status === 'blocked_by') {
        setIsBlocked(true);
      }
    });
  }, [otherUserId]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText('');
    try {
      await sendMessage(trimmed);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || err?.error_description || '';
      if (code === '42501' || msg.includes('Cannot message') || msg.includes('blocked') || msg.includes('row-level security')) {
        setIsBlocked(true);
      } else {
        console.error('Failed to send message:', err);
        setText(trimmed);
      }
    } finally {
      setSending(false);
    }
  }, [text, sending, sendMessage]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3D8A5A" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        className="flex-row items-center px-4 pb-3 border-b border-border bg-white"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable onPress={handleBack} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
        <Image
          source={{
            uri:
              avatarUrl ||
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
          }}
          className="w-9 h-9 rounded-full mr-3"
        />
        <Text
          className="text-base font-semibold text-text flex-1"
          numberOfLines={1}
        >
          {displayName}
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === userId}
            />
          )}
          contentContainerStyle={{ paddingVertical: 16 }}
          onEndReached={() => {
            if (hasMore) loadMore();
          }}
          onEndReachedThreshold={0.1}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center pt-20">
              <Text className="text-sm text-text-secondary">
                Send a message to start the conversation
              </Text>
            </View>
          }
        />

        {/* Input Area */}
        <View
          className="flex-row items-end px-4 pt-2 border-t border-border bg-white"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <TextInput
            className="flex-1 bg-[#EDECEA] rounded-2xl px-4 py-2.5 text-[15px] text-text mr-2 max-h-[100px]"
            placeholder={isBlocked ? 'This user has blocked you' : 'Message...'}
            placeholderTextColor={isBlocked ? '#B5725E' : '#878685'}
            value={text}
            onChangeText={setText}
            multiline
            returnKeyType="send"
            blurOnSubmit={false}
            editable={!isBlocked}
          />
          <Pressable
            onPress={handleSend}
            disabled={isBlocked || !text.trim() || sending}
            className={`w-10 h-10 rounded-full justify-center items-center mb-0.5 ${
              !isBlocked && text.trim() ? 'bg-secondary' : 'bg-[#E5E4E1]'
            }`}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

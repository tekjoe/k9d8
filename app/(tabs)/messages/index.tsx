import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/hooks/useAuth';
import { useConversations } from '@/src/hooks/useConversations';
import ConversationListItem from '@/src/components/messages/ConversationListItem';
import type { Conversation } from '@/src/types/database';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { conversations, loading, refresh } = useConversations();

  const handleConversationPress = (conversation: Conversation) => {
    router.push(`/messages/${conversation.id}` as never);
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 py-4 border-b border-border">
        <Text className="text-[28px] font-bold text-text">Messages</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3D8A5A" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationListItem
              conversation={item}
              currentUserId={userId!}
              onPress={() => handleConversationPress(item)}
            />
          )}
          onRefresh={refresh}
          refreshing={loading}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-border ml-[76px]" />
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center px-8 pt-32">
              <Text className="text-lg font-semibold text-text mb-2">
                No messages yet
              </Text>
              <Text className="text-sm text-text-secondary text-center">
                Start a conversation by visiting a park and messaging other dog
                owners!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

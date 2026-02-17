import React, { useCallback, useRef, useState } from 'react';
import { SEOHead } from '@/src/components/seo';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DesktopSidebar from '@/src/components/ui/DesktopSidebar';
import { useAuth } from '@/src/hooks/useAuth';
import { useConversations } from '@/src/hooks/useConversations';
import { useMessages } from '@/src/hooks/useMessages';
import { Colors } from '@/src/constants/colors';
import type { Conversation, Message } from '@/src/types/database';

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

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  isSelected: boolean;
  onPress: () => void;
}

function ConversationItem({
  conversation,
  currentUserId,
  isSelected,
  onPress,
}: ConversationItemProps) {
  const otherParticipant = conversation.participants?.find(
    (p) => p.user_id !== currentUserId
  );
  const myParticipant = conversation.participants?.find(
    (p) => p.user_id === currentUserId
  );

  const isUnread =
    myParticipant &&
    new Date(conversation.last_message_at) > new Date(myParticipant.last_read_at);

  const displayName = otherParticipant?.profile?.display_name || 'Unknown User';
  const avatarUrl = otherParticipant?.profile?.avatar_url;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingHorizontal: 20,
        backgroundColor: isSelected ? 'rgba(45, 139, 87, 0.1)' : pressed ? '#F5F4F1' : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E4E1',
      })}
    >
      <Image
        source={{
          uri: avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        }}
        style={{ width: 52, height: 52, borderRadius: 26, marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: isUnread ? '700' : '600',
            color: '#1A1918',
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: isUnread ? '500' : '400',
            color: isUnread ? '#1A1918' : '#6D6C6A',
          }}
          numberOfLines={1}
        >
          {conversation.last_message_preview || 'No messages yet'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: isUnread ? '600' : '500',
            color: isUnread ? '#3D8A5A' : '#878685',
          }}
        >
          {formatRelativeTime(conversation.last_message_at)}
        </Text>
        {isUnread && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#3D8A5A',
              marginTop: 6,
            }}
          />
        )}
      </View>
    </Pressable>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  avatarUrl?: string | null;
}

function MessageBubbleWeb({ message, isOwn, showAvatar, avatarUrl }: MessageBubbleProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        marginBottom: 16,
        gap: 12,
      }}
    >
      {!isOwn && (
        <View style={{ width: 36, height: 36 }}>
          {showAvatar && (
            <Image
              source={{
                uri: avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
              }}
              style={{ width: 36, height: 36, borderRadius: 18 }}
            />
          )}
        </View>
      )}
      <View style={{ maxWidth: '60%' }}>
        <View
          style={{
            backgroundColor: isOwn ? '#3D8A5A' : '#EDECEA',
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ fontSize: 15, color: isOwn ? '#fff' : '#1A1918', lineHeight: 22 }}>
            {message.content}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 11,
            color: '#878685',
            marginTop: 4,
            textAlign: isOwn ? 'right' : 'left',
            paddingHorizontal: 4,
          }}
        >
          {formatMessageTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
}

interface ThreadPanelProps {
  conversation: Conversation | null;
  currentUserId: string;
  hideHeader?: boolean;
}

function ThreadPanel({ conversation, currentUserId, hideHeader = false }: ThreadPanelProps) {
  const { messages, loading, sendMessage, loadMore, hasMore } = useMessages(
    conversation?.id || ''
  );
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const otherParticipant = conversation?.participants?.find(
    (p) => p.user_id !== currentUserId
  );
  const displayName = otherParticipant?.profile?.display_name || 'Select a conversation';
  const avatarUrl = otherParticipant?.profile?.avatar_url;

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !conversation) return;

    setSending(true);
    setText('');
    try {
      await sendMessage(trimmed);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }, [text, sending, sendMessage, conversation]);

  if (!conversation) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chatbubbles-outline" size={64} color="#D1D0CD" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#6D6C6A', marginTop: 16 }}>
          Select a conversation
        </Text>
        <Text style={{ fontSize: 14, color: '#878685', marginTop: 4 }}>
          Choose a conversation from the list to start messaging
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', flexDirection: 'column' }}>
      {/* Thread Header - hidden on mobile since mobile has its own header */}
      {!hideHeader && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 20,
            paddingHorizontal: 32,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E4E1',
            gap: 16,
          }}
        >
          <Image
            source={{
              uri: avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
            }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>{displayName}</Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#3D8A5A', marginTop: 2 }}>
              Active now
            </Text>
          </View>
        </View>
      )}

      {/* Messages Area */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3D8A5A" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showAvatar = !prevMessage || prevMessage.sender_id !== item.sender_id;
            return (
              <MessageBubbleWeb
                message={item}
                isOwn={item.sender_id === currentUserId}
                showAvatar={showAvatar}
                avatarUrl={avatarUrl}
              />
            );
          }}
          contentContainerStyle={{ padding: 32, paddingBottom: 16 }}
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
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
              <Text style={{ fontSize: 14, color: '#6D6C6A' }}>
                Send a message to start the conversation
              </Text>
            </View>
          }
        />
      )}

      {/* Input Area */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          paddingHorizontal: 32,
          borderTopWidth: 1,
          borderTopColor: '#E5E4E1',
          gap: 12,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#EDECEA',
            borderRadius: 24,
            paddingHorizontal: 16,
            height: 48,
            gap: 12,
          }}
        >
          <Ionicons name="happy-outline" size={20} color="#878685" />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#878685"
            style={{
              flex: 1,
              fontSize: 15,
              color: '#1A1918',
              outlineWidth: 0,
            } as any}
            onSubmitEditing={handleSend}
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || sending}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: text.trim() ? '#3D8A5A' : '#E5E4E1',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function DesktopMessagesScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const showSidebar = width >= 768;

  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const { conversations, loading } = useConversations();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const otherParticipant = conv.participants?.find((p) => p.user_id !== userId);
    const name = otherParticipant?.profile?.display_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
    if (isMobile) {
      setMobileShowThread(true);
    }
  }, [isMobile]);

  const handleBackToList = useCallback(() => {
    setMobileShowThread(false);
  }, []);

  // Mobile: Show either list or thread
  if (isMobile) {
    if (mobileShowThread && selectedConversation) {
      return (
        <>
        <SEOHead title="Messages" description="Chat with other dog owners on k9d8." url="/messages" />
        <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
          {/* Mobile Thread Header with Back Button */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E4E1',
            }}
          >
            <Pressable onPress={handleBackToList} style={{ marginRight: 12, padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </Pressable>
            <Image
              source={{
                uri:
                  selectedConversation.participants?.find((p) => p.user_id !== userId)?.profile?.avatar_url ||
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
              }}
              style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }}>
                {selectedConversation.participants?.find((p) => p.user_id !== userId)?.profile?.display_name || 'Unknown'}
              </Text>
              <Text style={{ fontSize: 12, color: '#3D8A5A' }}>Active now</Text>
            </View>
          </View>
          <ThreadPanel conversation={selectedConversation} currentUserId={userId} hideHeader />
        </View>
        </>
      );
    }

    // Mobile List View
    return (
      <>
      <SEOHead title="Messages" description="Chat with other dog owners on k9d8." url="/messages" />
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E4E1' }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1918', marginBottom: 16 }}>Messages</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F5F4F1',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Ionicons name="search" size={20} color="#878685" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search messages..."
              placeholderTextColor="#878685"
              style={{ flex: 1, marginLeft: 8, fontSize: 15, color: '#1A1918' }}
            />
          </View>
        </View>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#3D8A5A" />
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }}>
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                currentUserId={userId}
                isSelected={conv.id === selectedConversationId}
                onPress={() => handleSelectConversation(conv)}
              />
            ))}
            {filteredConversations.length === 0 && (
              <View style={{ alignItems: 'center', paddingTop: 80 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918', marginBottom: 8 }}>
                  No messages yet
                </Text>
                <Text style={{ fontSize: 14, color: '#6D6C6A', textAlign: 'center', paddingHorizontal: 32 }}>
                  Start a conversation by visiting a park and messaging other dog owners!
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
      </>
    );
  }

  // Desktop/Tablet Layout
  return (
    <>
    <SEOHead title="Messages" description="Chat with other dog owners on k9d8." url="/messages" />
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F4F1' }}>
      {/* Left Sidebar Navigation */}
      {showSidebar && <DesktopSidebar />}

      {/* Message List Panel */}
      <View
        style={{
          width: isTablet ? 300 : 360,
          backgroundColor: '#fff',
          borderRightWidth: 1,
          borderRightColor: '#E5E4E1',
          flexDirection: 'column',
        }}
      >
        {/* List Header */}
        <View
          style={{
            padding: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E4E1',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '600', color: '#1A1918', marginBottom: 16 }}>
            Messages
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F5F4F1',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Ionicons name="search" size={20} color="#878685" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search message history"
              placeholderTextColor="#878685"
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 15,
                color: '#1A1918',
                outlineWidth: 0,
              } as any}
            />
          </View>
        </View>

        {/* Conversations List */}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#3D8A5A" />
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }}>
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                currentUserId={userId}
                isSelected={conv.id === selectedConversationId}
                onPress={() => handleSelectConversation(conv)}
              />
            ))}
            {filteredConversations.length === 0 && (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Text style={{ fontSize: 14, color: '#6D6C6A' }}>
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Message Thread Panel */}
      <ThreadPanel conversation={selectedConversation} currentUserId={userId} />
    </View>
    </>
  );
}

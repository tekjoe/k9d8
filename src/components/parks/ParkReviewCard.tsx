import React, { useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ParkReview, ReportReason } from '../../types/database';

const REPORT_REASONS: { label: string; value: ReportReason }[] = [
  { label: 'Spam', value: 'spam' },
  { label: 'Harassment', value: 'harassment' },
  { label: 'Hate Speech', value: 'hate_speech' },
  { label: 'Inappropriate', value: 'inappropriate' },
  { label: 'Other', value: 'other' },
];

function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

interface ParkReviewCardProps {
  review: ParkReview;
  onVote: (reviewId: string) => void;
  onDelete: (reviewId: string) => void;
  onReport: (reviewId: string, reason: ReportReason) => void;
  onReply?: (content: string, parentId: string) => Promise<void>;
  isOwner: boolean;
  isAuthenticated: boolean;
  isReply?: boolean;
}

export default function ParkReviewCard({
  review,
  onVote,
  onDelete,
  onReport,
  onReply,
  isOwner,
  isAuthenticated,
  isReply = false,
}: ParkReviewCardProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  function handleReport() {
    if (Platform.OS === 'web') {
      const reason = window.prompt('Why are you reporting this review?\n(spam, harassment, hate_speech, inappropriate, other)');
      if (reason) {
        const match = REPORT_REASONS.find(r => r.value === reason.trim().toLowerCase());
        onReport(review.id, match?.value ?? 'other');
      }
      return;
    }
    Alert.alert(
      'Report Review',
      'Why are you reporting this review?',
      [
        ...REPORT_REASONS.map((r) => ({
          text: r.label,
          onPress: () => onReport(review.id, r.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  }

  function handleDelete() {
    if (Platform.OS === 'web') {
      setShowDeleteModal(true);
      return;
    }
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(review.id) },
      ],
    );
  }

  function confirmDelete() {
    setShowDeleteModal(false);
    onDelete(review.id);
  }

  async function handleSubmitReply() {
    if (!replyText.trim() || !onReply) return;
    setSubmitting(true);
    try {
      await onReply(replyText.trim(), review.id);
      setReplyText('');
      setShowReplyInput(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post reply';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }

  const avatarUrl = review.user?.avatar_url;

  return (
    <View style={{ marginLeft: isReply ? 16 : 0 }}>
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}
            />
          ) : (
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E4E1', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
              <Ionicons name="person" size={14} color="#878685" />
            </View>
          )}
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918', flex: 1 }}>
            {review.user?.display_name || 'User'}
          </Text>
          <Text style={{ fontSize: 12, color: '#878685' }}>
            {formatRelativeDate(review.created_at)}
          </Text>
        </View>

        {/* Content */}
        <Text style={{ fontSize: 14, color: '#1A1918', lineHeight: 20, marginBottom: 10 }}>
          {review.content}
        </Text>

        {/* Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {isAuthenticated && (
            <Pressable
              onPress={() => onVote(review.id)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons
                name={review.user_has_voted ? 'heart' : 'heart-outline'}
                size={16}
                color={review.user_has_voted ? '#E5534B' : '#878685'}
              />
              <Text style={{ fontSize: 13, color: '#6D6C6A', marginLeft: 4 }}>
                {review.vote_count ?? 0}
              </Text>
            </Pressable>
          )}

          {isAuthenticated && !isReply && onReply && (
            <Pressable
              onPress={() => setShowReplyInput(!showReplyInput)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="chatbubble-outline" size={14} color="#878685" />
              <Text style={{ fontSize: 13, color: '#6D6C6A', marginLeft: 4 }}>Reply</Text>
            </Pressable>
          )}

          {isAuthenticated && !isOwner && (
            <Pressable onPress={handleReport}>
              <Ionicons name="flag-outline" size={14} color="#878685" />
            </Pressable>
          )}

          {isOwner && (
            <Pressable onPress={handleDelete}>
              <Ionicons name="trash-outline" size={14} color="#B5725E" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Reply Input */}
      {showReplyInput && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: 16 }}>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Write a reply..."
            placeholderTextColor="#878685"
            multiline
            style={{
              flex: 1,
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 10,
              fontSize: 14,
              color: '#1A1918',
              maxHeight: 80,
              borderWidth: 1,
              borderColor: '#E5E4E1',
            }}
          />
          <Pressable
            onPress={handleSubmitReply}
            disabled={!replyText.trim() || submitting}
            style={{
              marginLeft: 8,
              backgroundColor: replyText.trim() ? '#3D8A5A' : '#EDECEA',
              borderRadius: 20,
              width: 36,
              height: 36,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="send" size={16} color={replyText.trim() ? '#fff' : '#878685'} />
          </Pressable>
        </View>
      )}

      {/* Threaded Replies */}
      {review.replies && review.replies.length > 0 && (
        <View>
          {review.replies.map((reply) => (
            <ParkReviewCard
              key={reply.id}
              review={reply}
              onVote={onVote}
              onDelete={onDelete}
              onReport={onReport}
              isOwner={reply.user_id === (isOwner ? review.user_id : '')}
              isAuthenticated={isAuthenticated}
              isReply
            />
          ))}
        </View>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          onPress={() => setShowDeleteModal(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              width: 320,
              alignItems: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={32} color="#B5725E" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginBottom: 8 }}>
              Delete Review
            </Text>
            <Text style={{ fontSize: 14, color: '#6D6C6A', textAlign: 'center', marginBottom: 20 }}>
              Are you sure you want to delete this review? This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 9999,
                  backgroundColor: '#F5F4F2',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6D6C6A' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 9999,
                  backgroundColor: '#B5725E',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

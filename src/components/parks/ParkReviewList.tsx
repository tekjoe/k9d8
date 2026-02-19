import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useParkReviews } from '../../hooks/useParkReviews';
import ParkReviewCard from './ParkReviewCard';

interface ParkReviewListProps {
  parkId: string;
  isAuthenticated: boolean;
  userId?: string;
}

export default function ParkReviewList({
  parkId,
  isAuthenticated,
  userId,
}: ParkReviewListProps) {
  const {
    reviews,
    loading,
    sortBy,
    setSortBy,
    createReview,
    vote,
    deleteReview,
    report,
  } = useParkReviews(parkId);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showInput, setShowInput] = useState(false);

  async function handleSubmit() {
    if (!reviewText.trim()) return;
    setSubmitting(true);
    try {
      await createReview(reviewText.trim());
      setReviewText('');
      setShowInput(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post review';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(content: string, parentId: string) {
    await createReview(content, parentId);
  }

  if (loading) {
    return (
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginBottom: 12 }}>
          Reviews
        </Text>
        <ActivityIndicator size="small" color="#3D8A5A" />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 24 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>
          Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
        </Text>
        {isAuthenticated && !showInput && (
          <Pressable
            onPress={() => setShowInput(true)}
            style={{
              backgroundColor: '#3D8A5A',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 9999,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Write a Review</Text>
          </Pressable>
        )}
      </View>

      {/* Sort Toggle */}
      {reviews.length > 1 && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <Pressable
            onPress={() => setSortBy('votes')}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 9999,
              backgroundColor: sortBy === 'votes' ? '#1A1918' : '#F5F4F2',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: sortBy === 'votes' ? '#fff' : '#6D6C6A' }}>
              Top
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortBy('recent')}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 9999,
              backgroundColor: sortBy === 'recent' ? '#1A1918' : '#F5F4F2',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: sortBy === 'recent' ? '#fff' : '#6D6C6A' }}>
              Recent
            </Text>
          </Pressable>
        </View>
      )}

      {/* Review Input */}
      {showInput && (
        <View style={{ marginBottom: 12 }}>
          <TextInput
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your experience at this park..."
            placeholderTextColor="#878685"
            multiline
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 14,
              fontSize: 14,
              color: '#1A1918',
              minHeight: 80,
              maxHeight: 160,
              borderWidth: 1,
              borderColor: '#E5E4E1',
              textAlignVertical: 'top',
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={() => { setShowInput(false); setReviewText(''); }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 9999,
                backgroundColor: '#F5F4F2',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#6D6C6A' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!reviewText.trim() || submitting}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 9999,
                backgroundColor: reviewText.trim() ? '#3D8A5A' : '#EDECEA',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: reviewText.trim() ? '#fff' : '#878685' }}>
                {submitting ? 'Posting...' : 'Post'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Reviews */}
      {reviews.length > 0 ? (
        <View>
          {reviews.map((review) => (
            <ParkReviewCard
              key={review.id}
              review={review}
              onVote={vote}
              onDelete={deleteReview}
              onReport={report}
              onReply={handleReply}
              isOwner={review.user_id === userId}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </View>
      ) : (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' }}>
          <Ionicons name="chatbubbles-outline" size={32} color="#878685" style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 14, color: '#6D6C6A', textAlign: 'center' }}>
            {isAuthenticated ? 'Be the first to review this park!' : 'Sign in to write a review'}
          </Text>
        </View>
      )}

      {/* Log in CTA below reviews for unauthenticated users */}
      {!isAuthenticated && reviews.length > 0 && (
        <View
          style={{
            backgroundColor: '#EDECEA',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 9999,
            alignSelf: 'center',
            marginTop: 12,
          }}
        >
          <Text style={{ color: '#878685', fontWeight: '600', fontSize: 14 }}>
            Log in to leave a review
          </Text>
        </View>
      )}
    </View>
  );
}

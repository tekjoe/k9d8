import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  getParkReviews,
  createParkReview,
  voteParkReview,
  deleteParkReview,
  reportParkReview,
} from '../services/parkReviews';
import { useAuth } from './useAuth';
import type { ParkReview, ReportReason } from '../types/database';

interface UseParkReviewsReturn {
  reviews: ParkReview[];
  loading: boolean;
  sortBy: 'votes' | 'recent';
  setSortBy: (sort: 'votes' | 'recent') => void;
  createReview: (content: string, parentId?: string) => Promise<void>;
  vote: (reviewId: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  report: (reviewId: string, reason: ReportReason) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useParkReviews(parkId: string | undefined): UseParkReviewsReturn {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [reviews, setReviews] = useState<ParkReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');

  const fetchReviews = useCallback(async () => {
    if (!parkId) return;
    try {
      const data = await getParkReviews(parkId, userId);
      setReviews(data);
    } catch (err) {
      console.warn('Failed to fetch park reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [parkId, userId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Real-time subscription
  useEffect(() => {
    if (!parkId) return;

    const channel = supabase
      .channel(`park-reviews:${parkId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'park_reviews', filter: `park_id=eq.${parkId}` },
        () => { fetchReviews(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'park_review_votes' },
        () => { fetchReviews(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parkId, fetchReviews]);

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'votes') {
      return (b.vote_count ?? 0) - (a.vote_count ?? 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const createReviewFn = useCallback(async (content: string, parentId?: string) => {
    if (!parkId) throw new Error('No park selected');
    await createParkReview(parkId, content, parentId);
    await fetchReviews();
  }, [parkId, fetchReviews]);

  const vote = useCallback(async (reviewId: string) => {
    // Optimistic update (for both top-level and replies)
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        const wasVoted = r.user_has_voted;
        return { ...r, user_has_voted: !wasVoted, vote_count: (r.vote_count ?? 0) + (wasVoted ? -1 : 1) };
      }
      if (r.replies) {
        return {
          ...r,
          replies: r.replies.map(reply => {
            if (reply.id === reviewId) {
              const wasVoted = reply.user_has_voted;
              return { ...reply, user_has_voted: !wasVoted, vote_count: (reply.vote_count ?? 0) + (wasVoted ? -1 : 1) };
            }
            return reply;
          }),
        };
      }
      return r;
    }));

    try {
      await voteParkReview(reviewId);
    } catch {
      fetchReviews();
    }
  }, [fetchReviews]);

  const deleteReviewFn = useCallback(async (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    try {
      await deleteParkReview(reviewId);
    } catch {
      fetchReviews();
    }
  }, [fetchReviews]);

  const report = useCallback(async (reviewId: string, reason: ReportReason) => {
    await reportParkReview(reviewId, reason);
  }, []);

  return {
    reviews: sortedReviews,
    loading,
    sortBy,
    setSortBy,
    createReview: createReviewFn,
    vote,
    deleteReview: deleteReviewFn,
    report,
    refresh: fetchReviews,
  };
}

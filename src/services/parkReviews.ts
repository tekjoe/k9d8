import { supabase } from '../lib/supabase';
import { filterMessage } from './wordFilter';
import type { ParkReview, ReportReason } from '../types/database';

export async function createParkReview(
  parkId: string,
  content: string,
  parentId?: string,
): Promise<ParkReview> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const filterResult = filterMessage(content);
  if (!filterResult.isClean) {
    throw new Error('Your review contains inappropriate language. Please revise and try again.');
  }

  const { data, error } = await supabase
    .from('park_reviews')
    .insert({
      park_id: parkId,
      user_id: user.id,
      parent_id: parentId || null,
      content,
    })
    .select('*, user:profiles(id, display_name, avatar_url)')
    .single();

  if (error) throw error;
  return { ...data, vote_count: 0, user_has_voted: false } as ParkReview;
}

export async function getParkReviews(
  parkId: string,
  userId?: string,
): Promise<ParkReview[]> {
  const { data: allReviews, error } = await supabase
    .from('park_reviews')
    .select('*, user:profiles(id, display_name, avatar_url)')
    .eq('park_id', parkId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const reviewIds = allReviews.map((r: any) => r.id);

  // Fetch vote counts
  const { data: votes } = await supabase
    .from('park_review_votes')
    .select('review_id')
    .in('review_id', reviewIds);

  const voteCounts: Record<string, number> = {};
  for (const vote of votes ?? []) {
    voteCounts[vote.review_id] = (voteCounts[vote.review_id] || 0) + 1;
  }

  // Check user votes
  const userVotes = new Set<string>();
  if (userId) {
    const { data: myVotes } = await supabase
      .from('park_review_votes')
      .select('review_id')
      .eq('user_id', userId)
      .in('review_id', reviewIds);

    for (const v of myVotes ?? []) {
      userVotes.add(v.review_id);
    }
  }

  // Enrich all reviews
  const enriched: ParkReview[] = allReviews.map((r: any) => ({
    ...r,
    vote_count: voteCounts[r.id] || 0,
    user_has_voted: userVotes.has(r.id),
  }));

  // Separate top-level and replies
  const topLevel: ParkReview[] = [];
  const repliesByParent: Record<string, ParkReview[]> = {};

  for (const review of enriched) {
    if (review.parent_id) {
      if (!repliesByParent[review.parent_id]) {
        repliesByParent[review.parent_id] = [];
      }
      repliesByParent[review.parent_id].push(review);
    } else {
      topLevel.push(review);
    }
  }

  // Sort replies by date ascending (oldest first)
  for (const parentId of Object.keys(repliesByParent)) {
    repliesByParent[parentId].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  // Nest replies under parents
  for (const review of topLevel) {
    review.replies = repliesByParent[review.id] || [];
  }

  return topLevel;
}

export async function voteParkReview(reviewId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('park_review_votes')
    .insert({ review_id: reviewId, user_id: user.id });

  if (error) {
    if (error.code === '23505') {
      await unvoteParkReview(reviewId);
      return;
    }
    throw error;
  }
}

export async function unvoteParkReview(reviewId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('park_review_votes')
    .delete()
    .eq('review_id', reviewId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function deleteParkReview(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from('park_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
}

export async function reportParkReview(
  reviewId: string,
  reason: ReportReason,
  details?: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('park_review_reports').insert({
    reporter_id: user.id,
    review_id: reviewId,
    reason,
    details: details || null,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already reported this review.');
    }
    throw error;
  }
}

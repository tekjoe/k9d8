import { supabase } from '../lib/supabase';
import type { Friendship, Profile } from '../types/database';

const FRIENDSHIP_SELECT = `
  *,
  requester:profiles!requester_id(*),
  addressee:profiles!addressee_id(*)
`;

/**
 * Gets all accepted friends for a user via the database function.
 */
export async function getFriends(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase.rpc('get_friends', { uid: userId });
  if (error) throw error;
  return data as Profile[];
}

/**
 * Gets pending friend requests received by the current user.
 */
export async function getPendingRequests(
  userId: string,
): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(FRIENDSHIP_SELECT)
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Friendship[];
}

/**
 * Gets pending friend requests sent by the current user.
 */
export async function getSentRequests(
  userId: string,
): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(FRIENDSHIP_SELECT)
    .eq('requester_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Friendship[];
}

/**
 * Sends a friend request. Checks both directions to prevent duplicates.
 */
export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<Friendship> {
  // Check if a friendship already exists in either direction
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(
      `and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),` +
        `and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`,
    )
    .maybeSingle();

  if (existing) {
    throw new Error(
      existing.status === 'pending'
        ? 'Friend request already pending'
        : existing.status === 'accepted'
          ? 'Already friends'
          : 'A prior request was declined',
    );
  }

  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId })
    .select(FRIENDSHIP_SELECT)
    .single();

  if (error) throw error;
  return data as Friendship;
}

/**
 * Accepts a friend request.
 */
export async function acceptFriendRequest(
  friendshipId: string,
): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' as const })
    .eq('id', friendshipId);

  if (error) throw error;
}

/**
 * Declines a friend request.
 */
export async function declineFriendRequest(
  friendshipId: string,
): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'declined' as const })
    .eq('id', friendshipId);

  if (error) throw error;
}

/**
 * Removes a friendship (unfriend). Either participant can call this.
 */
export async function removeFriend(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);

  if (error) throw error;
}

/**
 * Removes a friendship by the other user's ID. Looks up the friendship first.
 */
export async function removeFriendByUserId(
  currentUserId: string,
  friendUserId: string,
): Promise<void> {
  const friendship = await getFriendshipStatus(currentUserId, friendUserId);
  if (!friendship) throw new Error('Friendship not found');
  await removeFriend(friendship.id);
}

/**
 * Gets recent accepted friendships for a user (for activity feed).
 */
export async function getRecentFriendships(
  userId: string,
  limit: number = 10,
): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(FRIENDSHIP_SELECT)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Friendship[];
}

/**
 * Gets the friendship record between two users, or null if none exists.
 */
export async function getFriendshipStatus(
  userId: string,
  otherUserId: string,
): Promise<Friendship | null> {
  const { data, error } = await supabase
    .from('friendships')
    .select(FRIENDSHIP_SELECT)
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),` +
        `and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`,
    )
    .maybeSingle();

  if (error) throw error;
  return data as Friendship | null;
}

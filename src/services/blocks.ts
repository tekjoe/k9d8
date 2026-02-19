import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

/**
 * Block a user. This also auto-removes any existing friendship via DB trigger.
 */
export async function blockUser(blockedId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: user.id, blocked_id: blockedId });

  if (error) throw error;
}

/**
 * Unblock a user.
 */
export async function unblockUser(blockedId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId);

  if (error) throw error;
}

/**
 * Get the block status between the current user and another user.
 * Returns 'blocked' (I blocked them), 'blocked_by' (they blocked me), or null.
 */
export async function getBlockStatus(
  otherUserId: string,
): Promise<'blocked' | 'blocked_by' | null> {
  const { data, error } = await supabase.rpc('get_block_status', {
    other_uid: otherUserId,
  });

  if (error) throw error;
  return data as 'blocked' | 'blocked_by' | null;
}

/**
 * Get all users blocked by the current user.
 */
export async function getBlockedUsers(): Promise<Profile[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked:profiles!blocked_id(*)')
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row: any) => row.blocked as Profile);
}

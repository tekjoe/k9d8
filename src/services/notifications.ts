import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import type { PushToken } from '../types/database';

/**
 * Registers a push token for the current user.
 */
export async function registerPushToken(
  userId: string,
  token: string,
): Promise<void> {
  const platform = Platform.OS as PushToken['platform'];

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform },
      { onConflict: 'user_id,token' },
    );

  if (error) throw error;
}

/**
 * Removes a push token (on sign-out).
 */
export async function removePushToken(token: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('token', token);

  if (error) throw error;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'playdate_invite' | 'message' | 'check_in' | 'friend_accepted' | 'playdate_reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  actor_id: string | null;
  actor?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  data: {
    friendship_id?: string;
    playdate_id?: string;
    conversation_id?: string;
    park_id?: string;
    check_in_id?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Fetches notifications for the current user.
 */
export async function getNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<Notification[]> {
  const limit = options?.limit ?? 50;
  
  let query = supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id (
        id,
        display_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (options?.unreadOnly) {
    query = query.eq('read', false);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return (data as any[]) || [];
}

/**
 * Fetches the count of unread notifications.
 */
export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);
  
  if (error) throw error;
  return count || 0;
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  
  if (error) throw error;
}

/**
 * Marks all notifications as read for the current user.
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const { error } = await supabase.rpc('mark_all_notifications_read');
  
  if (error) {
    // Fallback if RPC doesn't exist
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);
    
    if (updateError) throw updateError;
  }
}

/**
 * Deletes a notification.
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
  
  if (error) throw error;
}

/**
 * Deletes all read notifications older than 30 days.
 */
export async function cleanupOldNotifications(): Promise<number> {
  const { data, error } = await supabase.rpc('cleanup_old_notifications');
  
  if (error) throw error;
  return data || 0;
}

/**
 * Subscribe to real-time notification updates.
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();
  
  return subscription;
}

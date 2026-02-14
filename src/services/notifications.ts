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

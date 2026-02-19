import { supabase } from '../lib/supabase';
import type { ReportReason } from '../types/database';

export async function reportMessage(
  messageId: string,
  reason: ReportReason,
  details?: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('message_reports').insert({
    reporter_id: user.id,
    message_id: messageId,
    reason,
    details: details || null,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already reported this message.');
    }
    throw error;
  }
}

import { supabase } from '../lib/supabase';
import type { Conversation, Message } from '../types/database';

const CONVERSATION_SELECT = `
  *,
  participants:conversation_participants(
    *,
    profile:profiles!user_id(*)
  )
`;

/**
 * Gets all conversations for the current user, ordered by most recent message.
 */
export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return data as Conversation[];
}

/**
 * Gets or creates a 1-to-1 conversation with another user.
 * Uses the database function to avoid duplicates.
 */
export async function getOrCreateConversation(
  otherUserId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    other_user_id: otherUserId,
  });

  if (error) {
    if (error.message?.includes('Cannot message this user')) {
      throw new Error('You cannot message this user.');
    }
    throw error;
  }
  return data as string;
}

/**
 * Gets messages for a conversation, paginated, newest first.
 * Returns in chronological order for display.
 */
export async function getMessages(
  conversationId: string,
  limit = 50,
  beforeDate?: string,
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (beforeDate) {
    query = query.lt('created_at', beforeDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Message[]).reverse();
}

/**
 * Sends a message to a conversation, then triggers a push notification
 * to the other participant(s) via the edge function.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    })
    .select('*, sender:profiles!sender_id(*)')
    .single();

  if (error) throw error;

  // Fire-and-forget: trigger push notification via edge function
  supabase.functions
    .invoke('push-notification', {
      body: { record: { conversation_id: conversationId, sender_id: senderId, content } },
    })
    .catch(console.error);

  return data as Message;
}

/**
 * Marks a conversation as read by updating last_read_at.
 */
export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) throw error;
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const message = payload.record;

    if (!message?.conversation_id || !message?.sender_id) {
      return new Response('Invalid payload', { status: 400 });
    }

    // Get conversation participants (excluding sender)
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', message.conversation_id)
      .neq('user_id', message.sender_id);

    if (!participants?.length) {
      return new Response('No recipients');
    }

    // Get sender profile for notification title
    const { data: sender } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', message.sender_id)
      .single();

    // Get push tokens for all recipients
    const userIds = participants.map((p: { user_id: string }) => p.user_id);
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);

    if (!tokens?.length) {
      return new Response('No tokens');
    }

    // Send via Expo Push API
    const notifications = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: sender?.display_name || 'New message',
      body: message.content.substring(0, 100),
      data: { conversationId: message.conversation_id },
      sound: 'default',
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(notifications),
    });

    return new Response('OK');
  } catch (err) {
    console.error('Push notification error:', err);
    return new Response('Error', { status: 500 });
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { user_id, park_id } = payload;

    if (!user_id || !park_id) {
      return new Response('Invalid payload', { status: 400 });
    }

    // Get the checking-in user's profile
    const { data: user } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user_id)
      .single();

    // Get the park name
    const { data: park } = await supabase
      .from('parks')
      .select('name')
      .eq('id', park_id)
      .single();

    // Get all friend IDs using the SECURITY DEFINER function
    const { data: friendIds } = await supabase.rpc('get_friend_ids', {
      uid: user_id,
    });

    if (!friendIds?.length) {
      return new Response('No friends');
    }

    // Get push tokens for all friends
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', friendIds);

    if (!tokens?.length) {
      return new Response('No tokens');
    }

    const userName = user?.display_name || 'Your friend';
    const parkName = park?.name || 'a dog park';

    // Send via Expo Push API
    const notifications = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: `${userName} just checked in!`,
      body: `${userName} is at ${parkName} right now.`,
      data: { type: 'friend_checkin', parkId: park_id, userId: user_id },
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
    console.error('Friend check-in notification error:', err);
    return new Response('Error', { status: 500 });
  }
});

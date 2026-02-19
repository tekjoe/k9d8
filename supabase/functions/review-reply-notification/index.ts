import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { reply_id, parent_id, replier_id, park_id } = payload;

    if (!reply_id || !parent_id || !replier_id || !park_id) {
      return new Response('Invalid payload', { status: 400 });
    }

    // Get parent review author
    const { data: parentReview } = await supabase
      .from('park_reviews')
      .select('user_id')
      .eq('id', parent_id)
      .single();

    if (!parentReview) {
      return new Response('Parent review not found', { status: 404 });
    }

    // Skip if replying to own review
    if (parentReview.user_id === replier_id) {
      return new Response('Self-reply, skipping');
    }

    // Get replier's profile
    const { data: replier } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', replier_id)
      .single();

    // Get park info
    const { data: park } = await supabase
      .from('parks')
      .select('name, state')
      .eq('id', park_id)
      .single();

    // Get push tokens for parent review author
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', parentReview.user_id);

    if (!tokens?.length) {
      return new Response('No tokens');
    }

    const replierName = replier?.display_name || 'Someone';
    const parkName = park?.name || 'a dog park';

    // Build slugified park path for deep linking
    let parkPath = park_id;
    if (park?.name && park?.state) {
      const stateSlug = park.state.toLowerCase().replace(/\s+/g, '-');
      const nameSlug = park.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      parkPath = `${stateSlug}/${nameSlug}`;
    }

    // Get reply content preview
    const { data: reply } = await supabase
      .from('park_reviews')
      .select('content')
      .eq('id', reply_id)
      .single();

    const bodyPreview = reply?.content
      ? reply.content.length > 100
        ? reply.content.slice(0, 100) + '...'
        : reply.content
      : '';

    // Send via Expo Push API
    const notifications = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: `${replierName} replied to your review`,
      body: bodyPreview || `${replierName} replied to your review at ${parkName}`,
      data: { type: 'review_reply', parkPath, parkId: park_id, reviewId: parent_id },
      sound: 'default',
      channelId: 'default',
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
    console.error('Review reply notification error:', err);
    return new Response('Error', { status: 500 });
  }
});

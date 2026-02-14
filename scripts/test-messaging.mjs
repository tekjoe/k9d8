import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xsbvvyvjqhacdchfmjjr.supabase.co',
  'sb_publishable_SC_8J8hcUGUE2MHagBP56Q_zQhuFusX',
);

const JOE_ID = '64e8be6f-a39f-4618-93dd-e91417f35409';
const GIUSEPPE_ID = '4be513e3-09a7-4366-8d13-6efc75d054e8';

// Sign in as Joe to use get_or_create_conversation (requires auth)
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email: 'joe@tekjoe.org',
  password: 'test123',
});

if (authErr) {
  console.error('Auth error:', authErr);
  process.exit(1);
}
console.log('Signed in as Joe');

// Create conversation between Joe and Giuseppe
const { data: convId, error: convErr } = await supabase.rpc(
  'get_or_create_conversation',
  { other_user_id: GIUSEPPE_ID },
);

if (convErr) {
  console.error('Conversation error:', convErr);
  process.exit(1);
}
console.log('Conversation ID:', convId);

// Send a message from Joe to Giuseppe
const { data: msg, error: msgErr } = await supabase
  .from('messages')
  .insert({
    conversation_id: convId,
    sender_id: JOE_ID,
    content: 'Hey Giuseppe! Saw you at the park, is your pup friendly? 🐕',
  })
  .select()
  .single();

if (msgErr) {
  console.error('Message error:', msgErr);
  process.exit(1);
}
console.log('Message sent:', msg.id);

// Send a second message
const { error: msg2Err } = await supabase
  .from('messages')
  .insert({
    conversation_id: convId,
    sender_id: JOE_ID,
    content: 'Would love to set up a play date sometime!',
  });

if (msg2Err) {
  console.error('Message 2 error:', msg2Err);
} else {
  console.log('Second message sent');
}

console.log('Done! Check the Messages tab as Giuseppe.');

-- ============================================================
-- Fix infinite recursion in conversation_participants RLS policy
-- ============================================================
-- The old SELECT policy on conversation_participants did a self-join
-- which caused infinite recursion when messages/conversations policies
-- also queried conversation_participants.
--
-- Fix: use a SECURITY DEFINER helper function to bypass RLS when
-- checking participant membership, breaking the recursion cycle.

-- Helper function that checks if a user is in a conversation (bypasses RLS)
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id
    AND user_id = uid
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
-- Drop old recursive policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view participants of own conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
-- Recreate policies using the helper function (no more recursion)
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (is_conversation_member(id, auth.uid()));
CREATE POLICY "Users can view participants of own conversations"
  ON conversation_participants FOR SELECT
  USING (is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND is_conversation_member(conversation_id, auth.uid())
  );

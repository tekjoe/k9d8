-- Prevent blocked users from creating conversations or sending messages.
-- This adds block checks to:
--   1. get_or_create_conversation() — blocks creating/retrieving conversations
--   2. messages INSERT RLS policy — blocks sending messages

-- 1. Replace get_or_create_conversation to check for blocks
CREATE OR REPLACE FUNCTION get_or_create_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  block_exists BOOLEAN;
BEGIN
  -- Check if either user has blocked the other
  SELECT EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = auth.uid() AND blocked_id = other_user_id)
       OR (blocker_id = other_user_id AND blocked_id = auth.uid())
  ) INTO block_exists;

  IF block_exists THEN
    RAISE EXCEPTION 'Cannot message this user';
  END IF;

  -- Find existing conversation between current user and the other user
  SELECT cp1.conversation_id INTO conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = auth.uid()
    AND cp2.user_id = other_user_id;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations DEFAULT VALUES RETURNING id INTO conv_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (conv_id, auth.uid()), (conv_id, other_user_id);

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper function to check if sender is blocked by any participant in the conversation
CREATE OR REPLACE FUNCTION is_blocked_in_conversation(conv_id UUID, sender UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM conversation_participants cp
    JOIN user_blocks ub
      ON (ub.blocker_id = cp.user_id AND ub.blocked_id = sender)
       OR (ub.blocker_id = sender AND ub.blocked_id = cp.user_id)
    WHERE cp.conversation_id = conv_id
      AND cp.user_id != sender
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Replace the messages INSERT policy to also check blocks
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND is_conversation_member(messages.conversation_id, auth.uid())
    AND NOT is_blocked_in_conversation(messages.conversation_id, auth.uid())
  );

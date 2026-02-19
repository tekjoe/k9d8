-- Restrict messaging to accepted friends only.
-- Layers on top of existing block checks from 20260218100002.
-- 1. get_or_create_conversation() — requires friendship to create new conversations
-- 2. is_friend_in_conversation() — helper for RLS
-- 3. messages INSERT RLS policy — requires friendship to send messages

-- 1. Replace get_or_create_conversation to also check friendship
CREATE OR REPLACE FUNCTION get_or_create_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  block_exists BOOLEAN;
  friends BOOLEAN;
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

  -- Check if users are friends
  SELECT are_friends(auth.uid(), other_user_id) INTO friends;

  IF NOT friends THEN
    RAISE EXCEPTION 'You must be friends to start a conversation';
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

-- 2. Helper: check if sender is friends with other participants in a conversation
CREATE OR REPLACE FUNCTION is_friend_in_conversation(conv_id UUID, sender UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM conversation_participants cp
    WHERE cp.conversation_id = conv_id
      AND cp.user_id != sender
      AND are_friends(cp.user_id, sender)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Replace messages INSERT policy to also require friendship
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND is_conversation_member(messages.conversation_id, auth.uid())
    AND NOT is_blocked_in_conversation(messages.conversation_id, auth.uid())
    AND is_friend_in_conversation(messages.conversation_id, auth.uid())
  );

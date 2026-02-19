-- Extend block cleanup to remove conversations, messages, and notifications between blocked users
CREATE OR REPLACE FUNCTION public.handle_block_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Remove any existing friendships in either direction
  DELETE FROM friendships
  WHERE (requester_id = NEW.blocker_id AND addressee_id = NEW.blocked_id)
     OR (requester_id = NEW.blocked_id AND addressee_id = NEW.blocker_id);

  -- Find and delete shared conversations (and their messages via CASCADE)
  FOR conv_id IN
    SELECT cp1.conversation_id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2
      ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = NEW.blocker_id
      AND cp2.user_id = NEW.blocked_id
  LOOP
    DELETE FROM conversations WHERE id = conv_id;
  END LOOP;

  -- Remove notifications from the blocked user that were sent to the blocker
  DELETE FROM notifications
  WHERE user_id = NEW.blocker_id
    AND actor_id = NEW.blocked_id;

  -- Remove notifications from the blocker that were sent to the blocked user
  DELETE FROM notifications
  WHERE user_id = NEW.blocked_id
    AND actor_id = NEW.blocker_id;

  RETURN NEW;
END;
$$;

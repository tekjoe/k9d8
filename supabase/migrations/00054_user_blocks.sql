-- User blocks table
CREATE TABLE user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),
  CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);

-- RLS
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Users can see blocks they created or blocks against them
CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

-- Users can block others
CREATE POLICY "Users can block others"
  ON user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock (delete their own blocks)
CREATE POLICY "Users can unblock"
  ON user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- Helper: check if a block exists in either direction between two users
CREATE OR REPLACE FUNCTION public.get_block_status(other_uid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = uid AND blocked_id = other_uid) THEN
    RETURN 'blocked';
  ELSIF EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = other_uid AND blocked_id = uid) THEN
    RETURN 'blocked_by';
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- When a user blocks someone, auto-remove any friendships between them
CREATE OR REPLACE FUNCTION public.handle_block_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove any existing friendships in either direction
  DELETE FROM friendships
  WHERE (requester_id = NEW.blocker_id AND addressee_id = NEW.blocked_id)
     OR (requester_id = NEW.blocked_id AND addressee_id = NEW.blocker_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_block_cleanup
  AFTER INSERT ON user_blocks
  FOR EACH ROW
  EXECUTE FUNCTION handle_block_cleanup();

-- Prevent friend requests between blocked users
CREATE OR REPLACE FUNCTION public.check_block_before_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = NEW.requester_id AND blocked_id = NEW.addressee_id)
       OR (blocker_id = NEW.addressee_id AND blocked_id = NEW.requester_id)
  ) THEN
    RAISE EXCEPTION 'Cannot send friend request to a blocked user';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_block_before_friendship
  BEFORE INSERT ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION check_block_before_friend_request();

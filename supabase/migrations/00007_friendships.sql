-- ============================================================
-- k9d8 Friendships Schema
-- ============================================================

-- Custom enum for friendship status
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'declined');

-- ============================================================
-- 1. CREATE TABLE
-- ============================================================

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id),
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id, status);

-- ============================================================
-- 2. ENABLE RLS
-- ============================================================

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. SECURITY DEFINER HELPERS
-- ============================================================

-- Check if two users are friends (accepted)
CREATE OR REPLACE FUNCTION are_friends(uid1 UUID, uid2 UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (requester_id = uid1 AND addressee_id = uid2)
      OR (requester_id = uid2 AND addressee_id = uid1)
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get all accepted friend profile IDs for a user
CREATE OR REPLACE FUNCTION get_friend_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT CASE
    WHEN f.requester_id = uid THEN f.addressee_id
    ELSE f.requester_id
  END
  FROM friendships f
  WHERE f.status = 'accepted'
  AND (f.requester_id = uid OR f.addressee_id = uid);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get all accepted friend profiles for a user
CREATE OR REPLACE FUNCTION get_friends(uid UUID)
RETURNS SETOF profiles AS $$
  SELECT p.* FROM profiles p
  JOIN friendships f ON (
    (f.requester_id = uid AND f.addressee_id = p.id)
    OR (f.addressee_id = uid AND f.requester_id = p.id)
  )
  WHERE f.status = 'accepted'
  ORDER BY p.display_name;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

CREATE POLICY "Addressee can respond to friend requests"
  ON friendships FOR UPDATE
  USING (auth.uid() = addressee_id);

CREATE POLICY "Participants can delete friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================

CREATE TRIGGER set_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

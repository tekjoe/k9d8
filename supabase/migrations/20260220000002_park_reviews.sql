-- park_reviews table with threading support
CREATE TABLE park_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES park_reviews(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_park_reviews_park ON park_reviews(park_id);
CREATE INDEX idx_park_reviews_user ON park_reviews(user_id);
CREATE INDEX idx_park_reviews_parent ON park_reviews(parent_id);

ALTER TABLE park_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON park_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON park_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON park_reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER set_park_reviews_updated_at
  BEFORE UPDATE ON park_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- park_review_votes table
CREATE TABLE park_review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES park_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_review_vote UNIQUE (review_id, user_id)
);

CREATE INDEX idx_park_review_votes_review ON park_review_votes(review_id);

ALTER TABLE park_review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review votes"
  ON park_review_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on reviews"
  ON park_review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own review vote"
  ON park_review_votes FOR DELETE
  USING (auth.uid() = user_id);

-- park_review_reports table
CREATE TABLE park_review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES park_reviews(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'inappropriate', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_review_report UNIQUE (reporter_id, review_id)
);

ALTER TABLE park_review_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report reviews"
  ON park_review_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own review reports"
  ON park_review_reports FOR SELECT
  USING (auth.uid() = reporter_id);

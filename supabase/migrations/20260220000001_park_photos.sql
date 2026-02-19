-- Create park-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('park-photos', 'park-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload park photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'park-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own park photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'park-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public park photo access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'park-photos');

-- park_photos table
CREATE TABLE park_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_park_photos_park ON park_photos(park_id);
CREATE INDEX idx_park_photos_user ON park_photos(user_id);

ALTER TABLE park_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view park photos"
  ON park_photos FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload park photos"
  ON park_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own park photos"
  ON park_photos FOR DELETE
  USING (auth.uid() = user_id);

-- park_photo_votes table
CREATE TABLE park_photo_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES park_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_photo_vote UNIQUE (photo_id, user_id)
);

CREATE INDEX idx_park_photo_votes_photo ON park_photo_votes(photo_id);

ALTER TABLE park_photo_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view photo votes"
  ON park_photo_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on photos"
  ON park_photo_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own photo vote"
  ON park_photo_votes FOR DELETE
  USING (auth.uid() = user_id);

-- park_photo_reports table
CREATE TABLE park_photo_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES park_photos(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'offensive', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_photo_report UNIQUE (reporter_id, photo_id)
);

ALTER TABLE park_photo_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report photos"
  ON park_photo_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own photo reports"
  ON park_photo_reports FOR SELECT
  USING (auth.uid() = reporter_id);

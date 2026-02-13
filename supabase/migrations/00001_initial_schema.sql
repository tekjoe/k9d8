-- ============================================================
-- k9d8 Initial Schema
-- ============================================================

-- Custom enums
CREATE TYPE dog_size AS ENUM ('small', 'medium', 'large', 'extra_large');
CREATE TYPE dog_temperament AS ENUM ('calm', 'friendly', 'energetic', 'anxious', 'aggressive');
CREATE TYPE play_date_status AS ENUM ('scheduled', 'cancelled', 'completed');
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'cancelled');

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. DOGS
-- ============================================================
CREATE TABLE dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  size dog_size NOT NULL DEFAULT 'medium',
  temperament dog_temperament NOT NULL DEFAULT 'friendly',
  age_years INTEGER,
  photo_url TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active dogs"
  ON dogs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can insert own dogs"
  ON dogs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own dogs"
  ON dogs FOR UPDATE
  USING (auth.uid() = owner_id);

-- ============================================================
-- 3. PARKS
-- ============================================================
CREATE TABLE parks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  is_fenced BOOLEAN NOT NULL DEFAULT false,
  has_water BOOLEAN NOT NULL DEFAULT false,
  has_shade BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE parks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view parks"
  ON parks FOR SELECT
  USING (true);

-- ============================================================
-- 4. CHECK-INS
-- ============================================================
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_out_at TIMESTAMPTZ
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view check-ins"
  ON check_ins FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own check-ins"
  ON check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins"
  ON check_ins FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable Realtime for check-ins
ALTER PUBLICATION supabase_realtime ADD TABLE check_ins;

CREATE TABLE check_in_dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id UUID NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  UNIQUE(check_in_id, dog_id)
);

ALTER TABLE check_in_dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view check-in dogs"
  ON check_in_dogs FOR SELECT
  USING (true);

CREATE POLICY "Users can insert check-in dogs for own check-ins"
  ON check_in_dogs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM check_ins
      WHERE check_ins.id = check_in_id
      AND check_ins.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. PLAY DATES
-- ============================================================
CREATE TABLE play_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_dogs INTEGER,
  status play_date_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (ends_at > starts_at)
);

ALTER TABLE play_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view play dates"
  ON play_dates FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create play dates"
  ON play_dates FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own play dates"
  ON play_dates FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE TABLE play_date_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_date_id UUID NOT NULL REFERENCES play_dates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL DEFAULT 'going',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(play_date_id, dog_id)
);

ALTER TABLE play_date_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view RSVPs"
  ON play_date_rsvps FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own RSVPs"
  ON play_date_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVPs"
  ON play_date_rsvps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVPs"
  ON play_date_rsvps FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_dogs_updated_at
  BEFORE UPDATE ON dogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_play_dates_updated_at
  BEFORE UPDATE ON play_dates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 7. DOG PHOTOS STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog-photos', 'dog-photos', true);

CREATE POLICY "Anyone can view dog photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dog-photos');

CREATE POLICY "Authenticated users can upload dog photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dog-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own dog photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'dog-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create user-avatars storage bucket for user profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;
-- Allow authenticated users to upload their own avatars
-- Files must be stored in a folder matching their user ID
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
-- Allow authenticated users to update/replace their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
-- Allow public read access to all avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

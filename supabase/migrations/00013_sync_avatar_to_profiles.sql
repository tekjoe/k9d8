-- Sync avatar_url and display_name from auth.users metadata to profiles table
-- This ensures other users can see uploaded avatars via the profiles table

-- Create trigger function to sync auth metadata to profiles on update
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', OLD.raw_user_meta_data->>'avatar_url'),
    display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', OLD.raw_user_meta_data->>'display_name', profiles.display_name)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users updates
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Backfill existing users' avatar_url from auth metadata
UPDATE public.profiles
SET avatar_url = u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE profiles.id = u.id
  AND u.raw_user_meta_data->>'avatar_url' IS NOT NULL
  AND (profiles.avatar_url IS NULL OR profiles.avatar_url = '');

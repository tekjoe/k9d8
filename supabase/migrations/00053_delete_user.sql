-- Allow authenticated users to delete their own account
-- CASCADE on auth.users will clean up profiles, dogs, check_ins, friendships, messages, etc.

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  uid uuid := auth.uid();
  obj record;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete user avatar files from storage
  FOR obj IN
    SELECT name FROM storage.objects
    WHERE bucket_id = 'user-avatars' AND name LIKE uid::text || '/%'
  LOOP
    DELETE FROM storage.objects WHERE bucket_id = 'user-avatars' AND name = obj.name;
  END LOOP;

  -- Delete dog photo files from storage
  FOR obj IN
    SELECT name FROM storage.objects
    WHERE bucket_id = 'dog-photos' AND name LIKE uid::text || '/%'
  LOOP
    DELETE FROM storage.objects WHERE bucket_id = 'dog-photos' AND name = obj.name;
  END LOOP;

  -- Delete the user from auth.users (CASCADE handles all profile/child data)
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION public.delete_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

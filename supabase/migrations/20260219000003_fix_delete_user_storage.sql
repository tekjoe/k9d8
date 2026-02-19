-- Remove direct storage.objects deletion from delete_user().
-- Supabase now blocks direct DELETE on storage tables.
-- Storage cleanup is handled client-side via the Storage API before calling this function.

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete the user from auth.users (CASCADE handles all profile/child data)
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

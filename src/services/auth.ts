import { supabase } from '../lib/supabase';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function updateProfile(updates: { display_name?: string; bio?: string; avatar_url?: string }) {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });
  if (error) throw error;
  return data;
}

export async function uploadUserAvatar(
  userId: string,
  uri: string,
): Promise<string> {
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.jpg`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('user-avatars')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('user-avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

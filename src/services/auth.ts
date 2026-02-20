import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

// Conditionally import Google Sign-In (not available on web)
let GoogleSignin: typeof import('@react-native-google-signin/google-signin').GoogleSignin | null = null;
if (Platform.OS !== 'web') {
  const gsi = require('@react-native-google-signin/google-signin');
  GoogleSignin = gsi.GoogleSignin;
  GoogleSignin?.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
}

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

  // Sync relevant fields to the profiles table so other users see them
  const profileUpdates: Record<string, string> = {};
  if (updates.display_name !== undefined) profileUpdates.display_name = updates.display_name;
  if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', data.user.id);
    if (profileError) throw profileError;
  }

  return data;
}

export async function deleteAccount(): Promise<void> {
  // Refresh session to ensure we have a valid JWT
  const { data: sessionData, error: sessionError } =
    await supabase.auth.refreshSession();
  if (sessionError || !sessionData.session) {
    throw new Error('Session expired. Please sign in again.');
  }

  const { data, error } = await supabase.functions.invoke('delete-account', {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
  });

  if (error) {
    const message = data?.error || error.message || 'Failed to delete account';
    throw new Error(message);
  }

  // Sign out locally (the auth user is already deleted server-side)
  await supabase.auth.signOut({ scope: 'local' });
}

// --- GOOGLE SIGN-IN ---

export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    return signInWithGoogleWeb();
  }
  return signInWithGoogleNative();
}

async function signInWithGoogleNative() {
  if (!GoogleSignin) throw new Error('Google Sign-In not available');

  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  if (!response.data?.idToken) {
    throw new Error('Google Sign-In failed: no ID token returned');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.data.idToken,
  });

  if (error) throw error;
  return data;
}

async function signInWithGoogleWeb() {
  const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || window.location.origin;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: siteUrl,
    },
  });
  if (error) throw error;
  return data;
}

// --- APPLE SIGN-IN ---

export async function signInWithApple() {
  if (Platform.OS === 'ios') {
    return signInWithAppleNative();
  }
  return signInWithAppleWeb();
}

async function signInWithAppleNative() {
  const rawNonce = Math.random().toString(36).substring(2, 18);
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('Apple Sign-In failed: no identity token');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });

  if (error) throw error;

  // Apple only provides the name on the very first sign-in
  if (credential.fullName?.givenName) {
    const displayName = [
      credential.fullName.givenName,
      credential.fullName.familyName,
    ]
      .filter(Boolean)
      .join(' ');

    await supabase.auth.updateUser({ data: { display_name: displayName } });
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', data.user.id);
    }
  }

  return data;
}

async function signInWithAppleWeb() {
  if (Platform.OS === 'web') {
    const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || window.location.origin;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: siteUrl,
      },
    });
    if (error) throw error;
    return data;
  }

  // Android: use web browser for Apple OAuth
  const redirectUrl = makeRedirectUri({ scheme: 'k9d8' });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;

  if (data.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type === 'success') {
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }
  }

  return data;
}

async function readFileForUpload(uri: string): Promise<ArrayBuffer | Blob> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.blob();
  }
  // expo-file-system v19: File.arrayBuffer() reads actual file bytes
  const file = new File(uri);
  return file.arrayBuffer();
}

export async function deleteUserAvatar(userId: string): Promise<void> {
  // List all files in user's avatar folder and remove them
  const { data: files } = await supabase.storage
    .from('user-avatars')
    .list(userId);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('user-avatars').remove(paths);
  }

  // Clear avatar_url from both auth metadata and profiles table
  await updateProfile({ avatar_url: '' });
}

export async function uploadUserAvatar(
  userId: string,
  uri: string,
): Promise<string> {
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.jpg`;

  const fileData = await readFileForUpload(uri);

  const { error: uploadError } = await supabase.storage
    .from('user-avatars')
    .upload(filePath, fileData, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('user-avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

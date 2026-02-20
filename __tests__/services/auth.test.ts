jest.mock('../../src/lib/supabase');

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(), signIn: jest.fn() },
}));

jest.mock('expo-apple-authentication', () => ({
  __esModule: true,
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

jest.mock('expo-crypto', () => ({ digestStringAsync: jest.fn().mockResolvedValue('hashed'), CryptoDigestAlgorithm: { SHA256: 'SHA-256' } }));
jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: jest.fn().mockReturnValue('k9d8://') }));
jest.mock('expo-file-system', () => ({ File: jest.fn().mockImplementation(() => ({ arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)) })) }));

import { signInWithEmail, signUpWithEmail, signOut, updateProfile, deleteAccount, deleteUserAvatar, uploadUserAvatar, signInWithGoogle, signInWithApple } from '../../src/services/auth';
import { supabase } from '../../src/lib/supabase';
import * as AppleAuth from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const mockAppleSignInAsync = AppleAuth.signInAsync as jest.Mock;
const mockGoogleSignin = GoogleSignin as jest.Mocked<typeof GoogleSignin>;

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function mockFrom(resolvedValue: { data: any; error: any }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'list'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('auth service', () => {
  describe('signInWithEmail', () => {
    it('signs in with email and password', async () => {
      const session = { user: { id: 'u1' }, session: {} };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: session, error: null } as any);
      const result = await signInWithEmail('test@test.com', 'pass123');
      expect(result).toEqual(session);
    });

    it('throws on error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid' } } as any);
      await expect(signInWithEmail('bad@test.com', 'wrong')).rejects.toEqual({ message: 'Invalid' });
    });
  });

  describe('signUpWithEmail', () => {
    it('signs up with email, password, and display name', async () => {
      const data = { user: { id: 'u1' }, session: null };
      mockSupabase.auth.signUp.mockResolvedValue({ data, error: null } as any);
      const result = await signUpWithEmail('test@test.com', 'pass123', 'John');
      expect(result).toEqual(data);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'pass123',
        options: { data: { display_name: 'John' } },
      });
    });

    it('throws on error', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ data: null, error: { message: 'exists' } } as any);
      await expect(signUpWithEmail('t@t.com', 'p')).rejects.toEqual({ message: 'exists' });
    });
  });

  describe('signOut', () => {
    it('signs out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null } as any);
      await signOut();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('throws on error', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: { message: 'fail' } } as any);
      await expect(signOut()).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('updateProfile', () => {
    it('updates auth user and syncs to profiles table', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null } as any);
      mockFrom({ data: null, error: null });
      await updateProfile({ display_name: 'New Name' });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ data: { display_name: 'New Name' } });
    });

    it('throws on auth update error', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ data: null, error: { message: 'fail' } } as any);
      await expect(updateProfile({ display_name: 'X' })).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('deleteAccount', () => {
    it('refreshes session, invokes edge function, and signs out', async () => {
      (mockSupabase.auth as any).refreshSession = jest.fn().mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });
      mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null } as any);
      mockSupabase.auth.signOut.mockResolvedValue({ error: null } as any);

      await deleteAccount();
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('delete-account', expect.any(Object));
    });

    it('throws when session is expired', async () => {
      (mockSupabase.auth as any).refreshSession = jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'expired' },
      });
      await expect(deleteAccount()).rejects.toThrow('Session expired');
    });
  });

  describe('uploadUserAvatar', () => {
    it('uploads avatar and returns public URL', async () => {
      const bucket = {
        upload: jest.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/avatar.jpg' } }),
        remove: jest.fn(),
        download: jest.fn(),
        list: jest.fn(),
      };
      mockSupabase.storage.from.mockReturnValue(bucket as any);

      const result = await uploadUserAvatar('u1', 'file:///photo.jpg');
      expect(result).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('deleteUserAvatar', () => {
    it('removes avatar files and clears profile', async () => {
      const bucket = {
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn(),
        list: jest.fn().mockResolvedValue({ data: [{ name: 'avatar.jpg' }], error: null }),
      };
      mockSupabase.storage.from.mockReturnValue(bucket as any);
      mockSupabase.auth.updateUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null } as any);
      mockFrom({ data: null, error: null });

      await deleteUserAvatar('u1');
      expect(bucket.remove).toHaveBeenCalledWith(['u1/avatar.jpg']);
    });

    it('skips remove when no files exist', async () => {
      const bucket = {
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
        download: jest.fn(),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabase.storage.from.mockReturnValue(bucket as any);
      mockSupabase.auth.updateUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null } as any);
      mockFrom({ data: null, error: null });

      await deleteUserAvatar('u1');
      expect(bucket.remove).not.toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    it('throws when edge function returns error', async () => {
      (mockSupabase.auth as any).refreshSession = jest.fn().mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });
      mockSupabase.functions.invoke.mockResolvedValue({ data: { error: 'Server error' }, error: { message: 'invoke failed' } } as any);

      await expect(deleteAccount()).rejects.toThrow('Server error');
    });
  });

  describe('signInWithGoogle', () => {
    it('signs in with Google on native (returns id token)', async () => {
      (mockGoogleSignin.hasPlayServices as jest.Mock).mockResolvedValue(true);
      (mockGoogleSignin.signIn as jest.Mock).mockResolvedValue({ data: { idToken: 'google-token' } });
      mockSupabase.auth.signInWithIdToken.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null } as any);

      const result = await signInWithGoogle();
      expect(result).toEqual({ user: { id: 'u1' } });
      expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: 'google-token',
      });
    });

    it('throws when no ID token returned', async () => {
      (mockGoogleSignin.hasPlayServices as jest.Mock).mockResolvedValue(true);
      (mockGoogleSignin.signIn as jest.Mock).mockResolvedValue({ data: {} });

      await expect(signInWithGoogle()).rejects.toThrow('no ID token');
    });
  });

  describe('signInWithApple', () => {
    it('signs in with Apple on iOS', async () => {
      mockAppleSignInAsync.mockResolvedValue({
        identityToken: 'apple-token',
        fullName: null,
      });
      mockSupabase.auth.signInWithIdToken.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null } as any);

      const result = await signInWithApple();
      expect(result).toEqual({ user: { id: 'u1' } });
    });

    it('throws when no identity token', async () => {
      mockAppleSignInAsync.mockResolvedValue({
        identityToken: null,
        fullName: null,
      });

      await expect(signInWithApple()).rejects.toThrow('no identity token');
    });

    it('updates profile when Apple provides name', async () => {
      mockAppleSignInAsync.mockResolvedValue({
        identityToken: 'apple-token',
        fullName: { givenName: 'John', familyName: 'Doe' },
      });
      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      } as any);
      mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null } as any);
      mockFrom({ data: null, error: null });

      await signInWithApple();
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: { display_name: 'John Doe' },
      });
    });
  });

  describe('uploadUserAvatar', () => {
    it('throws on upload error', async () => {
      const bucket = {
        upload: jest.fn().mockResolvedValue({ data: null, error: { message: 'too large' } }),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
        download: jest.fn(),
        list: jest.fn(),
      };
      mockSupabase.storage.from.mockReturnValue(bucket as any);

      await expect(uploadUserAvatar('u1', 'file:///photo.jpg')).rejects.toEqual({ message: 'too large' });
    });
  });
});

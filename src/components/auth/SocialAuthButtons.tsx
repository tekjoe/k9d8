import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signInWithGoogle, signInWithApple } from '@/src/services/auth';

interface SocialAuthButtonsProps {
  mode: 'sign-in' | 'sign-up';
}

export function SocialAuthButtons({ mode }: SocialAuthButtonsProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verb = mode === 'sign-in' ? 'Sign in' : 'Sign up';
  const anyLoading = googleLoading || appleLoading;

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      if (Platform.OS !== 'web') {
        router.replace('/');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('cancelled')) return;
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleApple() {
    setAppleLoading(true);
    setError(null);
    try {
      await signInWithApple();
      if (Platform.OS !== 'web') {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes('ERR_CANCELED') ||
          err.message.includes('cancelled'))
      )
        return;
      setError(err instanceof Error ? err.message : 'Apple sign-in failed');
    } finally {
      setAppleLoading(false);
    }
  }

  return (
    <View style={{ gap: 12, marginBottom: 24 }}>
      {error && (
        <View
          style={{
            backgroundColor: '#F5E8E3',
            padding: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
        </View>
      )}

      {/* Google Button */}
      <Pressable
        onPress={handleGoogle}
        disabled={anyLoading}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          borderWidth: 1,
          borderColor: '#E5E4E1',
          borderRadius: 12,
          padding: 14,
          backgroundColor: '#fff',
          opacity: anyLoading && !googleLoading ? 0.5 : 1,
        }}
      >
        {googleLoading ? (
          <ActivityIndicator size="small" color="#1A1918" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text
              style={{ fontSize: 15, fontWeight: '600', color: '#1A1918' }}
            >
              {verb} with Google
            </Text>
          </>
        )}
      </Pressable>

      {/* Divider */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          marginVertical: 4,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: '#E5E4E1' }} />
        <Text style={{ fontSize: 13, color: '#878685' }}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#E5E4E1' }} />
      </View>
    </View>
  );
}

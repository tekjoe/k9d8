import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { signInWithEmail } from '@/src/services/auth';
import { SocialAuthButtons } from '@/src/components/auth/SocialAuthButtons';
import NavBar from '@/src/components/web/NavBar';
import Footer from '@/src/components/web/Footer';

export default function SignInWeb() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      let message = 'Sign in failed';
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          message = 'Invalid email or password. If you just signed up, check your email to confirm your account first.';
        } else {
          message = err.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      <NavBar />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: isMobile ? 24 : 48,
          paddingVertical: isMobile ? 40 : 64,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            width: '100%',
            maxWidth: 480,
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: isMobile ? 24 : 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
          }}
        >
          {/* Logo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#3D8A5A',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="paw" size={24} color="#fff" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918' }}>k9d8</Text>
          </View>

          {/* Header */}
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1918', marginBottom: 8 }}>
            Welcome back
          </Text>
          <Text style={{ fontSize: 16, color: '#6D6C6A', marginBottom: 32 }}>
            Sign in to continue
          </Text>

          <SocialAuthButtons mode="sign-in" />

          {/* Error Message */}
          {error && (
            <View
              style={{
                backgroundColor: '#F5E8E3',
                padding: 16,
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={{ gap: 20, marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1918', marginBottom: 8 }}>
                Email
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E4E1',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#fff',
                  color: '#1A1918',
                }}
                placeholder="your@email.com"
                placeholderTextColor="#878685"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1918' }}>
                  Password
                </Text>
                <Pressable>
                  <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '500' }}>
                    Forgot password?
                  </Text>
                </Pressable>
              </View>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E4E1',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#fff',
                  color: '#1A1918',
                }}
                placeholder="••••••••"
                placeholderTextColor="#878685"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                onSubmitEditing={handleSignIn}
              />
            </View>
          </View>

          {/* Sign In Button */}
          <Pressable
            onPress={handleSignIn}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#878685' : '#3D8A5A',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
            )}
          </Pressable>

          {/* Footer */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14, color: '#6D6C6A' }}>Don't have an account?</Text>
            <Link href="/(auth)/sign-up">
              <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '600' }}>Sign up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
      <Footer />
    </View>
  );
}

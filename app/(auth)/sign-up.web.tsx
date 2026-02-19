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

import { signUpWithEmail } from '@/src/services/auth';
import { SocialAuthButtons } from '@/src/components/auth/SocialAuthButtons';
import NavBar from '@/src/components/web/NavBar';
import Footer from '@/src/components/web/Footer';

export default function SignUpWeb() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignUp() {
    if (!email || !password) {
      setError('Please fill in email and password');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, fullName || undefined);
      setSuccess(true);
      setTimeout(() => {
        router.replace('/(auth)/sign-in');
      }, 2000);
    } catch (err: unknown) {
      let message = 'Sign up failed';
      if (err instanceof Error) {
        if (err.message.includes('rate limit')) {
          message = 'Too many attempts. Please wait a few minutes and try again.';
        } else {
          message = err.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
        <NavBar />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#D4E8D4',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Ionicons name="checkmark" size={40} color="#059669" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918', marginBottom: 12, textAlign: 'center' }}>
            Account created!
          </Text>
          <Text style={{ fontSize: 16, color: '#6D6C6A', textAlign: 'center', maxWidth: 300 }}>
            Check your email to confirm your account, then sign in.
          </Text>
        </View>
        <Footer />
      </View>
    );
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
            Create your account
          </Text>
          <Text style={{ fontSize: 16, color: '#6D6C6A', marginBottom: 32 }}>
            Join the pack today
          </Text>

          <SocialAuthButtons mode="sign-up" />

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
                Full Name
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
                placeholder="John Doe"
                placeholderTextColor="#878685"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

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
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1918', marginBottom: 8 }}>
                Password
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
                placeholder="••••••••"
                placeholderTextColor="#878685"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>
          </View>

          {/* Terms Checkbox */}
          <Pressable
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: agreedToTerms ? '#3D8A5A' : '#E5E4E1',
                backgroundColor: agreedToTerms ? '#3D8A5A' : '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{ fontSize: 14, color: '#6D6C6A', flex: 1 }}>
              I agree to the{' '}
              <Text style={{ color: '#3D8A5A', fontWeight: '500' }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: '#3D8A5A', fontWeight: '500' }}>Privacy Policy</Text>
            </Text>
          </Pressable>

          {/* Create Account Button */}
          <Pressable
            onPress={handleSignUp}
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
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create Account</Text>
            )}
          </Pressable>

          {/* Footer */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14, color: '#6D6C6A' }}>Already have an account?</Text>
            <Link href="/(auth)/sign-in">
              <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '600' }}>Sign in</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
      <Footer />
    </View>
  );
}

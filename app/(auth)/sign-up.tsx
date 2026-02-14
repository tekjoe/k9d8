import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
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

// Mobile Web Header Component
function MobileWebHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={{ width: '100%', backgroundColor: '#F7F8FA', zIndex: 100 }}>
      <View 
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingVertical: 16,
        }}
      >
        <Pressable onPress={() => router.push('/')}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A2E' }}>k9d8</Text>
        </Pressable>
        
        <Pressable onPress={() => setMenuOpen(!menuOpen)}>
          <Ionicons name={menuOpen ? 'close' : 'menu'} size={28} color="#1A1A2E" />
        </Pressable>
      </View>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <View 
          style={{ 
            position: 'absolute',
            top: 56,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            paddingHorizontal: 24,
            paddingVertical: 24,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            gap: 20,
            zIndex: 1000,
          }}
        >
          <Pressable onPress={() => { setMenuOpen(false); router.push('/landing'); }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#6B7280' }}>Features</Text>
          </Pressable>
          <Pressable onPress={() => { setMenuOpen(false); router.push('/landing'); }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#6B7280' }}>How it Works</Text>
          </Pressable>
          <Pressable onPress={() => { setMenuOpen(false); router.push('/landing'); }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#6B7280' }}>About</Text>
          </Pressable>
          <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />
          <Pressable onPress={() => { setMenuOpen(false); router.push('/(auth)/sign-in'); }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#1A1A2E' }}>Log In</Text>
          </Pressable>
          <Pressable 
            onPress={() => { setMenuOpen(false); router.push('/(auth)/sign-up'); }}
            style={{ 
              backgroundColor: '#6FCF97', 
              paddingVertical: 14, 
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Sign Up Free</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function SignUp() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 768;
  const isWeb = Platform.OS === 'web';

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
      // Show success message briefly, then redirect
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
      <View style={{ flex: 1, backgroundColor: '#F7F8FA', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View 
          style={{ 
            width: 80, 
            height: 80, 
            borderRadius: 40, 
            backgroundColor: '#D1FAE5',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="checkmark" size={40} color="#059669" />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A2E', marginBottom: 12, textAlign: 'center' }}>
          Account created!
        </Text>
        <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', maxWidth: 300 }}>
          Check your email to confirm your account, then sign in.
        </Text>
      </View>
    );
  }

  // Desktop Layout - Two columns
  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#fff' }}>
        {/* Left Panel - Hero */}
        <View 
          style={{ 
            flex: 1,
            maxWidth: '50%',
            backgroundColor: '#6FCF97', 
            padding: 80,
            justifyContent: 'center',
          }}
        >
          <Text 
            style={{ 
              fontSize: 48, 
              fontWeight: '700', 
              color: '#fff', 
              lineHeight: 58,
              marginBottom: 24,
            }}
          >
            Join the largest dog owner community
          </Text>
          <Text 
            style={{ 
              fontSize: 18, 
              color: 'rgba(255,255,255,0.8)', 
              lineHeight: 27,
              marginBottom: 40,
            }}
          >
            Create your account and start connecting with other dog owners in your area.
          </Text>
          <View style={{ borderRadius: 16, overflow: 'hidden' }}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop' }}
              style={{ width: '100%', height: 400 }}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Right Panel - Form */}
        <View 
          style={{ 
            width: 640, 
            backgroundColor: '#fff', 
            padding: 80,
            justifyContent: 'center',
          }}
        >
          {/* Logo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <View 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 12, 
                backgroundColor: '#6FCF97',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="paw" size={24} color="#fff" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A2E' }}>k9d8</Text>
          </View>

          {/* Header */}
          <Text style={{ fontSize: 32, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 }}>
            Create your account
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 32 }}>
            Join the pack today
          </Text>

          {/* Error Message */}
          {error && (
            <View 
              style={{ 
                backgroundColor: '#FEE2E2', 
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
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginBottom: 8 }}>
                Full Name
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#fff',
                  color: '#1A1A2E',
                }}
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginBottom: 8 }}>
                Email
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#fff',
                  color: '#1A1A2E',
                }}
                placeholder="your@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginBottom: 8 }}>
                Password
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#fff',
                  color: '#1A1A2E',
                }}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
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
                borderColor: agreedToTerms ? '#6FCF97' : '#E5E7EB',
                backgroundColor: agreedToTerms ? '#6FCF97' : '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{ fontSize: 14, color: '#6B7280', flex: 1 }}>
              I agree to the{' '}
              <Text style={{ color: '#6FCF97', fontWeight: '500' }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: '#6FCF97', fontWeight: '500' }}>Privacy Policy</Text>
            </Text>
          </Pressable>

          {/* Create Account Button */}
          <Pressable
            onPress={handleSignUp}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9CA3AF' : '#6FCF97',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 48,
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
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Already have an account?</Text>
            <Link href="/(auth)/sign-in">
              <Text style={{ fontSize: 14, color: '#6FCF97', fontWeight: '600' }}>Sign in</Text>
            </Link>
          </View>
        </View>
      </View>
    );
  }

  // Mobile Layout
  return (
    <View style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
      {/* Mobile Web Header */}
      {isWeb && isMobile && <MobileWebHeader />}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center',
            padding: 24,
            paddingVertical: isWeb && isMobile ? 40 : 60,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo - Only show on native mobile */}
          {!(isWeb && isMobile) && (
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 12, 
                    backgroundColor: '#6FCF97',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="paw" size={24} color="#fff" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A2E' }}>k9d8</Text>
              </View>
            </View>
          )}

          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 }}>
              Create your account
            </Text>
            <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
              Join the pack and start exploring
            </Text>
          </View>

        {/* Error Message */}
        {error && (
          <View 
            style={{ 
              backgroundColor: '#FEE2E2', 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 24,
            }}
          >
            <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={{ gap: 16, marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginBottom: 8 }}>
              Full Name
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: '#fff',
                color: '#1A1A2E',
              }}
              placeholder="John Doe"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginBottom: 8 }}>
              Email
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: '#fff',
                color: '#1A1A2E',
              }}
              placeholder="your@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginBottom: 8 }}>
              Password
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: '#fff',
                color: '#1A1A2E',
              }}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
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
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}
        >
          <View 
            style={{ 
              width: 20, 
              height: 20, 
              borderRadius: 4, 
              borderWidth: 2,
              borderColor: agreedToTerms ? '#6FCF97' : '#E5E7EB',
              backgroundColor: agreedToTerms ? '#6FCF97' : '#fff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={{ fontSize: 14, color: '#6B7280', flex: 1 }}>
            I agree to the{' '}
            <Text style={{ color: '#6FCF97', fontWeight: '500' }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: '#6FCF97', fontWeight: '500' }}>Privacy Policy</Text>
          </Text>
        </Pressable>

        {/* Create Account Button */}
        <Pressable
          onPress={handleSignUp}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#9CA3AF' : '#6FCF97',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 40,
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
          <Text style={{ fontSize: 14, color: '#6B7280' }}>Already have an account?</Text>
          <Link href="/(auth)/sign-in">
            <Text style={{ fontSize: 14, color: '#6FCF97', fontWeight: '600' }}>Sign in</Text>
          </Link>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

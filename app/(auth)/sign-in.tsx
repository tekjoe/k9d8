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

import { signInWithEmail } from '@/src/services/auth';
import { SocialAuthButtons } from '@/src/components/auth/SocialAuthButtons';

// Mobile Web Header Component
function MobileWebHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={{ width: '100%', backgroundColor: '#F5F4F1', zIndex: 100 }}>
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
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918' }}>k9d8</Text>
        </Pressable>
        
        <Pressable onPress={() => setMenuOpen(!menuOpen)}>
          <Ionicons name={menuOpen ? 'close' : 'menu'} size={28} color="#1A1918" />
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
            borderBottomColor: '#E5E4E1',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            gap: 20,
            zIndex: 1000,
          }}
        >
          <Pressable onPress={() => { setMenuOpen(false); router.push('/landing'); }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#6D6C6A' }}>Features</Text>
          </Pressable>
          <Pressable onPress={() => { setMenuOpen(false); router.push('/landing'); }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#6D6C6A' }}>How it Works</Text>
          </Pressable>
          <Pressable onPress={() => { setMenuOpen(false); router.push('/landing'); }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#6D6C6A' }}>About</Text>
          </Pressable>
          <View style={{ height: 1, backgroundColor: '#E5E4E1', marginVertical: 4 }} />
          <Pressable onPress={() => { setMenuOpen(false); router.push('/(auth)/sign-in'); }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#1A1918' }}>Log In</Text>
          </Pressable>
          <Pressable 
            onPress={() => { setMenuOpen(false); router.push('/(auth)/sign-up'); }}
            style={{ 
              backgroundColor: '#3D8A5A', 
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

export default function SignIn() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 768;
  const isWeb = Platform.OS === 'web';

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

  // Desktop Layout - Two columns
  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#fff' }}>
        {/* Left Panel - Hero */}
        <View 
          style={{ 
            flex: 1,
            maxWidth: '50%',
            backgroundColor: '#3D8A5A', 
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
            Connect with your pack, explore new places
          </Text>
          <Text 
            style={{ 
              fontSize: 18, 
              color: 'rgba(255,255,255,0.8)', 
              lineHeight: 27,
              marginBottom: 40,
            }}
          >
            Join thousands of dog owners finding the perfect parks, playdates, and adventures.
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
          <Text style={{ fontSize: 32, fontWeight: '700', color: '#1A1918', marginBottom: 8 }}>
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
              marginBottom: 48,
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
      </View>
    );
  }

  // Mobile Layout
  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
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
                    backgroundColor: '#3D8A5A',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="paw" size={24} color="#fff" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918' }}>k9d8</Text>
              </View>
            </View>
          )}

          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1918', marginBottom: 8 }}>
              Welcome back
            </Text>
            <Text style={{ fontSize: 16, color: '#6D6C6A', textAlign: 'center' }}>
              Sign in to continue connecting with your pack
            </Text>
          </View>

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
              autoComplete="password"
              onSubmitEditing={handleSignIn}
            />
          </View>
        </View>

        {/* Forgot Password */}
        <Pressable style={{ alignSelf: 'flex-start', marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '500' }}>
            Forgot password?
          </Text>
        </Pressable>

        {/* Sign In Button */}
        <Pressable
          onPress={handleSignIn}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#878685' : '#3D8A5A',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 40,
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
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

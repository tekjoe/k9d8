import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/hooks/useAuth';
import { updateProfile, uploadUserAvatar } from '@/src/services/auth';
import { ImagePickerWithModeration } from '@/src/components/ImagePickerWithModeration';

export default function OnboardScreen() {
  const { session, refreshSession } = useAuth();

  const googleName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    '';

  const [displayName, setDisplayName] = useState(googleName);
  const [bio, setBio] = useState('');
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoSelect = useCallback((uri: string) => {
    setLocalAvatarUri(uri);
  }, []);

  const handlePhotoRemove = useCallback(() => {
    setLocalAvatarUri(null);
  }, []);

  const handleComplete = useCallback(async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    const userId = session?.user?.id;
    if (!userId) return;

    setSaving(true);
    setError(null);
    try {
      let avatarUrl: string | undefined;

      if (localAvatarUri) {
        avatarUrl = await uploadUserAvatar(userId, localAvatarUri);
      }

      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim() || undefined,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });

      // Mark onboarding as complete
      const { supabase } = await import('@/src/lib/supabase');
      await supabase.auth.updateUser({
        data: { onboarded: true },
      });

      await refreshSession?.();
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }, [displayName, bio, localAvatarUri, session?.user?.id, refreshSession]);

  const handleSkip = useCallback(async () => {
    const { supabase } = await import('@/src/lib/supabase');
    await supabase.auth.updateUser({
      data: { onboarded: true },
    });
    await refreshSession?.();
    router.replace('/(tabs)');
  }, [refreshSession]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            paddingTop: 60,
            maxWidth: 480,
            width: '100%',
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: '#3D8A5A',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Ionicons name="paw" size={28} color="#fff" />
            </View>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '700',
                color: '#1A1918',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Complete your profile
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: '#6D6C6A',
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              Let other dog owners know who you are
            </Text>
          </View>

          {error && (
            <View
              style={{
                backgroundColor: '#F5E8E3',
                padding: 12,
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
            </View>
          )}

          {/* Avatar */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <ImagePickerWithModeration
              selectedImage={localAvatarUri}
              onImageSelect={handlePhotoSelect}
              onImageRemove={localAvatarUri ? handlePhotoRemove : undefined}
              placeholder="Add Photo"
              size="large"
              shape="circle"
              moderationEnabled={true}
            />
          </View>

          {/* Form */}
          <View style={{ gap: 20, marginBottom: 32 }}>
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#1A1918',
                  marginBottom: 8,
                }}
              >
                Name
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
                placeholder="Your name"
                placeholderTextColor="#878685"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#1A1918',
                  marginBottom: 8,
                }}
              >
                About you
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
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
                placeholder="Tell us about yourself and your dogs..."
                placeholderTextColor="#878685"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: '#878685',
                  textAlign: 'right',
                  marginTop: 4,
                }}
              >
                {bio.length}/200
              </Text>
            </View>
          </View>

          {/* Continue Button */}
          <Pressable
            onPress={handleComplete}
            disabled={saving}
            style={{
              backgroundColor: saving ? '#878685' : '#3D8A5A',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}
              >
                Continue
              </Text>
            )}
          </Pressable>

          {/* Skip */}
          <Pressable
            onPress={handleSkip}
            style={{ alignItems: 'center', padding: 12 }}
          >
            <Text style={{ fontSize: 14, color: '#6D6C6A' }}>
              Skip for now
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

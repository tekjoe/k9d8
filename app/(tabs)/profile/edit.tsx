import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/hooks/useAuth';
import { updateProfile, uploadUserAvatar, deleteUserAvatar, deleteAccount } from '@/src/services/auth';
import { Colors } from '@/src/constants/colors';
import { ImagePickerWithModeration } from '@/src/components/ImagePickerWithModeration';
import ConfirmModal from '@/src/components/ui/ConfirmModal';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, refreshSession } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(
    session?.user?.user_metadata?.display_name || ''
  );
  const [bio, setBio] = useState(
    session?.user?.user_metadata?.bio || ''
  );
  const [avatarUrl, setAvatarUrl] = useState(
    session?.user?.user_metadata?.avatar_url || ''
  );
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      setError('You must be signed in');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      let finalAvatarUrl: string | null | undefined = avatarUrl.trim() || null;

      if (localAvatarUri) {
        setIsUploadingAvatar(true);
        try {
          finalAvatarUrl = await uploadUserAvatar(userId, localAvatarUri);
        } finally {
          setIsUploadingAvatar(false);
        }
      }

      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim() || undefined,
        avatar_url: finalAvatarUrl,
      });
      
      await refreshSession?.();
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [displayName, bio, avatarUrl, localAvatarUri, session?.user?.id, refreshSession]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handlePhotoSelect = useCallback((uri: string) => {
    setLocalAvatarUri(uri);
  }, []);

  const handlePhotoRemove = useCallback(async () => {
    const userId = session?.user?.id;
    setLocalAvatarUri(null);
    setAvatarUrl('');
    if (userId && avatarUrl) {
      try {
        await deleteUserAvatar(userId);
      } catch (err) {
        console.error('Failed to delete avatar:', err);
      }
    }
  }, [session?.user?.id, avatarUrl]);

  const handleDeleteAccount = useCallback(async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      setError(message);
      setIsDeleting(false);
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View 
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: '#fff',
          paddingHorizontal: 16,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
        }}
      >
        <Pressable 
          onPress={handleBack}
          style={{ width: 40, height: 40, justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>
          Edit Profile
        </Text>
        <Pressable onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#3D8A5A" />
          ) : (
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#3D8A5A' }}>
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        {/* Error */}
        {error && (
          <View 
            style={{ 
              backgroundColor: '#F5E8E3', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 24,
            }}
          >
            <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
          </View>
        )}

        {/* Avatar with Moderation */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <ImagePickerWithModeration
            selectedImage={localAvatarUri || avatarUrl || null}
            onImageSelect={handlePhotoSelect}
            onImageRemove={(localAvatarUri || avatarUrl) ? handlePhotoRemove : undefined}
            placeholder="Add Photo"
            size="large"
            shape="circle"
            moderationEnabled={true}
          />

          {localAvatarUri && (
            <Text style={{ fontSize: 12, color: '#3D8A5A', marginTop: 8 }}>
              New photo selected
            </Text>
          )}
        </View>

        {/* Form */}
        <View style={{ gap: 20 }}>
          {/* Name Field */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918', marginBottom: 8 }}>
              Name
            </Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: '#1A1918',
                borderWidth: 1,
                borderColor: '#E5E4E1',
              }}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#878685"
              autoCapitalize="words"
            />
          </View>

          {/* Bio Field */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918', marginBottom: 8 }}>
              Bio
            </Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: '#1A1918',
                borderWidth: 1,
                borderColor: '#E5E4E1',
                minHeight: 100,
                textAlignVertical: 'top',
              }}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#878685"
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={{ fontSize: 12, color: '#878685', textAlign: 'right', marginTop: 4 }}>
              {bio.length}/200
            </Text>
          </View>

          {/* Email Field (read-only) */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918', marginBottom: 8 }}>
              Email
            </Text>
            <TextInput
              style={{
                backgroundColor: '#EDECEA',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: '#6D6C6A',
                borderWidth: 1,
                borderColor: '#E5E4E1',
              }}
              value={session?.user?.email}
              editable={false}
            />
            <Text style={{ fontSize: 12, color: '#878685', marginTop: 4 }}>
              Email cannot be changed
            </Text>
          </View>
        </View>

        {/* Delete Account */}
        <Pressable
          onPress={() => setShowDeleteModal(true)}
          disabled={isDeleting}
          style={{
            marginTop: 32,
            paddingVertical: 14,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#D1D0CD',
            alignItems: 'center',
            opacity: isDeleting ? 0.5 : 1,
          }}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#878685" />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#878685' }}>
              Delete Account
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Account"
        message="This will permanently delete your account and all your data. This action cannot be undone."
        confirmLabel="Delete My Account"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
    </View>
  );
}

import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import DesktopSidebar from '@/src/components/ui/DesktopSidebar';
import { SEOHead } from '@/src/components/seo';
import { useAuth } from '@/src/hooks/useAuth';
import { updateProfile, uploadUserAvatar } from '@/src/services/auth';
import { Colors } from '@/src/constants/colors';

export default function EditProfileWebScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const showSidebar = width >= 768;

  const { session, refreshSession } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      let finalAvatarUrl = avatarUrl.trim() || undefined;

      // Upload new avatar if one was selected
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
      
      // Refresh the session to get updated user metadata
      await refreshSession?.();
      
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 1000);
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

  const handleChangePhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLocalAvatarUri(result.assets[0].uri);
    }
  }, []);

  const avatarSize = isMobile ? 120 : 160;

  return (
    <>
    <SEOHead title="Edit Profile" description="Update your k9d8 profile information." url="/profile/edit" />
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F4F1' }}>
      {/* Sidebar - Hidden on mobile */}
      {showSidebar && <DesktopSidebar />}

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            backgroundColor: '#fff',
            paddingHorizontal: isMobile ? 16 : 40,
            paddingVertical: isMobile ? 16 : 24,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E4E1',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable 
              onPress={handleBack}
              style={{ 
                width: 40, 
                height: 40, 
                justifyContent: 'center', 
                alignItems: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </Pressable>
            <Text style={{ fontSize: isMobile ? 18 : 24, fontWeight: '600', color: '#1A1918' }}>
              Edit Profile
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable 
              onPress={handleBack}
              style={{ 
                borderWidth: 1, 
                borderColor: '#E5E4E1', 
                paddingHorizontal: isMobile ? 16 : 20, 
                paddingVertical: isMobile ? 8 : 10, 
                borderRadius: 9999,
                backgroundColor: '#fff',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1918' }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable 
              onPress={handleSave}
              disabled={isSaving}
              style={{ 
                backgroundColor: isSaving ? '#878685' : '#3D8A5A',
                paddingHorizontal: isMobile ? 16 : 20, 
                paddingVertical: isMobile ? 8 : 10, 
                borderRadius: 9999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isSaving && <ActivityIndicator size="small" color="#fff" />}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            padding: isMobile ? 20 : 40,
          }}
        >
          {/* Success/Error Messages */}
          {error && (
            <View 
              style={{ 
                backgroundColor: '#F5E8E3', 
                padding: 16, 
                borderRadius: 12, 
                marginBottom: 24,
                maxWidth: 800,
              }}
            >
              <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
            </View>
          )}
          {success && (
            <View 
              style={{ 
                backgroundColor: '#D4E8D4', 
                padding: 16, 
                borderRadius: 12, 
                marginBottom: 24,
                maxWidth: 800,
              }}
            >
              <Text style={{ color: '#059669', fontSize: 14 }}>Profile updated successfully!</Text>
            </View>
          )}

          <View 
            style={{ 
              flexDirection: isMobile ? 'column' : 'row', 
              gap: isMobile ? 32 : 40,
              maxWidth: 900,
            }}
          >
            {/* Left Column - Avatar */}
            <View 
              style={{ 
                alignItems: 'center',
                width: isMobile ? '100%' : 200,
              }}
            >
              <View style={{ position: 'relative' }}>
                <View 
                  style={{ 
                    width: avatarSize, 
                    height: avatarSize, 
                    borderRadius: avatarSize / 2, 
                    borderWidth: 3, 
                    borderColor: '#E5E4E1',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={{
                      uri:
                        localAvatarUri ||
                        avatarUrl ||
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
                    }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
                {isUploadingAvatar && (
                  <View 
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      borderRadius: avatarSize / 2,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                )}
              </View>

              <Pressable 
                onPress={handleChangePhoto}
                style={{ 
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#EDECEA',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  marginTop: 16,
                }}
              >
                <Ionicons name="camera-outline" size={16} color="#6D6C6A" />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#6D6C6A' }}>
                  Change Photo
                </Text>
              </Pressable>

              {localAvatarUri && (
                <Text style={{ fontSize: 12, color: '#3D8A5A', marginTop: 8, textAlign: 'center' }}>
                  New photo selected
                </Text>
              )}
            </View>

            {/* Right Column - Form */}
            <View style={{ flex: 1, gap: 20 }}>
              {/* Name Field */}
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918', marginBottom: 8 }}>
                  Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
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
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: '#1A1918',
                    borderWidth: 1,
                    borderColor: '#E5E4E1',
                    minHeight: 120,
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
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
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
          </View>
        </ScrollView>
      </View>
    </View>
    </>
  );
}

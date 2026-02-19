import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SEOHead } from '@/src/components/seo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { useResponsiveLayout } from '@/src/hooks/useResponsiveLayout';
import WebPageLayout from '@/src/components/ui/WebPageLayout';
import ConfirmModal from '@/src/components/ui/ConfirmModal';

export default function UserProfileWebScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isMobile, isDesktop } = useResponsiveLayout();

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const {
    profile,
    dogs,
    loading,
    actionLoading,
    isOwnProfile,
    isFriend,
    isPending,
    isSentByMe,
    isSentToMe,
    isBlocked,
    isBlockedByThem,
    handleSendRequest,
    handleAccept,
    handleMessage,
    handleUnblockUser,
    doBlockUser,
    doRemoveFriend,
  } = useUserProfile(id);

  const showBlockConfirm = () => {
    setConfirmModal({
      title: 'Block User',
      message: 'Are you sure you want to block this user? This will also remove any friendship.',
      confirmLabel: 'Block',
      onConfirm: async () => {
        setConfirmModal(null);
        await doBlockUser();
      },
    });
  };

  const showRemoveFriendConfirm = () => {
    setConfirmModal({
      title: 'Remove Friend',
      message: 'Are you sure you want to unfriend this person?',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        setConfirmModal(null);
        await doRemoveFriend();
      },
    });
  };

  const header = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: isMobile ? 16 : 40,
        paddingVertical: isMobile ? 16 : 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E4E1',
      }}
    >
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
      </Pressable>
      <Text style={{ fontSize: isMobile ? 18 : 24, fontWeight: '600', color: '#1A1918', marginLeft: 12 }}>
        {profile?.display_name || 'Profile'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <>
      <SEOHead title="User Profile" description="View a user's profile and dogs on k9d8." url="/users" />
      <WebPageLayout header={header} maxWidth={900}>
        <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 64 }}>
          <ActivityIndicator size="large" color="#3D8A5A" />
        </View>
      </WebPageLayout>
      </>
    );
  }

  if (!profile) {
    return (
      <>
      <SEOHead title="User Profile" description="View a user's profile and dogs on k9d8." url="/users" />
      <WebPageLayout header={header} maxWidth={900}>
        <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 64 }}>
          <Text style={{ fontSize: 16, color: '#B5725E', textAlign: 'center' }}>User not found</Text>
        </View>
      </WebPageLayout>
      </>
    );
  }

  const avatarSize = isMobile ? 96 : 128;

  return (
    <>
    <SEOHead title="User Profile" description="View a user's profile and dogs on k9d8." url="/users" />
    <WebPageLayout header={header} maxWidth={900}>
      {/* Profile Header */}
      <View
        style={{
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: isMobile ? 24 : 32,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderWidth: 3,
            borderColor: '#E5E4E1',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <Image
            source={{
              uri:
                profile.avatar_url ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
            }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </View>
        <Text style={{ fontSize: isMobile ? 22 : 28, fontWeight: '700', color: '#1A1918' }}>
          {profile.display_name || 'Dog Owner'}
        </Text>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View
            style={{
              flexDirection: 'column',
              gap: 12,
              marginTop: 20,
              width: '100%',
              maxWidth: 400,
            }}
          >
            {isBlocked ? (
              <>
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 14, color: '#878685' }}>You have blocked this user</Text>
                </View>
                <Pressable
                  onPress={handleUnblockUser}
                  disabled={actionLoading}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#D1D0CD',
                    paddingVertical: 12,
                    borderRadius: 12,
                    gap: 8,
                  }}
                >
                  <Text style={{ color: '#878685', fontSize: 15, fontWeight: '500' }}>Unblock</Text>
                </Pressable>
              </>
            ) : isBlockedByThem ? (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, color: '#878685' }}>This user is not available</Text>
              </View>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 12,
                  }}
                >
                  {!isPending && !isFriend && (
                    <Pressable
                      onPress={handleSendRequest}
                      disabled={actionLoading}
                      style={{
                        flex: isMobile ? undefined : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#3D8A5A',
                        paddingVertical: 12,
                        borderRadius: 12,
                        gap: 8,
                      }}
                    >
                      <Ionicons name="person-add-outline" size={20} color="#fff" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Add Friend</Text>
                    </Pressable>
                  )}

                  {isSentByMe && (
                    <View
                      style={{
                        flex: isMobile ? undefined : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#EDECEA',
                        paddingVertical: 12,
                        borderRadius: 12,
                        gap: 8,
                      }}
                    >
                      <Ionicons name="time-outline" size={20} color="#6D6C6A" />
                      <Text style={{ color: '#6D6C6A', fontSize: 15, fontWeight: '600' }}>Request Sent</Text>
                    </View>
                  )}

                  {isSentToMe && (
                    <Pressable
                      onPress={handleAccept}
                      disabled={actionLoading}
                      style={{
                        flex: isMobile ? undefined : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#3D8A5A',
                        paddingVertical: 12,
                        borderRadius: 12,
                        gap: 8,
                      }}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Accept Request</Text>
                    </Pressable>
                  )}

                  {isFriend && (
                    <Pressable
                      onPress={showRemoveFriendConfirm}
                      disabled={actionLoading}
                      style={{
                        flex: isMobile ? undefined : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E5E4E1',
                        paddingVertical: 12,
                        borderRadius: 12,
                        gap: 8,
                      }}
                    >
                      <Ionicons name="person-remove-outline" size={18} color="#6D6C6A" />
                      <Text style={{ color: '#6D6C6A', fontSize: 15, fontWeight: '500' }}>Remove Friend</Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={handleMessage}
                    disabled={actionLoading}
                    style={{
                      flex: isMobile ? undefined : 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isFriend ? '#3D8A5A' : '#FFFFFF',
                      borderWidth: isFriend ? 0 : 1,
                      borderColor: '#3D8A5A',
                      paddingVertical: 12,
                      borderRadius: 12,
                      gap: 8,
                    }}
                  >
                    <Ionicons name="chatbubble-outline" size={20} color={isFriend ? '#fff' : '#3D8A5A'} />
                    <Text style={{ color: isFriend ? '#FFFFFF' : '#3D8A5A', fontSize: 15, fontWeight: '600' }}>
                      Message
                    </Text>
                  </Pressable>
                </View>

                {/* Block User */}
                <Pressable
                  onPress={showBlockConfirm}
                  disabled={actionLoading}
                  style={{
                    alignItems: 'center',
                    paddingVertical: 8,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ color: '#878685', fontSize: 13, fontWeight: '500' }}>Block User</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </View>

      {/* Dogs Section */}
      {dogs.length > 0 && (
        <View>
          <Text style={{ fontSize: isMobile ? 18 : 20, fontWeight: '700', color: '#1A1918', marginBottom: 16 }}>
            {isOwnProfile ? 'My Dogs' : 'Their Dogs'}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {dogs.map((dog) => (
              <Pressable
                key={dog.id}
                onPress={() => router.push(`/dogs/${dog.id}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  padding: 16,
                  borderRadius: 12,
                  width: isDesktop ? '48.5%' : '100%',
                }}
              >
                <Image
                  source={{
                    uri:
                      dog.photo_url ||
                      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
                  }}
                  style={{ width: 56, height: 56, borderRadius: 28, marginRight: 12 }}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }}>{dog.name}</Text>
                  <Text style={{ fontSize: 14, color: '#6D6C6A', marginTop: 2 }}>
                    {[dog.breed, dog.age_years ? `${dog.age_years} yrs` : '']
                      .filter(Boolean)
                      .join(', ') || 'Mixed breed'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6D6C6A" />
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </WebPageLayout>
    <ConfirmModal
      visible={!!confirmModal}
      title={confirmModal?.title ?? ''}
      message={confirmModal?.message ?? ''}
      confirmLabel={confirmModal?.confirmLabel ?? 'Confirm'}
      destructive
      onConfirm={confirmModal?.onConfirm ?? (() => {})}
      onCancel={() => setConfirmModal(null)}
    />
    </>
  );
}

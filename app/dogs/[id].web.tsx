import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SEOHead } from '@/src/components/seo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useAuth } from '@/src/hooks/useAuth';
import { getDogWithOwner } from '@/src/services/dogs';
import { getOrCreateConversation } from '@/src/services/messages';
import {
  getFriendshipStatus,
  sendFriendRequest,
} from '@/src/services/friends';
import { useResponsiveLayout } from '@/src/hooks/useResponsiveLayout';
import WebPageLayout from '@/src/components/ui/WebPageLayout';
import type { DogWithOwner } from '@/src/services/dogs';
import type { DogSize, DogTemperament, Friendship } from '@/src/types/database';

function formatSize(size: DogSize): string {
  const map: Record<DogSize, string> = {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    extra_large: 'Extra Large',
  };
  return map[size];
}

function formatTemperament(temperaments: DogTemperament[]): string {
  const map: Record<DogTemperament, string> = {
    calm: 'Calm',
    friendly: 'Friendly',
    energetic: 'Energetic',
    anxious: 'Anxious',
    aggressive: 'Aggressive',
  };
  return temperaments.map((t) => map[t]).join(', ');
}

function InfoTag({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: '#E5E4E1',
      }}
    >
      <Ionicons name={icon} size={16} color="#6D6C6A" style={{ marginRight: 8 }} />
      <Text style={{ fontSize: 14, color: '#1A1918' }}>{label}</Text>
    </View>
  );
}

export default function DogProfileWebScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isMobile, isDesktop } = useResponsiveLayout();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [dog, setDog] = useState<DogWithOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [friendLoading, setFriendLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function fetchDog() {
      try {
        const data = await getDogWithOwner(id!);
        if (isMounted) {
          setDog(data);
          if (userId && userId !== data.owner_id) {
            const fs = await getFriendshipStatus(userId, data.owner_id);
            if (isMounted) setFriendship(fs);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message: unknown }).message)
              : err instanceof Error
                ? err.message
                : 'Failed to load dog profile';
          const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
          setError(code === 'PGRST116' ? 'Dog not found' : msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDog();
    return () => { isMounted = false; };
  }, [id, userId]);

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/');
  }, [router]);

  const handleMessageOwner = useCallback(async () => {
    if (!dog || !userId) return;
    setMessageLoading(true);
    try {
      const conversationId = await getOrCreateConversation(dog.owner_id);
      router.push(`/messages/${conversationId}`);
    } catch {
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    } finally {
      setMessageLoading(false);
    }
  }, [dog, userId, router]);

  const handleAddFriend = useCallback(async () => {
    if (!dog || !userId) return;
    setFriendLoading(true);
    try {
      const fs = await sendFriendRequest(userId, dog.owner_id);
      setFriendship(fs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send request';
      Alert.alert('Error', msg);
    } finally {
      setFriendLoading(false);
    }
  }, [dog, userId]);

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
        onPress={handleBack}
        style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
      </Pressable>
      <Text
        style={{ fontSize: isMobile ? 18 : 24, fontWeight: '600', color: '#1A1918', marginLeft: 12, flex: 1 }}
        numberOfLines={1}
      >
        {dog?.name || 'Dog Profile'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <>
      <SEOHead title="Dog Profile" description="View a dog's profile on k9d8." url="/dogs" />
      <WebPageLayout header={header} maxWidth={960}>
        <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 64 }}>
          <ActivityIndicator size="large" color="#3D8A5A" />
        </View>
      </WebPageLayout>
      </>
    );
  }

  if (error || !dog) {
    return (
      <>
      <SEOHead title="Dog Profile" description="View a dog's profile on k9d8." url="/dogs" />
      <WebPageLayout header={header} maxWidth={960}>
        <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 64 }}>
          <Text style={{ fontSize: 16, color: '#B5725E', textAlign: 'center', marginBottom: 16 }}>
            {error ?? 'Dog not found'}
          </Text>
          <Pressable
            onPress={() => router.replace('/')}
            style={{ backgroundColor: '#3D8A5A', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Go Home</Text>
          </Pressable>
        </View>
      </WebPageLayout>
      </>
    );
  }

  const isOwnDog = userId === dog.owner_id;
  const heroHeight = isMobile ? 240 : 360;

  return (
    <>
    <SEOHead title="Dog Profile" description="View a dog's profile on k9d8." url="/dogs" />
    <WebPageLayout header={header} maxWidth={960}>
      {/* Hero Photo */}
      <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        <Image
          source={{
            uri:
              dog.photo_url ||
              'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=400&fit=crop',
          }}
          style={{ width: '100%', height: heroHeight }}
          resizeMode="cover"
        />
      </View>

      <View
        style={{
          flexDirection: isDesktop ? 'row' : 'column',
          gap: isDesktop ? 32 : 24,
        }}
      >
        {/* Left Column — Dog Details */}
        <View style={{ flex: isDesktop ? 2 : undefined }}>
          {/* Name & Breed Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: isMobile ? 20 : 28,
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: isMobile ? 24 : 32, fontWeight: '700', color: '#1A1918', marginBottom: 4 }}>
              {dog.name}
            </Text>
            {dog.breed && (
              <Text style={{ fontSize: 16, color: '#6D6C6A', marginBottom: 20 }}>
                {dog.breed}
              </Text>
            )}

            {/* Info Tags */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <InfoTag icon="resize-outline" label={formatSize(dog.size)} />
              <InfoTag icon="happy-outline" label={formatTemperament(dog.temperament)} />
              {dog.age_years != null && (
                <InfoTag
                  icon="calendar-outline"
                  label={`${dog.age_years} ${dog.age_years === 1 ? 'year' : 'years'}`}
                />
              )}
            </View>
          </View>

          {/* About */}
          {dog.notes && (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: isMobile ? 20 : 28,
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginBottom: 8 }}>
                About
              </Text>
              <Text style={{ fontSize: 15, color: '#6D6C6A', lineHeight: 24 }}>
                {dog.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Right Column — Owner & Actions */}
        <View style={{ flex: isDesktop ? 1 : undefined, minWidth: isDesktop ? 280 : undefined }}>
          {/* Owner Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: isMobile ? 20 : 28,
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#878685', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              Owner
            </Text>
            <Pressable
              onPress={() => router.push(`/users/${dog.owner_id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Image
                source={{
                  uri:
                    dog.owner.avatar_url ||
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
                }}
                style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }}>
                  {dog.owner.display_name || 'Dog Owner'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6D6C6A" />
            </Pressable>
          </View>

          {/* Action Buttons */}
          {!isOwnDog && userId && (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: isMobile ? 20 : 28,
                gap: 12,
              }}
            >
              <Pressable
                onPress={handleMessageOwner}
                disabled={messageLoading}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#3D8A5A',
                  paddingVertical: 14,
                  borderRadius: 12,
                  gap: 8,
                }}
              >
                {messageLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                      Message Owner
                    </Text>
                  </>
                )}
              </Pressable>

              {!friendship && (
                <Pressable
                  onPress={handleAddFriend}
                  disabled={friendLoading}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#3D8A5A',
                    paddingVertical: 14,
                    borderRadius: 12,
                    gap: 8,
                  }}
                >
                  {friendLoading ? (
                    <ActivityIndicator size="small" color="#3D8A5A" />
                  ) : (
                    <>
                      <Ionicons name="person-add-outline" size={20} color="#3D8A5A" />
                      <Text style={{ color: '#3D8A5A', fontSize: 15, fontWeight: '600' }}>
                        Add Friend
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              {friendship?.status === 'pending' && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EDECEA',
                    paddingVertical: 14,
                    borderRadius: 12,
                    gap: 8,
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="#6D6C6A" />
                  <Text style={{ color: '#6D6C6A', fontSize: 15, fontWeight: '600' }}>
                    {friendship.requester_id === userId ? 'Request Sent' : 'Request Pending'}
                  </Text>
                </View>
              )}

              {friendship?.status === 'accepted' && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(61, 138, 90, 0.1)',
                    paddingVertical: 14,
                    borderRadius: 12,
                    gap: 8,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#3D8A5A" />
                  <Text style={{ color: '#3D8A5A', fontSize: 15, fontWeight: '600' }}>
                    Friends
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </WebPageLayout>
    </>
  );
}

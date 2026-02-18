import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DesktopSidebar from '@/src/components/ui/DesktopSidebar';
import { Colors } from '@/src/constants/colors';
import { getParkById, getParkByShortId } from '@/src/services/parks';
import { useAuth } from '@/src/hooks/useAuth';
import { useCheckIn } from '@/src/hooks/useCheckIn';
import { useDogs } from '@/src/hooks/useDogs';
import { usePlaydates } from '@/src/hooks/usePlaydates';
import { PlaydateCard } from '@/src/components/playdates/PlaydateCard';
import { SEOHead, StructuredData, placeSchema } from '@/src/components/seo';
import { parseSlugOrId } from '@/src/utils/slug';
import type { Park, Dog } from '@/src/types/database';
import { Skeleton, SkeletonList } from '@/src/components/ui/Skeleton';

const DURATIONS = [
  { label: '30 mins', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];

// Dog Avatar Component
interface DogAvatarProps {
  dog: Dog;
  onPress?: () => void;
}

function DogAvatar({ dog, onPress }: DogAvatarProps) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center' }}>
      <Image
        source={{
          uri:
            dog.photo_url ||
            'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
        }}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          borderWidth: 2,
          borderColor: '#E5E4E1',
        }}
        resizeMode="cover"
      />
      <Text
        style={{
          fontSize: 11,
          fontWeight: '500',
          color: '#6D6C6A',
          marginTop: 4,
          maxWidth: 64,
        }}
        numberOfLines={1}
      >
        {dog.name}
      </Text>
    </Pressable>
  );
}

// Feature Tag Component
interface FeatureTagProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

function FeatureTag({ icon, label }: FeatureTagProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDECEA',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 9999,
        gap: 8,
      }}
    >
      <Ionicons name={icon} size={14} color="#6D6C6A" />
      <Text style={{ fontSize: 12, fontWeight: '500', color: '#6D6C6A' }}>{label}</Text>
    </View>
  );
}

// Button Components
interface ButtonOutlineProps {
  label: string;
  onPress: () => void;
}

function ButtonOutline({ label, onPress }: ButtonOutlineProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 9999,
        borderWidth: 1.5,
        borderColor: '#E5E4E1',
        backgroundColor: '#fff',
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.light.text }}>{label}</Text>
    </Pressable>
  );
}

interface ButtonPrimaryProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'active' | 'danger';
}

function ButtonPrimary({ label, onPress, loading, disabled, variant = 'primary' }: ButtonPrimaryProps) {
  const bgColor = variant === 'danger' ? '#B5725E' : variant === 'active' ? '#3D8A5A' : '#3D8A5A';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 9999,
        backgroundColor: disabled ? '#D1D0CD' : bgColor,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {loading && <ActivityIndicator size="small" color="#fff" />}
      <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>{label}</Text>
    </Pressable>
  );
}

interface ParkDetailAuthProps {
  slugOrId: string;
}

export default function ParkDetailAuth({ slugOrId }: ParkDetailAuthProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  const showSidebar = width >= 768;

  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [park, setPark] = useState<Park | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parkId = park?.id || null;
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);

  const {
    activeCheckIns,
    userCheckIn,
    loading: checkInLoading,
    checkIn,
    checkOut,
  } = useCheckIn(parkId || '');

  const { dogs } = useDogs(userId);
  const { playdates, loading: playdatesLoading, refresh: refreshPlaydates } = usePlaydates(parkId || '');

  // Re-fetch play dates when returning to this screen
  const isFirstMount = React.useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      refreshPlaydates();
    }, [refreshPlaydates])
  );

  useEffect(() => {
    if (!slugOrId) {
      setError('No park ID provided');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchPark() {
      const parsed = parseSlugOrId(slugOrId);

      try {
        let data: Park | null = null;

        if (parsed.type === 'uuid') {
          data = await getParkById(parsed.id);
        } else if (parsed.type === 'slug') {
          data = await getParkByShortId(parsed.shortId);
        }

        if (isMounted) {
          if (data) {
            setPark(data);
          } else {
            setError('Park not found');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load park details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPark();

    return () => {
      isMounted = false;
    };
  }, [slugOrId]);

  useEffect(() => {
    if (checkInModalVisible && dogs.length > 0) {
      setSelectedDogIds(dogs.map((d) => d.id));
    }
  }, [checkInModalVisible, dogs]);

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/');
  }, [router]);

  const handleDirections = useCallback(() => {
    if (park) {
      const url = `https://maps.google.com/?q=${park.latitude},${park.longitude}`;
      Linking.openURL(url);
    }
  }, [park]);

  const handleSchedule = useCallback(() => {
    router.push(`/playdates/create?parkId=${parkId}`);
  }, [router, parkId]);

  const handleOpenCheckIn = useCallback(() => {
    if (userCheckIn) {
      checkOut();
    } else {
      setCheckInModalVisible(true);
    }
  }, [userCheckIn, checkOut]);

  const handleConfirmCheckIn = useCallback(() => {
    if (selectedDogIds.length > 0) {
      checkIn(selectedDogIds);
      setCheckInModalVisible(false);
    }
  }, [selectedDogIds, checkIn]);

  const toggleDog = useCallback((dogId: string) => {
    setSelectedDogIds((prev) =>
      prev.includes(dogId) ? prev.filter((id) => id !== dogId) : [...prev, dogId]
    );
  }, []);

  // Get unique dogs from all check-ins
  const checkedInDogs = useMemo(() => {
    const dogsList: Dog[] = [];
    const seenIds = new Set<string>();

    activeCheckIns.forEach((checkIn) => {
      checkIn.dogs?.forEach((dog) => {
        if (!seenIds.has(dog.id)) {
          seenIds.add(dog.id);
          dogsList.push(dog);
        }
      });
    });

    return dogsList.slice(0, 6);
  }, [activeCheckIns]);

  // Build features list based on park data
  const features = useMemo(() => {
    if (!park) return [];

    const list: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [];
    if (park.has_water) list.push({ icon: 'water', label: 'Water Fountain' });
    if (park.is_fenced) list.push({ icon: 'shield-checkmark', label: 'Fenced Area' });
    if (park.has_shade) list.push({ icon: 'leaf', label: 'Shaded Areas' });
    if (park.amenities?.includes('Benches')) list.push({ icon: 'cube', label: 'Benches' });
    if (park.amenities?.includes('Waste Stations')) list.push({ icon: 'trash', label: 'Waste Stations' });

    if (list.length === 0) {
      list.push(
        { icon: 'water', label: 'Water Fountain' },
        { icon: 'cube', label: 'Benches' },
        { icon: 'shield-checkmark', label: 'Fenced Area' },
        { icon: 'trash', label: 'Waste Stations' }
      );
    }

    return list;
  }, [park]);

  if (loading) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F4F1' }}>
        {showSidebar && <DesktopSidebar />}
        <ScrollView style={{ flex: 1 }}>
          {/* Header Skeleton */}
          <View style={{ padding: isMobile ? 20 : 40, gap: 6, marginBottom: 20 }}>
            <Skeleton width={isMobile ? 200 : 280} height={isMobile ? 28 : 32} borderRadius={4} />
            <Skeleton width={160} height={16} borderRadius={3} />
          </View>

          {/* Content Skeleton */}
          <View style={{ paddingHorizontal: isMobile ? 20 : 40 }}>
            <Skeleton width="100%" height={isMobile ? 200 : 300} borderRadius={12} style={{ marginBottom: 20 }} />
            <SkeletonList count={4} type="card" />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error || !park) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F4F1' }}>
        {showSidebar && <DesktopSidebar />}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#F5E8E3',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="alert-circle" size={32} color="#B5725E" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.light.text, marginBottom: 8 }}>
            {error ?? 'Park not found'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6D6C6A', textAlign: 'center', marginBottom: 24 }}>
            We couldn't load this park. It may have been removed or the link may be incorrect.
          </Text>
          <ButtonPrimary label="Go Back" onPress={handleBack} />
        </View>
      </View>
    );
  }

  const parkDescription = park.description
    || `Visit ${park.name}${park.address ? ` in ${park.address}` : ''}. ${park.is_fenced ? 'Fenced off-leash area' : 'Open dog park'} with amenities for dogs and owners. Schedule a playdate today!`;

  return (
    <>
      <SEOHead
        title={`${park.name} - Dog Park`}
        description={parkDescription.slice(0, 160)}
        url={`/dog-parks/${slugOrId}`}
        image={park.image_url || undefined}
      />
      <StructuredData data={placeSchema(park)} />
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F4F1' }}>
        {/* Sidebar - Hidden on mobile */}
        {showSidebar && <DesktopSidebar />}

        {/* Main Content */}
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }}>
            {/* Hero Image */}
            <View style={{ position: 'relative' }}>
              <Image
                source={{
                  uri:
                    park.image_url || '/images/dog-park-placeholder.png',
                }}
                accessibilityLabel={`Photo of ${park.name} dog park`}
                style={{ width: '100%', height: isMobile ? 240 : 300 }}
                resizeMode="cover"
              />
            {/* Back Button */}
            <Pressable
              onPress={handleBack}
              style={{
                position: 'absolute',
                top: 24,
                left: 24,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.8)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </Pressable>
          </View>

          {/* Content Area */}
          <View
            style={{
              flexDirection: isDesktop ? 'row' : 'column',
              gap: isMobile ? 24 : 40,
              padding: isMobile ? 20 : 40,
            }}
          >
            {/* Left Column - Park Info */}
            <View style={{ flex: 1, gap: 28 }}>
              {/* Header */}
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: isMobile ? 24 : 28,
                    fontWeight: '700',
                    color: Colors.light.text,
                    letterSpacing: -0.5,
                  }}
                >
                  {park.name}
                </Text>
                <Text style={{ fontSize: 15, color: '#6D6C6A' }}>
                  {park.address || 'San Francisco, CA'}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <ButtonOutline label="Directions" onPress={handleDirections} />
                <ButtonOutline label="Schedule Play Date" onPress={handleSchedule} />
                <ButtonPrimary
                  label={userCheckIn ? 'Check-out' : 'Check-in'}
                  onPress={handleOpenCheckIn}
                  loading={checkInLoading}
                  variant={userCheckIn ? 'active' : 'primary'}
                />
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#E5E4E1' }} />

              {/* Park Features */}
              <View style={{ gap: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.light.text }}>
                  Park Features
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {features.map((feature, index) => (
                    <FeatureTag key={index} icon={feature.icon} label={feature.label} />
                  ))}
                </View>
              </View>

              {/* Upcoming Play Dates - Show on mobile/tablet, desktop shows in right column */}
              {!isDesktop && (
                <View style={{ gap: 14 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.light.text }}>
                    Upcoming Play Dates
                  </Text>
                  {playdatesLoading ? (
                    <ActivityIndicator size="small" color="#3D8A5A" />
                  ) : playdates.length > 0 ? (
                    playdates.map((playdate) => (
                      <PlaydateCard
                        key={playdate.id}
                        playdate={playdate}
                        onPress={() => router.push(`/playdates/${playdate.id}`)}
                      />
                    ))
                  ) : (
                    <Text style={{ fontSize: 14, color: '#6D6C6A' }}>No upcoming play dates</Text>
                  )}
                  <Pressable
                    onPress={handleSchedule}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#3D8A5A',
                      paddingVertical: 14,
                      borderRadius: 12,
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                      Schedule a Play Date
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Right Column - Cards (Desktop only) */}
            {isDesktop && (
              <View style={{ width: 360, gap: 24 }}>
                {/* Pups at the Park Now */}
                <View
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 24,
                    shadowColor: '#1A1918',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 12,
                    gap: 16,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.light.text }}>
                    Pups at the Park Now
                  </Text>
                  {checkedInDogs.length > 0 ? (
                    <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                      {checkedInDogs.map((dog) => (
                        <DogAvatar
                          key={dog.id}
                          dog={dog}
                          onPress={() => router.push(`/dogs/${dog.id}`)}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 14, color: '#6D6C6A' }}>No pups here right now</Text>
                  )}
                </View>

                {/* About This Park */}
                <View
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 24,
                    shadowColor: '#1A1918',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 12,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.light.text }}>
                    About This Park
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6D6C6A', lineHeight: 21 }}>
                    {park.description ||
                      'A spacious off-leash dog park with separate sections for large and small dogs, featuring plenty of shade and water access.'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="time-outline" size={14} color="#878685" />
                    <Text style={{ fontSize: 13, color: '#878685' }}>
                      Open daily: 6:00 AM - 10:00 PM
                    </Text>
                  </View>
                </View>

                {/* Upcoming Play Dates */}
                <View
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 24,
                    shadowColor: '#1A1918',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 12,
                    gap: 16,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.light.text }}>
                    Upcoming Play Dates
                  </Text>
                  {playdatesLoading ? (
                    <ActivityIndicator size="small" color="#3D8A5A" />
                  ) : playdates.length > 0 ? (
                    <View style={{ gap: 12 }}>
                      {playdates.slice(0, 3).map((playdate) => (
                        <PlaydateCard
                          key={playdate.id}
                          playdate={playdate}
                          onPress={() => router.push(`/playdates/${playdate.id}`)}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 14, color: '#6D6C6A' }}>No upcoming play dates</Text>
                  )}
                  <Pressable
                    onPress={handleSchedule}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#3D8A5A',
                      paddingVertical: 12,
                      borderRadius: 9999,
                      gap: 8,
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                      Schedule Play Date
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Mobile/Tablet: Pups at the Park & About sections */}
          {!isDesktop && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 100, gap: 24 }}>
              {/* Pups at the Park Now */}
              <View style={{ gap: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.light.text }}>
                  Pups at the Park Now
                </Text>
                {checkedInDogs.length > 0 ? (
                  <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                    {checkedInDogs.map((dog) => (
                      <DogAvatar
                        key={dog.id}
                        dog={dog}
                        onPress={() => router.push(`/dogs/${dog.id}`)}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontSize: 14, color: '#6D6C6A' }}>No pups here right now</Text>
                )}
              </View>

              {/* About This Park */}
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.light.text }}>
                  About This Park
                </Text>
                <Text style={{ fontSize: 14, color: '#6D6C6A', lineHeight: 21 }}>
                  {park.description ||
                    'A spacious off-leash dog park with separate sections for large and small dogs, featuring plenty of shade and water access.'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="time-outline" size={14} color="#878685" />
                  <Text style={{ fontSize: 13, color: '#878685' }}>
                    Open daily: 6:00 AM - 10:00 PM
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Mobile: Fixed Bottom Check-in Button */}
        {isMobile && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#F5F4F1',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: '#E5E4E1',
            }}
          >
            <Pressable
              onPress={handleOpenCheckIn}
              disabled={checkInLoading}
              style={{
                backgroundColor: userCheckIn ? '#B5725E' : '#3D8A5A',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              {checkInLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  {userCheckIn ? 'Check-out' : 'Check-in'}
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* Check-in Modal */}
      <Modal
        visible={checkInModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCheckInModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 24,
              padding: 24,
              width: '100%',
              maxWidth: 480,
              maxHeight: '80%',
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.light.text }}>
                Check-in at {park.name}
              </Text>
              <Pressable
                onPress={() => setCheckInModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#EDECEA',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="close" size={20} color="#6D6C6A" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Dogs Section */}
              <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 12 }}>
                Which dogs are with you?
              </Text>

              {dogs.length === 0 ? (
                <Text style={{ fontSize: 15, color: '#6D6C6A', textAlign: 'center', paddingVertical: 32 }}>
                  You have not added any dogs yet. Add a dog from your profile first.
                </Text>
              ) : (
                <>
                  <View style={{ gap: 10, marginBottom: 24 }}>
                    {dogs.map((dog) => {
                      const isSelected = selectedDogIds.includes(dog.id);
                      return (
                        <Pressable
                          key={dog.id}
                          onPress={() => toggleDog(dog.id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: isSelected ? '#3D8A5A' : 'transparent',
                            backgroundColor: isSelected ? '#E8F0E8' : '#F5F4F1',
                          }}
                        >
                          <Image
                            source={{
                              uri:
                                dog.photo_url ||
                                'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
                            }}
                            style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }}
                          />
                          <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: Colors.light.text }}>
                            {dog.name}
                          </Text>
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              borderWidth: 2,
                              borderColor: isSelected ? '#3D8A5A' : '#E5E4E1',
                              backgroundColor: isSelected ? '#3D8A5A' : '#fff',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Duration Section */}
                  <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 12 }}>
                    How long are you staying?
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                    {DURATIONS.map((duration) => (
                      <Pressable
                        key={duration.value}
                        onPress={() => setSelectedDuration(duration.value)}
                        style={{
                          flex: 1,
                          minWidth: '45%',
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: selectedDuration === duration.value ? '#3D8A5A' : '#E5E4E1',
                          backgroundColor: selectedDuration === duration.value ? '#3D8A5A' : '#F5F4F1',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: selectedDuration === duration.value ? '600' : '500',
                            color: selectedDuration === duration.value ? '#fff' : Colors.light.text,
                          }}
                        >
                          {duration.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Confirm Button */}
                  <Pressable
                    onPress={handleConfirmCheckIn}
                    disabled={selectedDogIds.length === 0}
                    style={{
                      backgroundColor: selectedDogIds.length === 0 ? '#D1D0CD' : '#3D8A5A',
                      paddingVertical: 16,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                      Confirm Check-in
                    </Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
    </>
  );
}

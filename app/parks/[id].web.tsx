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
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { parseSlugOrId } from '@/src/utils/slug';
import type { Park, Dog } from '@/src/types/database';

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
          borderColor: '#E5E7EB',
        }}
        resizeMode="cover"
      />
      <Text
        style={{
          fontSize: 11,
          fontWeight: '500',
          color: '#6B7280',
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
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 9999,
        gap: 8,
      }}
    >
      <Ionicons name={icon} size={14} color="#6B7280" />
      <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280' }}>{label}</Text>
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
        borderColor: '#E5E7EB',
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
  const bgColor = variant === 'danger' ? '#EF4444' : variant === 'active' ? '#2D8B57' : '#6FCF97';
  
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 9999,
        backgroundColor: disabled ? '#D1D5DB' : bgColor,
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

export default function ParkDetailWebScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const showSidebar = width >= 768;

  const { id: slugOrId } = useLocalSearchParams<{ id: string }>();
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
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F7F8FA' }}>
        {showSidebar && <DesktopSidebar />}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6FCF97" />
        </View>
      </View>
    );
  }

  if (error || !park) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F7F8FA' }}>
        {showSidebar && <DesktopSidebar />}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#FEE2E2',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="alert-circle" size={32} color="#EF4444" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.light.text, marginBottom: 8 }}>
            {error ?? 'Park not found'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
            We couldn't load this park. It may have been removed or the link may be incorrect.
          </Text>
          <ButtonPrimary label="Go Back" onPress={handleBack} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F7F8FA' }}>
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
                  park.image_url ||
                  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&h=400&fit=crop',
              }}
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
              flexDirection: isMobile ? 'column' : 'row',
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
                <Text style={{ fontSize: 15, color: '#6B7280' }}>
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
              <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />

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

              {/* Upcoming Play Dates - Show on mobile only, desktop shows in right column */}
              {isMobile && (
                <View style={{ gap: 14 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.light.text }}>
                    Upcoming Play Dates
                  </Text>
                  {playdatesLoading ? (
                    <ActivityIndicator size="small" color="#6FCF97" />
                  ) : playdates.length > 0 ? (
                    playdates.map((playdate) => (
                      <PlaydateCard
                        key={playdate.id}
                        playdate={playdate}
                        onPress={() => router.push(`/playdates/${playdate.id}`)}
                      />
                    ))
                  ) : (
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>No upcoming play dates</Text>
                  )}
                  <Pressable
                    onPress={handleSchedule}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#6FCF97',
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
            {!isMobile && (
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
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>No pups here right now</Text>
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
                  <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 21 }}>
                    {park.description ||
                      'A spacious off-leash dog park with separate sections for large and small dogs, featuring plenty of shade and water access.'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                    <Text style={{ fontSize: 13, color: '#9CA3AF' }}>
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
                    <ActivityIndicator size="small" color="#6FCF97" />
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
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>No upcoming play dates</Text>
                  )}
                  <Pressable
                    onPress={handleSchedule}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#6FCF97',
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

          {/* Mobile: Pups at the Park & About sections */}
          {isMobile && (
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
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>No pups here right now</Text>
                )}
              </View>

              {/* About This Park */}
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.light.text }}>
                  About This Park
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 21 }}>
                  {park.description ||
                    'A spacious off-leash dog park with separate sections for large and small dogs, featuring plenty of shade and water access.'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                  <Text style={{ fontSize: 13, color: '#9CA3AF' }}>
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
              backgroundColor: '#F7F8FA',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}
          >
            <Pressable
              onPress={handleOpenCheckIn}
              disabled={checkInLoading}
              style={{
                backgroundColor: userCheckIn ? '#EF4444' : '#6FCF97',
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
                  backgroundColor: '#F3F4F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Dogs Section */}
              <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 12 }}>
                Which dogs are with you?
              </Text>

              {dogs.length === 0 ? (
                <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', paddingVertical: 32 }}>
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
                            borderColor: isSelected ? '#6FCF97' : 'transparent',
                            backgroundColor: isSelected ? '#F0FDF4' : '#F7F8FA',
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
                              borderColor: isSelected ? '#6FCF97' : '#E5E7EB',
                              backgroundColor: isSelected ? '#6FCF97' : '#fff',
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
                          borderColor: selectedDuration === duration.value ? '#6FCF97' : '#E5E7EB',
                          backgroundColor: selectedDuration === duration.value ? '#6FCF97' : '#F7F8FA',
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
                      backgroundColor: selectedDogIds.length === 0 ? '#D1D5DB' : '#6FCF97',
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
  );
}

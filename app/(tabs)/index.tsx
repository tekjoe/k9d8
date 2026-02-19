import React, { useCallback, useState, useMemo, lazy, Suspense } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const ParkMap = lazy(() => import('@/src/components/parks/ParkMap'));
import { useAuth } from '@/src/hooks/useAuth';
import { useNotificationsData } from '@/src/hooks/useNotificationsData';
import { useLocation } from '@/src/hooks/useLocation';
import { useParks } from '@/src/hooks/useParks';
import { usePlaydates } from '@/src/hooks/usePlaydates';
import { useNearbyPups } from '@/src/hooks/useNearbyPups';
import { format } from 'date-fns';
import { generateParkSlug } from '@/src/utils/slug';
import { getParkStateSlug } from '@/src/services/parks';
import type { Park, PlayDate } from '@/src/types/database';

function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  const mi = km * 0.621371;
  if (mi < 0.1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${mi.toFixed(1)} mi`;
}

interface PlaydateCardProps {
  playdate: PlayDate;
  onPress: () => void;
  accentColor?: string;
}

function PlaydateCard({ playdate, onPress, accentColor = '#3D8A5A' }: PlaydateCardProps) {
  const date = new Date(playdate.starts_at);
  const timeValue = format(date, 'h:mm');
  const timePeriod = format(date, 'a').toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#1A1918',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
      }}
    >
      <View style={{ width: 4, backgroundColor: accentColor }} />
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14 }}>
        <View style={{ width: 48, gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1918' }}>
            {timeValue}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '500', color: '#878685' }}>
            {timePeriod}
          </Text>
        </View>
        <View style={{ width: 1, height: 36, backgroundColor: '#E5E4E1' }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#1A1918' }} numberOfLines={1}>
            {playdate.title}
          </Text>
          <Text style={{ fontSize: 12, color: '#878685' }} numberOfLines={1}>
            {playdate.park?.name || 'Unknown Park'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

interface ParkCardProps {
  park: Park;
  pupCount: number;
  distanceKm?: number;
  onPress: () => void;
}

function ParkCard({ park, pupCount, distanceKm, onPress }: ParkCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E4E1',
      }}
    >
      {park.image_url ? (
        <Image
          source={{ uri: park.image_url }}
          style={{ width: '100%', height: 100 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: '100%', height: 100, backgroundColor: '#EDECEA', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="leaf-outline" size={32} color="#878685" />
        </View>
      )}
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1918', flex: 1, marginRight: 8 }} numberOfLines={1}>
            {park.name}
          </Text>
          {distanceKm !== undefined && (
            <Text style={{ fontSize: 12, color: '#6D6C6A' }}>
              {formatDistance(distanceKm)}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="paw" size={14} color="#3D8A5A" />
          <Text style={{ fontSize: 13, color: '#3D8A5A', fontWeight: '600', marginLeft: 6 }}>
            {pupCount} {pupCount === 1 ? 'pup' : 'pups'} here now
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function NearbyPupsSection({ onPupPress }: { onPupPress: (dogId: string) => void }) {
  const { pups, loading } = useNearbyPups();

  if (loading) {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#E5E4E1',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="small" color="#878685" />
          </View>
        ))}
      </View>
    );
  }

  const uniquePups = useMemo(() => {
    const seen = new Set<string>();
    return pups.filter((pup) => {
      if (seen.has(pup.dog.id)) return false;
      seen.add(pup.dog.id);
      return true;
    });
  }, [pups]);

  if (uniquePups.length === 0) {
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#6D6C6A' }}>No pups checked in nearby</Text>
      </View>
    );
  }

  const displayPups = uniquePups.slice(0, 6);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {displayPups.map((pup) => (
        <Pressable
          key={pup.dog.id}
          onPress={() => onPupPress(pup.dog.id)}
          style={{ alignItems: 'center', width: 56 }}
        >
          <Image
            source={{
              uri:
                pup.dog.photo_url ||
                'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
            }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
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
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {pup.dog.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { unreadCount } = useNotificationsData({ limit: 1 });
  const { location } = useLocation();
  const { parks, checkInCounts, loading: parksLoading } = useParks();
  const { myPlaydates, loading: playdatesLoading } = usePlaydates();

  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const userName = session?.user?.user_metadata?.display_name || 'Alex';

  const handleParkPress = useCallback(
    (park: Park) => {
      const stateSlug = getParkStateSlug(park);
      const slug = stateSlug
        ? `${stateSlug}/${generateParkSlug(park.name)}`
        : generateParkSlug(park.name);
      router.push(`/dog-parks/${slug}`);
    },
    [router]
  );

  const handlePlaydatePress = useCallback(
    (playdateId: string) => {
      router.push(`/playdates/${playdateId}`);
    },
    [router]
  );

  const handleNotificationPress = useCallback(() => {
    router.push('/notifications');
  }, [router]);

  // Get top 2 upcoming playdates
  const upcomingPlaydates = myPlaydates.slice(0, 2);

  // Search results
  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    return parks
      .filter((park) =>
        park.name.toLowerCase().includes(query) ||
        (park.address && park.address.toLowerCase().includes(query))
      )
      .map((park) => ({
        park,
        distanceKm: location
          ? getDistanceKm(location.latitude, location.longitude, park.latitude, park.longitude)
          : undefined,
      }))
      .sort((a, b) => {
        if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, 5);
  }, [parks, location, searchQuery]);

  // All parks within 10 miles, sorted by distance
  const parksWithinRadius = useMemo(() => {
    const TEN_MILES_KM = 16.09;
    return parks
      .map((park) => ({
        park,
        distanceKm: location
          ? getDistanceKm(location.latitude, location.longitude, park.latitude, park.longitude)
          : undefined,
      }))
      .filter((p) => p.distanceKm === undefined || p.distanceKm <= TEN_MILES_KM)
      .sort((a, b) => {
        if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }, [parks, location]);

  // Nearby parks - shows top 2 closest parks
  const nearbyParks = parksWithinRadius.slice(0, 2);

  const isLoading = parksLoading || playdatesLoading;
  const showSearchResults = searchQuery.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          gap: 14,
          zIndex: 100,
        }}
      >
        {/* Greeting + Notification */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918' }}>
            Hi, {userName}
          </Text>
          <Pressable
            onPress={handleNotificationPress}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              backgroundColor: '#F5F4F1',
            }}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons name="notifications-outline" size={24} color="#1A1918" />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: '#B5725E',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>

        {/* Search Input */}
        <View style={{ position: 'relative' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F5F4F1',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <Ionicons name="search" size={20} color="#6D6C6A" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search dog parks..."
              placeholderTextColor="#878685"
              style={{ flex: 1, marginLeft: 8, fontSize: 15, color: '#1A1918' }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#878685" />
              </Pressable>
            )}
          </View>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <View
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 8,
                backgroundColor: '#fff',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
                zIndex: 1000,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#E5E4E1',
              }}
            >
              {searchResults.length > 0 ? (
                searchResults.map(({ park, distanceKm }, index) => (
                  <Pressable
                    key={park.id}
                    onPress={() => {
                      handleParkPress(park);
                      setSearchQuery('');
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      backgroundColor: '#fff',
                      borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
                      borderBottomColor: '#EDECEA',
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: '#EDECEA',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="location" size={20} color="#3D8A5A" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918' }} numberOfLines={1}>
                        {park.name}
                      </Text>
                    </View>
                    {distanceKm !== undefined && (
                      <Text style={{ fontSize: 12, color: '#6D6C6A', marginLeft: 8 }}>
                        {formatDistance(distanceKm)}
                      </Text>
                    )}
                  </Pressable>
                ))
              ) : (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#6D6C6A' }}>
                    No parks found for "{searchQuery}"
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1, zIndex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <ActivityIndicator size="large" color="#3D8A5A" />
          </View>
        ) : (
          <>
            {/* Upcoming Play Dates */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>
                  Upcoming Play Dates
                </Text>
                <Pressable onPress={() => router.push('/explore')}>
                  <Text style={{ fontSize: 13, color: '#3D8A5A', fontWeight: '500' }}>See all</Text>
                </Pressable>
              </View>

              <View style={{ gap: 12 }}>
                {upcomingPlaydates.map((playdate, index) => (
                  <PlaydateCard
                    key={playdate.id}
                    playdate={playdate}
                    onPress={() => handlePlaydatePress(playdate.id)}
                    accentColor={index % 2 === 0 ? '#3D8A5A' : '#D89575'}
                  />
                ))}
              </View>

              {upcomingPlaydates.length === 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: '#6D6C6A', textAlign: 'center' }}>
                    No upcoming play dates
                  </Text>
                </View>
              )}
            </View>

            {/* Nearby Parks */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1918' }}>
                  Nearby Parks
                </Text>
                <Pressable onPress={() => router.push('/explore')}>
                  <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '600' }}>View map</Text>
                </Pressable>
              </View>

              <View style={{ gap: 16 }}>
                {nearbyParks.map(({ park, distanceKm }) => (
                  <ParkCard
                    key={park.id}
                    park={park}
                    pupCount={checkInCounts[park.id] || 0}
                    distanceKm={distanceKm}
                    onPress={() => handleParkPress(park)}
                  />
                ))}
              </View>

              {nearbyParks.length === 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: '#6D6C6A', textAlign: 'center' }}>
                    No nearby parks found
                  </Text>
                </View>
              )}
            </View>

            {/* Map Preview */}
            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  height: 200,
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: '#EDECEA',
                  shadowColor: '#1A1918',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 12,
                }}
              >
                <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#3D8A5A" /></View>}>
                  <ParkMap
                    parks={parks}
                    checkInCounts={checkInCounts}
                    userLocation={location}
                    onParkSelect={handleParkPress}
                  />
                </Suspense>
              </View>

              {/* Parks Near You Bar */}
              <Pressable
                onPress={() => router.push('/explore')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  padding: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  marginTop: 12,
                  shadowColor: '#1A1918',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 8,
                  gap: 10,
                }}
              >
                <Ionicons name="location" size={18} color="#3D8A5A" />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1918', flex: 1 }}>
                  {parksWithinRadius.length} {parksWithinRadius.length === 1 ? 'park' : 'parks'} near you
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#3D8A5A' }}>
                  Open Map
                </Text>
              </Pressable>
            </View>

            {/* Pups Nearby */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 20,
                shadowColor: '#1A1918',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 12,
                gap: 14,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }}>Pups Nearby</Text>
              <NearbyPupsSection onPupPress={(dogId) => router.push(`/dogs/${dogId}`)} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

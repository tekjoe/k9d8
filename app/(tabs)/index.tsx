import React, { useCallback, useState, useMemo } from 'react';
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
import { useAuth } from '@/src/hooks/useAuth';
import { useLocation } from '@/src/hooks/useLocation';
import { useParks } from '@/src/hooks/useParks';
import { usePlaydates } from '@/src/hooks/usePlaydates';
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
        marginBottom: 16,
      }}
    >
      <Image
        source={{
          uri: park.image_url || '/images/dog-park-placeholder.png',
        }}
        style={{ width: '100%', height: 128 }}
        resizeMode="cover"
      />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1918', flex: 1, marginRight: 8 }} numberOfLines={1}>
            {park.name}
          </Text>
          {distanceKm !== undefined && (
            <Text style={{ fontSize: 14, color: '#6D6C6A' }}>
              {formatDistance(distanceKm)}
            </Text>
          )}
        </View>
        {/* Address hidden pending data remediation */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="paw" size={14} color="#3D8A5A" />
          <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '600', marginLeft: 6 }}>
            {pupCount} {pupCount === 1 ? 'pup' : 'pups'} here now
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { location } = useLocation();
  const { parks, checkInCounts, loading: parksLoading } = useParks();
  const { myPlaydates, loading: playdatesLoading } = usePlaydates();

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

  // Get top 2 upcoming playdates
  const upcomingPlaydates = myPlaydates.slice(0, 2);

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

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View 
        style={{ 
          backgroundColor: '#fff', 
          borderBottomWidth: 1, 
          borderBottomColor: '#E5E4E1',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918' }}>
          Hi, {userName}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
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
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1918' }}>
                  Nearby Parks
                </Text>
                <Pressable onPress={() => router.push('/explore')}>
                  <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '600' }}>View map</Text>
                </Pressable>
              </View>
              
              {nearbyParks.map(({ park, distanceKm }) => (
                <ParkCard
                  key={park.id}
                  park={park}
                  pupCount={checkInCounts[park.id] || 0}
                  distanceKm={distanceKm}
                  onPress={() => handleParkPress(park)}
                />
              ))}
              
              {nearbyParks.length === 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: '#6D6C6A', textAlign: 'center' }}>
                    No nearby parks found
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

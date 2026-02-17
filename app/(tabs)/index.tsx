import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/hooks/useAuth';
import { useLocation } from '@/src/hooks/useLocation';
import { useParks } from '@/src/hooks/useParks';
import { usePlaydates } from '@/src/hooks/usePlaydates';
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

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, 'h:mm');
}

function formatAmPm(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, 'a');
}

interface PlaydateItemProps {
  playdate: PlayDate;
  onPress: () => void;
}

function PlaydateItem({ playdate, onPress }: PlaydateItemProps) {
  return (
    <Pressable 
      onPress={onPress}
      className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="items-center min-w-[50px]">
        <Text className="text-base font-bold text-text">{formatTime(playdate.starts_at)}</Text>
        <Text className="text-xs text-text-secondary mt-0.5">{formatAmPm(playdate.starts_at)}</Text>
      </View>
      <View className="w-0.5 h-10 bg-secondary rounded-sm mx-4" />
      <View className="flex-1">
        <Text className="text-base font-semibold text-text mb-1" numberOfLines={1}>
          {playdate.title}
        </Text>
        <Text className="text-sm text-text-secondary" numberOfLines={1}>
          {playdate.park?.name || 'Unknown Park'}
        </Text>
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

function NearbyParkCard({ park, pupCount, distanceKm, onPress }: ParkCardProps) {

  return (
    <Pressable 
      onPress={onPress}
      className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Image
        source={{
          uri: park.image_url ||
            'https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=400&h=300&fit=crop',
        }}
        className="w-full h-36"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-lg font-bold text-text flex-1 mr-2" numberOfLines={1}>
            {park.name}
          </Text>
          {distanceKm !== undefined && (
            <Text className="text-sm text-text-secondary">{formatDistance(distanceKm)}</Text>
          )}
        </View>
        {park.address && (
          <Text className="text-sm text-text-secondary mb-2" numberOfLines={1}>
            {park.address}
          </Text>
        )}
        <View className="flex-row items-center">
          <Ionicons name="paw" size={14} color="#3D8A5A" />
          <Text className="text-sm text-secondary font-semibold ml-1.5">{pupCount} {pupCount === 1 ? 'pup' : 'pups'} here now</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { location } = useLocation();
  const { parks, checkInCounts, loading: parksLoading, loadParks } = useParks();
  const { myPlaydates, loading: playdatesLoading, refresh: refreshPlaydates } = usePlaydates();

  const [searchQuery, setSearchQuery] = useState('');

  // Track whether this is the first mount so we don't double-fetch
  const isFirstMount = useRef(true);

  // Re-fetch play dates and check-in counts whenever this screen comes back
  // into focus (e.g. after checking in at a park or creating a new play date)
  useFocusEffect(
    useCallback(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return; // skip the first focus — hooks already fetch on mount
      }
      refreshPlaydates();
      loadParks();
    }, [refreshPlaydates, loadParks])
  );

  const userName = session?.user?.user_metadata?.display_name || 'Alex';

  // Filter parks based on search query
  const filteredParks = useMemo(() => {
    if (!searchQuery.trim()) {
      return parks;
    }
    const query = searchQuery.toLowerCase();
    return parks.filter(
      (park) =>
        park.name.toLowerCase().includes(query) ||
        (park.address && park.address.toLowerCase().includes(query))
    );
  }, [parks, searchQuery]);

  const handleParkPress = useCallback(
    (parkId: string) => {
      router.push(`/parks/${parkId}`);
    },
    [router]
  );

  const handlePlaydatePress = useCallback(
    (playdateId: string) => {
      router.push(`/playdates/${playdateId}`);
    },
    [router]
  );

  const handleSeeAllPlaydates = useCallback(() => {
    router.push('/explore');
  }, [router]);

  const handleViewMap = useCallback(() => {
    router.push('/explore');
  }, [router]);

  const handleNotificationPress = useCallback(() => {
    // Navigate to notifications
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/explore',
        params: { search: searchQuery.trim() },
      });
    }
  }, [searchQuery, router]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Get top 2 upcoming playdates
  const upcomingPlaydates = myPlaydates.slice(0, 2);

  // Sort parks by distance from user, with computed distance attached
  const parksWithDistance = useMemo(() => {
    return parks.map((park) => ({
      park,
      distanceKm: location
        ? getDistanceKm(location.latitude, location.longitude, park.latitude, park.longitude)
        : undefined,
    })).sort((a, b) => {
      if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
      if (a.distanceKm === undefined) return 1;
      if (b.distanceKm === undefined) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [parks, location]);

  // Get nearby parks (sorted by distance) or filtered parks if searching
  const displayParks = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredParks.map((park) => ({
        park,
        distanceKm: location
          ? getDistanceKm(location.latitude, location.longitude, park.latitude, park.longitude)
          : undefined,
      }));
    }
    return parksWithDistance.slice(0, 6);
  }, [searchQuery, filteredParks, parksWithDistance, location]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1', paddingTop: insets.top }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row justify-between items-start px-5 pt-2 pb-4">
          <View>
            <Text className="text-sm text-[#6D6C6A] mb-1">Good morning! 👋</Text>
            <Text className="text-[28px] font-bold text-[#1A1918]">Hi, {userName}</Text>
          </View>
          <Pressable 
            onPress={handleNotificationPress}
            className="w-11 h-11 rounded-full bg-white justify-center items-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#1A1918" />
            <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#B5725E]" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View 
          className="flex-row items-center bg-white mx-5 mb-3 px-4 h-[52px] rounded-xl"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Ionicons name="search" size={20} color="#6D6C6A" style={{ marginRight: 12 }} />
          <TextInput
            className="flex-1 text-base text-[#1A1918]"
            placeholder="Search dog parks nearby..."
            placeholderTextColor="#6D6C6A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch} className="p-1">
              <Ionicons name="close-circle" size={20} color="#6D6C6A" />
            </Pressable>
          )}
        </View>

        {/* Search Results Indicator */}
        {searchQuery.trim() && (
          <View className="mx-5 mb-4">
            <Text className="text-sm text-[#6D6C6A]">
              {filteredParks.length === 0
                ? `No parks found for "${searchQuery}"`
                : `Found ${filteredParks.length} park${filteredParks.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        )}

        {/* Upcoming Play Dates - Hide when searching */}
        {!searchQuery.trim() && (
          <View className="mb-6 px-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-[#1A1918]">Upcoming Play Dates</Text>
              <Pressable onPress={handleSeeAllPlaydates}>
                <Text className="text-sm font-semibold text-[#3D8A5A]">See all</Text>
              </Pressable>
            </View>

            {playdatesLoading && upcomingPlaydates.length === 0 ? (
              <ActivityIndicator size="small" color="#3D8A5A" />
            ) : upcomingPlaydates.length > 0 ? (
              upcomingPlaydates.map((playdate) => (
                <PlaydateItem
                  key={playdate.id}
                  playdate={playdate}
                  onPress={() => handlePlaydatePress(playdate.id)}
                />
              ))
            ) : (
              <View className="items-center py-8">
                <Text className="text-sm text-[#6D6C6A]">No upcoming play dates</Text>
              </View>
            )}

            <Pressable
              onPress={() => router.push('/playdates/create')}
              className="flex-row items-center justify-center bg-[#3D8A5A] py-3.5 rounded-xl mt-1"
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text className="text-white text-[15px] font-semibold ml-2">Schedule a Play Date</Text>
            </Pressable>
          </View>
        )}

        {/* Nearby Parks / Search Results */}
        <View className="mb-6 px-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-[#1A1918]">
              {searchQuery.trim() ? 'Search Results' : 'Nearby Parks'}
            </Text>
            {!searchQuery.trim() && (
              <Pressable onPress={handleViewMap}>
                <Text className="text-sm font-semibold text-[#3D8A5A]">View map</Text>
              </Pressable>
            )}
          </View>

          {parksLoading && displayParks.length === 0 ? (
            <ActivityIndicator size="small" color="#3D8A5A" />
          ) : displayParks.length > 0 ? (
            displayParks.map(({ park, distanceKm }) => (
              <NearbyParkCard
                key={park.id}
                park={park}
                pupCount={checkInCounts[park.id] || 0}
                distanceKm={distanceKm}
                onPress={() => handleParkPress(park.id)}
              />
            ))
          ) : (
            <View className="items-center py-8">
              <Text className="text-sm text-[#6D6C6A]">
                {searchQuery.trim()
                  ? 'No parks match your search'
                  : 'No parks found nearby'}
              </Text>
            </View>
          )}
        </View>

        {/* Show All Results Button when searching */}
        {searchQuery.trim() && filteredParks.length > 0 && (
          <Pressable 
            onPress={handleSearchSubmit}
            className="flex-row items-center justify-center bg-white mx-5 mt-2 py-3.5 rounded-xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text className="text-base font-semibold text-[#3D8A5A] mr-2">View all on map</Text>
            <Ionicons name="arrow-forward" size={16} color="#3D8A5A" />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

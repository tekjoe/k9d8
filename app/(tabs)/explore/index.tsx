import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const ParkMap = lazy(() => import('@/src/components/parks/ParkMap'));
import { useLocation } from '@/src/hooks/useLocation';
import { useNearbyParks } from '@/src/hooks/useNearbyParks';
import { generateParkSlug } from '@/src/utils/slug';
import { getParkStateSlug } from '@/src/services/parks';
import type { Park } from '@/src/types/database';

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

interface ParkListItemProps {
  park: Park;
  pupCount: number;
  distanceKm?: number;
  onPress: () => void;
}

function ParkListItem({ park, pupCount, distanceKm, onPress }: ParkListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      {park.image_url ? (
        <Image
          source={{ uri: park.image_url }}
          style={{ width: 56, height: 56, borderRadius: 8 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#EDECEA', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="leaf-outline" size={24} color="#878685" />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1918', marginBottom: 2 }} numberOfLines={1}>
          {park.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="paw" size={12} color="#3D8A5A" />
          <Text style={{ fontSize: 13, color: '#3D8A5A', fontWeight: '500', marginLeft: 4 }}>
            {pupCount} {pupCount === 1 ? 'pup' : 'pups'} here now
          </Text>
        </View>
        {distanceKm !== undefined && (
          <Text style={{ fontSize: 12, color: '#6D6C6A', marginTop: 2 }}>
            {formatDistance(distanceKm)} away
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6D6C6A" />
    </Pressable>
  );
}

const INITIAL_PARKS_LIMIT = 10;
const LOAD_MORE_INCREMENT = 10;

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { location, isLoading: locationLoading } = useLocation();
  const { parks, checkInCounts, loading: parksLoading, loadingMore, loadBounds } = useNearbyParks(location, !locationLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);
  const [displayLimit, setDisplayLimit] = useState(INITIAL_PARKS_LIMIT);
  const [showMap, setShowMap] = useState(false);

  // Sort parks by distance
  const parksWithDistance = useMemo(() => {
    return parks
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
      });
  }, [parks, location]);

  // Filter parks based on search
  const allFilteredParks = useMemo(() => {
    if (!searchQuery.trim()) {
      return parksWithDistance;
    }
    const query = searchQuery.toLowerCase();
    return parksWithDistance.filter(
      ({ park }) =>
        park.name.toLowerCase().includes(query) ||
        (park.address && park.address.toLowerCase().includes(query))
    );
  }, [parksWithDistance, searchQuery]);

  // Limit displayed parks for performance
  const filteredParks = useMemo(() => {
    return allFilteredParks.slice(0, displayLimit);
  }, [allFilteredParks, displayLimit]);

  const hasMore = allFilteredParks.length > displayLimit;

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setDisplayLimit(INITIAL_PARKS_LIMIT);
  }, []);

  const handleLoadMore = useCallback(() => {
    setDisplayLimit((prev) => prev + LOAD_MORE_INCREMENT);
  }, []);

  const handleParkSelect = useCallback((park: Park) => {
    setSelectedPark(park);
  }, []);

  const handleParkPress = useCallback(
    (park: Park) => {
      const stateSlug = getParkStateSlug(park);
      const slug = stateSlug
        ? `${stateSlug}/${generateParkSlug(park.name)}`
        : generateParkSlug(park.name);
      router.push(`/dog-parks/${slug}` as any);
    },
    [router]
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#fff',
          paddingHorizontal: 16,
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918', marginBottom: 12 }}>
          Explore
        </Text>

        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F5F4F1',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Ionicons name="search" size={18} color="#6D6C6A" />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search parks..."
            placeholderTextColor="#878685"
            style={{ flex: 1, marginLeft: 8, fontSize: 15, color: '#1A1918' }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearchChange('')}>
              <Ionicons name="close-circle" size={18} color="#878685" />
            </Pressable>
          )}
        </View>

        {/* List / Map Toggle */}
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          <Pressable
            onPress={() => setShowMap(false)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: !showMap ? '#3D8A5A' : '#EDECEA',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '600', color: !showMap ? '#fff' : '#6D6C6A' }}>List</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowMap(true)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: showMap ? '#3D8A5A' : '#EDECEA',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '600', color: showMap ? '#fff' : '#6D6C6A' }}>Map</Text>
          </Pressable>
        </View>
      </View>

      {/* Map View — kept mounted, hidden via display */}
      <View style={{ flex: 1, position: 'relative', display: showMap ? 'flex' : 'none' }}>
        {parksLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDECEA' }}>
            <ActivityIndicator size="large" color="#3D8A5A" />
          </View>
        ) : (
          <>
            <Suspense fallback={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#3D8A5A" /></View>}>
              <ParkMap
                parks={searchQuery.trim() ? allFilteredParks.map(({ park }) => park) : parks}
                checkInCounts={checkInCounts}
                userLocation={location}
                onParkSelect={handleParkSelect}
                onBoundsChange={loadBounds}
              />
            </Suspense>
            {loadingMore && (
              <ActivityIndicator
                style={{ position: 'absolute', top: 16, alignSelf: 'center' }}
                color="#3D8A5A"
              />
            )}
          </>
        )}

        {/* Selected park card */}
        {selectedPark && (
          <View
            style={{
              position: 'absolute',
              bottom: 16 + insets.bottom,
              left: 16,
              right: 16,
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 8,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1918', flex: 1, marginRight: 8 }}>
                {selectedPark.name}
              </Text>
              <Pressable onPress={() => setSelectedPark(null)}>
                <Ionicons name="close" size={20} color="#6D6C6A" />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="paw" size={14} color="#3D8A5A" />
              <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '600', marginLeft: 6 }}>
                {checkInCounts[selectedPark.id] || 0} pups here now
              </Text>
            </View>
            <Pressable
              onPress={() => handleParkPress(selectedPark)}
              style={{ backgroundColor: '#3D8A5A', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>View Details</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* List View — kept mounted, hidden via display */}
      <ScrollView style={{ flex: 1, display: showMap ? 'none' : 'flex' }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {parksLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#3D8A5A" />
          </View>
        ) : (
          <>
            {filteredParks.map(({ park, distanceKm }) => (
              <ParkListItem
                key={park.id}
                park={park}
                pupCount={checkInCounts[park.id] || 0}
                distanceKm={distanceKm}
                onPress={() => handleParkPress(park)}
              />
            ))}
            {hasMore && (
              <Pressable
                onPress={handleLoadMore}
                style={{
                  backgroundColor: '#EDECEA',
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#3D8A5A', fontWeight: '600', fontSize: 14 }}>
                  Load More ({allFilteredParks.length - displayLimit} remaining)
                </Text>
              </Pressable>
            )}
            {filteredParks.length === 0 && (
              <Text style={{ color: '#6D6C6A', textAlign: 'center', paddingVertical: 40 }}>
                No parks found
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

import React, { useState, useMemo, useCallback } from 'react';
import { SEOHead } from '@/src/components/seo';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DesktopSidebar from '@/src/components/ui/DesktopSidebar';
import ParkMap from '@/src/components/parks/ParkMap.web';
import { useLocation } from '@/src/hooks/useLocation';
import { useParks } from '@/src/hooks/useParks';
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
  selected?: boolean;
  onPress: () => void;
}

function ParkListItem({ park, pupCount, distanceKm, selected, onPress }: ParkListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center rounded-lg p-3 mb-3 transition-all ${
        selected ? 'bg-secondary/10' : 'hover:bg-gray-50'
      }`}
    >
      <Image
        source={{
          uri: park.image_url || '/images/dog-park-placeholder.png',
        }}
        className="w-14 h-14 rounded-lg"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3">
        <Text className="text-sm font-semibold text-text mb-1" numberOfLines={1}>
          {park.name}
        </Text>
        <View className="flex-row items-center">
          <Ionicons name="paw" size={12} color="#3D8A5A" />
          <Text className="text-xs text-secondary font-medium ml-1">
            {pupCount} {pupCount === 1 ? 'pup' : 'pups'} here now
          </Text>
        </View>
        {distanceKm !== undefined && (
          <Text className="text-xs text-text-secondary mt-1">
            {formatDistance(distanceKm)} away
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const INITIAL_PARKS_LIMIT = 10;
const LOAD_MORE_INCREMENT = 10;

export default function DesktopExploreScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const showSidebar = width >= 768;
  
  const router = useRouter();
  const { location } = useLocation();
  const { parks, checkInCounts, loading: parksLoading } = useParks();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);
  const [displayLimit, setDisplayLimit] = useState(INITIAL_PARKS_LIMIT);
  const [mobileShowMap, setMobileShowMap] = useState(false);

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

  // Reset limit when search changes
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

  // Mobile view with toggle between list and map
  if (isMobile) {
    return (
      <>
      <SEOHead title="Explore Dog Parks" description="Explore dog parks near you on an interactive map. Find parks with amenities, see active dogs, and plan your next visit." url="/explore" />
      <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
        {/* Header with toggle */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E4E1' }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918', marginBottom: 12 }}>Explore</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F4F1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 }}>
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
          {/* Toggle buttons */}
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            <Pressable
              onPress={() => setMobileShowMap(false)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: !mobileShowMap ? '#3D8A5A' : '#EDECEA',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontWeight: '600', color: !mobileShowMap ? '#fff' : '#6D6C6A' }}>List</Text>
            </Pressable>
            <Pressable
              onPress={() => setMobileShowMap(true)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: mobileShowMap ? '#3D8A5A' : '#EDECEA',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontWeight: '600', color: mobileShowMap ? '#fff' : '#6D6C6A' }}>Map</Text>
            </Pressable>
          </View>
        </View>

        {/* Content */}
        {mobileShowMap ? (
          <View style={{ flex: 1, position: 'relative' }}>
            {parksLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDECEA' }}>
                <ActivityIndicator size="large" color="#3D8A5A" />
              </View>
            ) : (
              <ParkMap
                parks={parks}
                checkInCounts={checkInCounts}
                userLocation={location}
                onParkSelect={handleParkSelect}
              />
            )}
            {/* Selected park card */}
            {selectedPark && (
              <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <Pressable onPress={() => handleParkPress(selectedPark)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1918', flex: 1, marginRight: 8 }}>{selectedPark.name}</Text>
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
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
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
                    selected={selectedPark?.id === park.id}
                    onPress={() => handleParkPress(park)}
                  />
                ))}
                {hasMore && (
                  <Pressable
                    onPress={handleLoadMore}
                    style={{ backgroundColor: '#EDECEA', borderRadius: 8, padding: 12, marginTop: 8, alignItems: 'center' }}
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
        )}
      </View>
      </>
    );
  }

  // Desktop/Tablet layout
  return (
    <>
    <SEOHead title="Explore Dog Parks" description="Explore dog parks near you on an interactive map. Find parks with amenities, see active dogs, and plan your next visit." url="/explore" />
    <View className="flex-1 flex-row bg-background">
      {/* Left Sidebar */}
      {showSidebar && <DesktopSidebar />}

      {/* Parks List Panel */}
      <View className="w-90 bg-white border-r border-gray-200 flex-col">
        <View className="px-4 py-5">
          <View className="flex-row items-center bg-background rounded-lg px-3 py-2.5">
            <Ionicons name="search" size={18} color="#6D6C6A" />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search parks..."
              placeholderTextColor="#878685"
              className="flex-1 ml-2 text-sm text-text outline-none"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => handleSearchChange('')}>
                <Ionicons name="close-circle" size={18} color="#878685" />
              </Pressable>
            )}
          </View>
        </View>

        <View className="flex-1 px-4 pb-4">
          <Text className="text-base font-semibold text-text mb-4">
            Parks Near You
          </Text>

          {parksLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#3D8A5A" />
            </View>
          ) : (
            <ScrollView 
              className="flex-1"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {filteredParks.map(({ park, distanceKm }) => (
                <ParkListItem
                  key={park.id}
                  park={park}
                  pupCount={checkInCounts[park.id] || 0}
                  distanceKm={distanceKm}
                  selected={selectedPark?.id === park.id}
                  onPress={() => handleParkPress(park)}
                />
              ))}
              
              {hasMore && (
                <Pressable
                  onPress={handleLoadMore}
                  className="bg-background rounded-lg p-3 mt-2 items-center hover:bg-gray-200 transition-colors"
                >
                  <Text className="text-primary font-semibold text-sm">
                    Load More Parks ({allFilteredParks.length - displayLimit} remaining)
                  </Text>
                </Pressable>
              )}
              
              {filteredParks.length === 0 && (
                <Text className="text-text-secondary text-center py-8">
                  No parks found
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Map Area */}
      <View className="flex-1 relative">
        {parksLoading ? (
          <View className="flex-1 items-center justify-center bg-gray-100">
            <ActivityIndicator size="large" color="#3D8A5A" />
          </View>
        ) : (
          <ParkMap
            parks={parks}
            checkInCounts={checkInCounts}
            userLocation={location}
            onParkSelect={handleParkSelect}
          />
        )}

        {/* Park Info Card (when park is selected) */}
        {selectedPark && (
          <View className="absolute bottom-6 right-6 bg-white rounded-xl shadow-lg p-4 w-80 border border-gray-200">
            <Pressable onPress={() => handleParkPress(selectedPark)}>
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-bold text-text flex-1 mr-2">
                  {selectedPark.name}
                </Text>
                <Pressable onPress={() => setSelectedPark(null)}>
                  <Ionicons name="close" size={24} color="#6D6C6A" />
                </Pressable>
              </View>

              {selectedPark.address && (
                <View className="flex-row items-start mb-3">
                  <Ionicons name="location-outline" size={16} color="#6D6C6A" />
                  <Text className="text-sm text-text-secondary ml-1 flex-1">
                    {selectedPark.address}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center mb-3">
                <Ionicons name="paw" size={16} color="#3D8A5A" />
                <Text className="text-sm text-secondary font-semibold ml-1.5">
                  {checkInCounts[selectedPark.id] || 0} pups here now
                </Text>
              </View>

              {selectedPark.description && (
                <Text className="text-sm text-text-secondary mb-3" numberOfLines={2}>
                  {selectedPark.description}
                </Text>
              )}

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => handleParkPress(selectedPark)}
                  className="flex-1 bg-primary rounded-lg py-2.5 items-center"
                >
                  <Text className="text-white font-semibold">View Details</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleParkPress(selectedPark)}
                  className="flex-1 bg-secondary rounded-lg py-2.5 items-center"
                >
                  <Text className="text-white font-semibold">Check In</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        )}
      </View>
    </View>
    </>
  );
}

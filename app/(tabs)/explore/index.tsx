import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ParkMap from '@/src/components/parks/ParkMap';
import { useLocation } from '@/src/hooks/useLocation';
import { useParks } from '@/src/hooks/useParks';
import { useCheckIn } from '@/src/hooks/useCheckIn';
import { useDogs } from '@/src/hooks/useDogs';
import { useAuth } from '@/src/hooks/useAuth';
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

const DURATIONS = [
  { label: '30 mins', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { location, isLoading: locationLoading } = useLocation();
  const { parks, checkInCounts, loading: parksLoading } = useParks();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { dogs } = useDogs(userId);

  const [selectedPark, setSelectedPark] = useState<Park | null>(null);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const {
    activeCheckIns,
    userCheckIn,
    loading: checkInLoading,
    checkIn,
    checkOut,
  } = useCheckIn(selectedPark?.id || '');

  useEffect(() => {
    if (checkInModalVisible && dogs.length > 0) {
      setSelectedDogIds(dogs.map((d) => d.id));
    }
  }, [checkInModalVisible, dogs]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return parks
      .filter(
        (park) =>
          park.name.toLowerCase().includes(query) ||
          (park.address && park.address.toLowerCase().includes(query)),
      )
      .slice(0, 10);
  }, [parks, searchQuery]);

  const handleParkSelect = useCallback((park: Park) => {
    setSelectedPark(park);
    setSearchQuery('');
    setShowSearchResults(false);
  }, []);

  const handleParkPress = useCallback(() => {
    if (selectedPark) {
      router.push(`/parks/${selectedPark.id}`);
    }
  }, [selectedPark, router]);

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
      prev.includes(dogId)
        ? prev.filter((id) => id !== dogId)
        : [...prev, dogId],
    );
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setShowSearchResults(text.trim().length > 0);
  }, []);

  const handleSearchResultPress = useCallback(
    (park: Park) => {
      handleParkSelect(park);
    },
    [handleParkSelect],
  );

  const pupCount = selectedPark ? (checkInCounts[selectedPark.id] || 0) : 0;
  const distanceKm =
    selectedPark && location
      ? getDistanceKm(
          location.latitude,
          location.longitude,
          selectedPark.latitude,
          selectedPark.longitude,
        )
      : null;

  if (locationLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#3D8A5A" />
        <Text className="mt-3 text-base text-text-secondary">
          Getting your location...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Search Bar */}
      <View
        className="absolute left-4 right-4 z-10"
        style={{ top: insets.top + 8 }}
      >
        <View
          className="flex-row items-center bg-white px-4 h-[52px] rounded-xl shadow-lg"
          style={styles.cardShadow}
        >
          <Ionicons
            name="search"
            size={20}
            color="#6D6C6A"
            style={{ marginRight: 12 }}
          />
          <TextInput
            className="flex-1 text-base text-text"
            placeholder="Search for a park or address..."
            placeholderTextColor="#6D6C6A"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => {
              if (searchQuery.trim()) setShowSearchResults(true);
            }}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#878685" />
            </Pressable>
          )}
        </View>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <View
            className="bg-white rounded-xl mt-1 overflow-hidden"
            style={styles.cardShadow}
          >
            {searchResults.map((park, index) => (
              <Pressable
                key={park.id}
                onPress={() => handleSearchResultPress(park)}
                className="flex-row items-center px-4 py-3"
                style={
                  index < searchResults.length - 1
                    ? { borderBottomWidth: 1, borderBottomColor: '#EDECEA' }
                    : undefined
                }
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color="#6D6C6A"
                  style={{ marginRight: 12 }}
                />
                <View className="flex-1">
                  <Text
                    className="text-[15px] font-medium text-text"
                    numberOfLines={1}
                  >
                    {park.name}
                  </Text>
                  {park.address && (
                    <Text
                      className="text-[13px] text-text-secondary mt-0.5"
                      numberOfLines={1}
                    >
                      {park.address}
                    </Text>
                  )}
                </View>
                {location && (
                  <Text className="text-[13px] text-text-secondary ml-2">
                    {formatDistance(
                      getDistanceKm(
                        location.latitude,
                        location.longitude,
                        park.latitude,
                        park.longitude,
                      ),
                    )}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {showSearchResults &&
          searchQuery.trim().length > 0 &&
          searchResults.length === 0 && (
            <View
              className="bg-white rounded-xl mt-1 px-4 py-4"
              style={styles.cardShadow}
            >
              <Text className="text-text-secondary text-center text-[15px]">
                No parks found for "{searchQuery}"
              </Text>
            </View>
          )}
      </View>

      {/* Map - no Pressable wrapper so drag/pan works on Android */}
      <View className="flex-1">
        <ParkMap
          parks={parks}
          checkInCounts={checkInCounts}
          userLocation={location}
          onParkSelect={handleParkSelect}
          onMapPress={() => setShowSearchResults(false)}
        />
      </View>

      {/* Bottom Card for Selected Park */}
      {selectedPark && !showSearchResults && (
        <View
          className="absolute left-4 right-4"
          style={{ bottom: 16 }}
        >
          <Pressable
            onPress={handleParkPress}
            className="flex-row items-center bg-white rounded-2xl p-3 shadow-lg"
            style={styles.cardShadow}
          >
            <View className="w-20 h-20 rounded-xl mr-4 bg-[#F0F7F4] items-center justify-center">
              <Ionicons name="leaf-outline" size={32} color="#3D8A5A" />
            </View>
            <View className="flex-1 justify-center">
              <Text
                className="text-lg font-bold text-text mb-1"
                numberOfLines={1}
              >
                {selectedPark.name}
              </Text>
              <Text
                className="text-sm text-text-secondary mb-2"
                numberOfLines={1}
              >
                {selectedPark.address || 'Unknown address'}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="paw" size={14} color="#3D8A5A" />
                <Text className="text-sm font-semibold ml-1.5" style={{ color: '#3D8A5A' }}>
                  {pupCount} {pupCount === 1 ? 'pup' : 'pups'} here now
                </Text>
                {distanceKm !== null && (
                  <Text className="text-sm text-text-secondary ml-3">
                    {formatDistance(distanceKm)}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#878685" />
          </Pressable>
        </View>
      )}

      {/* Loading overlay */}
      {parksLoading && parks.length === 0 && (
        <View
          className="absolute top-24 self-center bg-white px-4 py-2.5 rounded-full shadow-lg"
          style={styles.loadingShadow}
        >
          <ActivityIndicator size="small" color="#3D8A5A" />
        </View>
      )}

      {/* Check-in Modal */}
      <Modal
        visible={checkInModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        {...(Platform.OS === 'android' && {
          hardwareAccelerated: true,
          navigationBarTranslucent: true,
        })}
        {...(Platform.OS === 'ios' && { presentationStyle: 'overFullScreen' })}
        onRequestClose={() => setCheckInModalVisible(false)}
      >
        <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
          <View
            className="bg-white rounded-t-[20px] px-5 pt-3"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            {/* Handle bar */}
            <View className="w-10 h-1 bg-border rounded-full self-center mb-4" />

            {/* Title */}
            <Text className="text-[22px] font-bold text-text mb-6">
              Check-in at {selectedPark?.name}
            </Text>

            {/* Dogs Section */}
            <Text className="text-base font-semibold text-text mb-3">
              Which dogs are with you?
            </Text>

            {dogs.length === 0 ? (
              <Text className="text-[15px] text-text-secondary text-center py-8">
                You have not added any dogs yet. Add a dog from your profile
                first.
              </Text>
            ) : (
              <>
                <View className="mb-6">
                  {dogs.map((dog) => {
                    const isSelected = selectedDogIds.includes(dog.id);
                    return (
                      <Pressable
                        key={dog.id}
                        onPress={() => toggleDog(dog.id)}
                        className={`flex-row items-center p-3 rounded-xl mb-2.5 border-2 ${
                          isSelected
                            ? 'border-[#3D8A5A] bg-[#E8F0E8]'
                            : 'border-transparent bg-background'
                        }`}
                      >
                        <Image
                          source={{
                            uri:
                              dog.photo_url ||
                              'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
                          }}
                          className="w-11 h-11 rounded-full mr-3"
                        />
                        <Text className="flex-1 text-base font-medium text-text">
                          {dog.name}
                        </Text>
                        <View
                          className={`w-6 h-6 rounded-md justify-center items-center border-2 ${
                            isSelected
                              ? 'bg-[#3D8A5A] border-[#3D8A5A]'
                              : 'bg-white border-border'
                          }`}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#fff"
                            />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Duration Section */}
                <Text className="text-base font-semibold text-text mb-3">
                  How long are you staying?
                </Text>

                <View className="flex-row flex-wrap gap-3 mb-6">
                  {DURATIONS.map((duration) => (
                    <Pressable
                      key={duration.value}
                      onPress={() => setSelectedDuration(duration.value)}
                      className={`flex-1 min-w-[45%] py-3.5 px-4 rounded-xl items-center border-2 ${
                        selectedDuration === duration.value
                          ? 'bg-[#3D8A5A] border-[#3D8A5A]'
                          : 'bg-background border-border'
                      }`}
                    >
                      <Text
                        className={`text-[15px] font-medium ${
                          selectedDuration === duration.value
                            ? 'text-white font-semibold'
                            : 'text-text'
                        }`}
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
                  className={`py-4 rounded-xl items-center mt-2 mb-4 ${
                    selectedDogIds.length === 0 ? 'bg-border' : 'bg-[#4A9B8E]'
                  }`}
                >
                  <Text className="text-white text-base font-semibold">
                    Confirm Check-in
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0)',
    justifyContent: 'flex-end',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});

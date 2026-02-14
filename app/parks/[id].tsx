import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

interface DogAvatarProps {
  dog: Dog;
  onPress?: () => void;
}

function DogAvatar({ dog, onPress }: DogAvatarProps) {
  return (
    <Pressable onPress={onPress} className="items-center">
      <Image
        source={{
          uri:
            dog.photo_url ||
            'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
        }}
        className="w-16 h-16 rounded-full mb-2"
        resizeMode="cover"
      />
      <Text className="text-[13px] text-text max-w-[64px]" numberOfLines={1}>{dog.name}</Text>
    </Pressable>
  );
}

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'active';
}

function ActionButton({ icon, label, onPress, variant = 'default' }: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  const isActive = variant === 'active';
  
  return (
    <Pressable onPress={onPress} className="items-center">
      <View 
        className={`w-14 h-14 rounded-full justify-center items-center mb-2 ${
          isActive ? 'bg-[#2D8B57]' : isPrimary ? 'bg-secondary' : 'bg-[#F0F0F0]'
        }`}
      >
        <Ionicons name={icon} size={22} color={isPrimary || isActive ? '#fff' : '#1A1A2E'} />
      </View>
      <Text 
        className={`text-[13px] font-medium ${
          isActive ? 'text-[#2D8B57] font-semibold' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface FeatureTagProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

function FeatureTag({ icon, label }: FeatureTagProps) {
  return (
    <View className="flex-row items-center bg-white px-4 py-2.5 rounded-full border border-border">
      <Ionicons name={icon} size={16} color="#6B7280" style={{ marginRight: 8 }} />
      <Text className="text-sm text-text">{label}</Text>
    </View>
  );
}

export default function ParkDetailScreen() {
  const { id: slugOrId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [park, setPark] = useState<Park | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // The park ID is derived from the fetched park
  const parkId = park?.id || null;
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [modalDismissing, setModalDismissing] = useState(false);
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

  // Drag-to-dismiss for check-in modal
  const modalTranslateY = useRef(new Animated.Value(0)).current;
  const DISMISS_THRESHOLD = 120;
  const windowHeight = Dimensions.get('window').height;

  const modalPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          modalTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD) {
          Animated.timing(modalTranslateY, {
            toValue: windowHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setModalDismissing(true);
            requestAnimationFrame(() => {
              setCheckInModalVisible(false);
            });
          });
        } else {
          Animated.spring(modalTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (!checkInModalVisible) {
      setModalDismissing(false);
      modalTranslateY.setValue(0);
    }
  }, [checkInModalVisible, modalTranslateY]);

  // Re-fetch play dates when returning to this screen (e.g. after creating one)
  const isFirstMount = useRef(true);
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
      setDebugInfo('URL parameter "id" is empty or undefined');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchPark() {
      const parsed = parseSlugOrId(slugOrId);
      
      // Build debug info
      const debugLines: string[] = [
        `URL param: "${slugOrId}"`,
        `Parsed type: ${parsed.type}`,
      ];
      
      if (parsed.type === 'uuid') {
        debugLines.push(`UUID: ${parsed.id}`);
      } else if (parsed.type === 'slug') {
        debugLines.push(`Short ID: ${parsed.shortId}`);
      }
      
      // Console log for dev tools debugging
      console.log('[ParkDetail] Fetching park:', { slugOrId, parsed });
      
      try {
        let data: Park | null = null;
        
        if (parsed.type === 'uuid') {
          debugLines.push('Query: getParkById()');
          console.log('[ParkDetail] Querying by UUID:', parsed.id);
          data = await getParkById(parsed.id);
        } else if (parsed.type === 'slug') {
          debugLines.push('Query: getParkByShortId()');
          console.log('[ParkDetail] Querying by short ID:', parsed.shortId);
          data = await getParkByShortId(parsed.shortId);
        } else {
          debugLines.push('Invalid URL format - could not extract UUID or short ID');
          console.warn('[ParkDetail] Invalid URL format:', slugOrId);
        }
        
        if (isMounted) {
          if (data) {
            debugLines.push(`Found park: ${data.name} (${data.id})`);
            console.log('[ParkDetail] Found park:', { name: data.name, id: data.id });
            setPark(data);
            setDebugInfo(null); // Clear debug on success
          } else {
            debugLines.push('No park found with this ID');
            console.warn('[ParkDetail] No park found for:', { slugOrId, parsed });
            setError('Park not found');
            setDebugInfo(debugLines.join('\n'));
          }
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          const code = (err as { code?: string })?.code;
          const details = (err as { details?: string })?.details;
          const hint = (err as { hint?: string })?.hint;
          
          debugLines.push(`Error: ${message}`);
          if (code) debugLines.push(`Error code: ${code}`);
          if (details) debugLines.push(`Details: ${details}`);
          if (hint) debugLines.push(`Hint: ${hint}`);
          
          console.error('[ParkDetail] Error fetching park:', { 
            slugOrId, 
            parsed, 
            error: err,
            message,
            code,
            details,
            hint
          });
          
          setError('Failed to load park details');
          setDebugInfo(debugLines.join('\n'));
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
      console.log('Open directions:', url);
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
      prev.includes(dogId)
        ? prev.filter((id) => id !== dogId)
        : [...prev, dogId]
    );
  }, []);

  // Get unique dogs from all check-ins
  const checkedInDogs = React.useMemo(() => {
    const dogs: Dog[] = [];
    const seenIds = new Set<string>();
    
    activeCheckIns.forEach((checkIn) => {
      checkIn.dogs?.forEach((dog) => {
        if (!seenIds.has(dog.id)) {
          seenIds.add(dog.id);
          dogs.push(dog);
        }
      });
    });
    
    return dogs.slice(0, 6);
  }, [activeCheckIns]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (error || !park) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <View className="items-center max-w-md">
          <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={32} color="#EF4444" />
          </View>
          <Text className="text-lg font-semibold text-text text-center mb-2">
            {error ?? 'Park not found'}
          </Text>
          <Text className="text-sm text-text-secondary text-center mb-6">
            We couldn't load this park. It may have been removed or the link may be incorrect.
          </Text>
          
          {/* Debug Info - shown in development */}
          {debugInfo && (
            <View className="bg-gray-100 rounded-lg p-4 w-full mb-6">
              <Text className="text-xs font-mono text-gray-600 mb-2">Debug Info:</Text>
              <Text className="text-xs font-mono text-gray-800">{debugInfo}</Text>
            </View>
          )}
          
          <Pressable
            onPress={handleBack}
            className="bg-secondary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Build features list based on park data
  const features: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [];
  if (park.has_water) features.push({ icon: 'water', label: 'Water Fountain' });
  if (park.is_fenced) features.push({ icon: 'shield-checkmark', label: 'Fenced Area' });
  if (park.has_shade) features.push({ icon: 'leaf', label: 'Shaded Areas' });
  if (park.amenities?.includes('Benches')) features.push({ icon: 'cube', label: 'Benches' });
  if (park.amenities?.includes('Waste Stations')) features.push({ icon: 'trash', label: 'Waste Stations' });
  if (features.length === 0) {
    features.push(
      { icon: 'water', label: 'Water Fountain' },
      { icon: 'cube', label: 'Benches' },
      { icon: 'shield-checkmark', label: 'Fenced Area' },
      { icon: 'trash', label: 'Waste Stations' }
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header Image */}
      <View className="relative">
        <Image
          source={{
            uri:
              park.image_url ||
              'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&h=400&fit=crop',
          }}
          className="w-full h-[280px]"
          resizeMode="cover"
        />
        {/* Back Button */}
        <Pressable
          onPress={handleBack}
          className="absolute left-4 w-10 h-10 rounded-full bg-white/90 justify-center items-center shadow-sm"
          style={{ top: insets.top + 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Park Info */}
        <View className="items-center px-8 pt-5 pb-6">
          <Text className="text-2xl font-bold text-text text-center">{park.name}</Text>
          <Text className="text-[15px] text-text-secondary mt-1.5">
            {park.address || 'San Francisco, CA'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-center gap-8 mb-8">
          <ActionButton
            icon="navigate-outline"
            label="Directions"
            onPress={handleDirections}
          />
          <ActionButton
            icon="calendar-outline"
            label="Schedule"
            onPress={handleSchedule}
          />
          <Pressable onPress={handleOpenCheckIn} disabled={checkInLoading} className="items-center">
            <View 
              className={`w-14 h-14 rounded-full justify-center items-center mb-2 ${
                userCheckIn ? 'bg-[#2D8B57]' : 'bg-secondary'
              }`}
            >
              {checkInLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name={userCheckIn ? 'checkmark' : 'location'}
                  size={22}
                  color="#fff"
                />
              )}
            </View>
            <Text 
              className={`text-[13px] font-medium ${
                userCheckIn ? 'text-[#2D8B57] font-semibold' : 'text-text-secondary'
              }`}
            >
              {userCheckIn ? 'Checked In' : 'Check-in'}
            </Text>
          </Pressable>
        </View>

        {/* Pups at the Park Now */}
        <View className="mb-7 px-5">
          <Text className="text-lg font-bold text-text mb-4">Pups at the Park Now</Text>
          {checkedInDogs.length > 0 ? (
            <View className="flex-row gap-4">
              {checkedInDogs.map((dog) => (
                <DogAvatar
                  key={dog.id}
                  dog={dog}
                  onPress={() => router.push(`/dogs/${dog.id}`)}
                />
              ))}
            </View>
          ) : (
            <Text className="text-sm text-text-secondary">No pups here right now</Text>
          )}
        </View>

        {/* Upcoming Play Dates */}
        <View className="mb-7 px-5">
          <Text className="text-lg font-bold text-text mb-4">Upcoming Play Dates</Text>
          {playdatesLoading ? (
            <ActivityIndicator size="small" color="#4A90D9" />
          ) : playdates.length > 0 ? (
            playdates.map((playdate) => (
              <PlaydateCard
                key={playdate.id}
                playdate={playdate}
                onPress={() => router.push(`/playdates/${playdate.id}`)}
              />
            ))
          ) : (
            <Text className="text-sm text-text-secondary">No upcoming play dates</Text>
          )}
          <Pressable
            onPress={handleSchedule}
            className="flex-row items-center justify-center bg-secondary py-3.5 rounded-xl mt-4"
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text className="text-white text-[15px] font-semibold ml-2">Schedule a Play Date</Text>
          </Pressable>
        </View>

        {/* Park Features */}
        <View className="mb-7 px-5">
          <Text className="text-lg font-bold text-text mb-4">Park Features</Text>
          <View className="flex-row flex-wrap gap-3">
            {features.map((feature, index) => (
              <FeatureTag key={index} icon={feature.icon} label={feature.label} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Check-in Button */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-background px-5 pt-2"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Pressable 
          onPress={handleOpenCheckIn}
          className={`py-4 rounded-xl items-center ${
            userCheckIn ? 'bg-error' : 'bg-[#2D8B57]'
          }`}
        >
          <Text className="text-white text-base font-semibold">
            {userCheckIn ? 'Check-out' : 'Check-in'}
          </Text>
        </Pressable>
      </View>

      {/* Check-in Modal - slide animation; when dismissing via swipe, sheet stays off-screen to avoid snap-back */}
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
        onShow={() => modalTranslateY.setValue(0)}
      >
        <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
          {modalDismissing ? (
            <View
              style={{ transform: [{ translateY: windowHeight }] }}
              pointerEvents="none"
            >
              <View className="bg-white rounded-t-[20px] px-5 pt-3" style={{ paddingBottom: insets.bottom + 20 }} />
            </View>
          ) : (
          <Animated.View
            style={{ transform: [{ translateY: modalTranslateY }] }}
            {...modalPanResponder.panHandlers}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[20px] px-5 pt-3"
              style={{ paddingBottom: insets.bottom + 20 }}
            >
              {/* Handle bar + Close button */}
              <View style={styles.modalHeader}>
                <View className="w-10 h-1 bg-border rounded-full" />
                <Pressable
                  onPress={() => setCheckInModalVisible(false)}
                  style={styles.modalCloseButton}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Title */}
              <Text className="text-[22px] font-bold text-text mb-6">
                Check-in at {park.name}
              </Text>

            {/* Dogs Section */}
            <Text className="text-base font-semibold text-text mb-3">Which dogs are with you?</Text>
            
            {dogs.length === 0 ? (
              <Text className="text-[15px] text-text-secondary text-center py-8">
                You have not added any dogs yet. Add a dog from your profile first.
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
                            ? 'border-[#2D8B57] bg-[#F0FDF4]' 
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
                        <Text className="flex-1 text-base font-medium text-text">{dog.name}</Text>
                        <View
                          className={`w-6 h-6 rounded-md justify-center items-center border-2 ${
                            isSelected 
                              ? 'bg-[#2D8B57] border-[#2D8B57]' 
                              : 'bg-white border-border'
                          }`}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Duration Section */}
                <Text className="text-base font-semibold text-text mb-3">How long are you staying?</Text>
                
                <View className="flex-row flex-wrap gap-3 mb-6">
                  {DURATIONS.map((duration) => (
                    <Pressable
                      key={duration.value}
                      onPress={() => setSelectedDuration(duration.value)}
                      className={`flex-1 min-w-[45%] py-3.5 px-4 rounded-xl items-center border-2 ${
                        selectedDuration === duration.value
                          ? 'bg-[#2D8B57] border-[#2D8B57]'
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
                  <Text className="text-white text-base font-semibold">Confirm Check-in</Text>
                </Pressable>
              </>
            )}
            </Pressable>
          </Animated.View>
          )}
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
    position: 'relative',
    minHeight: 32,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 4,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useCallback, useState, useMemo } from 'react';
import { SEOHead } from '@/src/components/seo';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DesktopSidebar from '@/src/components/ui/DesktopSidebar';
import ParkMap from '@/src/components/parks/ParkMap.web';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotificationsData } from '@/src/hooks/useNotificationsData';
import { useLocation } from '@/src/hooks/useLocation';
import { useParks } from '@/src/hooks/useParks';
import { usePlaydates } from '@/src/hooks/usePlaydates';
import { useNearbyPups } from '@/src/hooks/useNearbyPups';
import { generateParkSlug } from '@/src/utils/slug';
import { getParkStateSlug } from '@/src/services/parks';
import { format } from 'date-fns';
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
      {/* Accent Bar */}
      <View style={{ width: 4, backgroundColor: accentColor }} />

      {/* Content */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14 }}>
        {/* Time Column */}
        <View style={{ width: 48, gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1918' }}>
            {timeValue}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '500', color: '#878685' }}>
            {timePeriod}
          </Text>
        </View>

        {/* Divider */}
        <View style={{ width: 1, height: 36, backgroundColor: '#E5E4E1' }} />

        {/* Info Column */}
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
  compact?: boolean;
}

interface NearbyPupsSectionProps {
  onPupPress: (dogId: string) => void;
}

function NearbyPupsSection({ onPupPress }: NearbyPupsSectionProps) {
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
              justifyContent: 'center' 
            }}
          >
            <ActivityIndicator size="small" color="#878685" />
          </View>
        ))}
      </View>
    );
  }

  // Deduplicate pups by dog ID
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

  // Show up to 6 unique pups
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

function ParkCard({ park, pupCount, distanceKm, onPress, compact }: ParkCardProps) {
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
      <Image
        source={{
          uri: park.image_url || '/images/dog-park-placeholder.png',
        }}
        style={{ width: '100%', height: compact ? 100 : 128 }}
        resizeMode="cover"
      />
      <View style={{ padding: compact ? 12 : 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <Text style={{ fontSize: compact ? 15 : 16, fontWeight: '700', color: '#1A1918', flex: 1, marginRight: 8 }} numberOfLines={1}>
            {park.name.replace(/^[\s\u200d]+/, '')}
          </Text>
          {distanceKm !== undefined && (
            <Text style={{ fontSize: compact ? 12 : 14, color: '#6D6C6A' }}>
              {formatDistance(distanceKm)}
            </Text>
          )}
        </View>
        {park.address && (
          <Text style={{ fontSize: compact ? 12 : 13, color: '#6D6C6A', marginBottom: 4 }} numberOfLines={1}>
            {park.address}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="paw" size={14} color="#3D8A5A" />
          <Text style={{ fontSize: compact ? 13 : 14, color: '#3D8A5A', fontWeight: '600', marginLeft: 6 }}>
            {pupCount} {pupCount === 1 ? 'pup' : 'pups'} here now
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function DesktopHomeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isLargeDesktop = width >= 1440;
  const isXLDesktop = width >= 1920;
  const showSidebar = width >= 768;
  const showRightPanel = width >= 1024;
  
  // Right panel width: 384px on smaller desktops, 440px on large, 600px on XL
  const rightPanelWidth = isXLDesktop ? 600 : isLargeDesktop ? 440 : 384;

  const router = useRouter();
  const { session } = useAuth();
  const { unreadCount } = useNotificationsData({ limit: 1 });
  const { location } = useLocation();
  const { parks, checkInCounts, loading: parksLoading } = useParks();
  const { myPlaydates, loading: playdatesLoading } = usePlaydates();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  // Search results - searches ALL parks, limited to 5 results
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

  // All parks within 10 miles (~16.09 km), sorted by distance
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

  // Nearby parks - shows top 2 closest parks (not affected by search)
  const nearbyParks = parksWithinRadius.slice(0, 2);

  const showSearchResults = isSearchFocused && searchQuery.trim().length > 0;

  const isLoading = parksLoading || playdatesLoading;

  return (
    <>
    <SEOHead title="Home" description="Your k9d8 dashboard. See nearby parks, upcoming playdates, and active dogs in your area." url="/" />
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F4F1' }}>
      {/* Left Sidebar - Hidden on mobile */}
      {showSidebar && <DesktopSidebar />}

      {/* Main Content */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Header */}
        <View 
          style={{ 
            backgroundColor: '#fff', 
            borderBottomWidth: 1, 
            borderBottomColor: '#E5E4E1',
            paddingHorizontal: isMobile ? 20 : 40,
            paddingVertical: isMobile ? 16 : 22,
            zIndex: 100,
          }}
        >
          <View 
            style={{ 
              flexDirection: isMobile ? 'column' : 'row', 
              alignItems: isMobile ? 'stretch' : 'center', 
              justifyContent: 'space-between',
              gap: isMobile ? 16 : 0,
            }}
          >
            {/* Left: Greeting */}
            <View>
              <Text style={{ fontSize: isMobile ? 24 : 28, fontWeight: '700', color: '#1A1918' }}>
                Hi, {userName}
              </Text>
            </View>

            {/* Right: Search and Notification */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Search Container with Dropdown */}
              <View style={{ position: 'relative', flex: isMobile ? 1 : undefined, width: isMobile ? undefined : isTablet ? 240 : 320 }}>
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
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => {
                      // Delay to allow click on results
                      setTimeout(() => setIsSearchFocused(false), 200);
                    }}
                    placeholder="Search dog parks..."
                    placeholderTextColor="#878685"
                    style={{ flex: 1, marginLeft: 8, fontSize: 15, color: '#1A1918', outlineWidth: 0 } as any}
                  />
                  <View style={{ width: 18, marginLeft: 4, alignItems: 'center', justifyContent: 'center' }}>
                    {searchQuery.length > 0 && (
                      <Pressable onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#878685" />
                      </Pressable>
                    )}
                  </View>
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
                            setIsSearchFocused(false);
                          }}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 12,
                            backgroundColor: pressed ? '#F5F4F1' : '#fff',
                            borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
                            borderBottomColor: '#EDECEA',
                          })}
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
                              {park.name.replace(/^[\s\u200d]+/, '')}
                            </Text>
                            {park.address && (
                              <Text style={{ fontSize: 12, color: '#6D6C6A' }} numberOfLines={1}>
                                {park.address}
                              </Text>
                            )}
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
          </View>
        </View>

        {/* Scrollable Content */}
        <View style={{ flex: 1, flexDirection: 'row', overflow: 'hidden', zIndex: 1 }}>
          {/* Left Column - Main Content */}
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ 
              padding: isMobile ? 20 : 40,
              paddingBottom: isMobile ? 100 : 40,
            }}
          >
            {isLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
                <ActivityIndicator size="large" color="#3D8A5A" />
              </View>
            ) : (
              <View style={{ maxWidth: 800 }}>
                {/* Upcoming Play Dates */}
                <View style={{ marginBottom: isMobile ? 24 : 32 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', letterSpacing: -0.2 }}>
                      Upcoming Play Dates
                    </Text>
                    <Pressable onPress={() => router.push('/explore')}>
                      <Text style={{ fontSize: 13, color: '#3D8A5A', fontWeight: '500' }}>See all</Text>
                    </Pressable>
                  </View>
                  
                  <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
                    {upcomingPlaydates.map((playdate, index) => (
                      <View key={playdate.id} style={{ flex: isMobile ? undefined : 1 }}>
                        <PlaydateCard
                          playdate={playdate}
                          onPress={() => handlePlaydatePress(playdate.id)}
                          accentColor={index % 2 === 0 ? '#3D8A5A' : '#D89575'}
                        />
                      </View>
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
                    <Text style={{ fontSize: isMobile ? 18 : 20, fontWeight: '700', color: '#1A1918' }}>
                      Nearby Parks
                    </Text>
                    <Pressable onPress={() => router.push('/explore')}>
                      <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '600' }}>View map</Text>
                    </Pressable>
                  </View>
                  
                  <View 
                    style={{ 
                      flexDirection: isMobile ? 'column' : 'row', 
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    {nearbyParks.map(({ park, distanceKm }) => (
                      <View 
                        key={park.id} 
                        style={{
                          width: isMobile ? '100%' : undefined,
                          flex: isMobile ? undefined : 1,
                          maxWidth: isMobile ? undefined : '48%',
                        }}
                      >
                        <ParkCard
                          park={park}
                          pupCount={checkInCounts[park.id] || 0}
                          distanceKm={distanceKm}
                          onPress={() => handleParkPress(park)}
                          compact={isMobile}
                        />
                      </View>
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

                {/* Map & Pups — inline on mobile/tablet */}
                {!showRightPanel && (
                  <View style={{ gap: 16, marginTop: isMobile ? 24 : 32 }}>
                    {/* Map Preview */}
                    <View
                      style={{
                        height: 240,
                        borderRadius: 16,
                        overflow: 'hidden',
                        backgroundColor: '#EDECEA',
                        shadowColor: '#1A1918',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.03,
                        shadowRadius: 12,
                      }}
                    >
                      <ParkMap
                        parks={parks}
                        checkInCounts={checkInCounts}
                        userLocation={location}
                        onParkSelect={handleParkPress}
                      />
                    </View>

                    {/* Map Label Bar */}
                    <Pressable
                      onPress={() => router.push('/explore')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        padding: 14,
                        paddingHorizontal: 16,
                        borderRadius: 12,
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

                    {/* Pups Nearby Card */}
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
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Right Sidebar - Map & Pups Nearby (desktop only) */}
          {showRightPanel && (
            <View style={{ width: rightPanelWidth, padding: 24, gap: 16 }}>
              {/* Map Preview */}
              <View
                style={{
                  height: 320,
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: '#EDECEA',
                  shadowColor: '#1A1918',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 12,
                }}
              >
                <ParkMap
                  parks={parks}
                  checkInCounts={checkInCounts}
                  userLocation={location}
                  onParkSelect={handleParkPress}
                />
              </View>

              {/* Map Label Bar */}
              <Pressable
                onPress={() => router.push('/explore')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  padding: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
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

              {/* Pups Nearby Card */}
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
            </View>
          )}
        </View>
      </View>
    </View>
    </>
  );
}

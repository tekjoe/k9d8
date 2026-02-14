import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import DesktopSidebar from '@/src/components/ui/DesktopSidebar';
import { useAuth } from '@/src/hooks/useAuth';
import { signOut } from '@/src/services/auth';
import { useDogs } from '@/src/hooks/useDogs';
import { useFriends } from '@/src/hooks/useFriends';
import { useRecentActivity } from '@/src/hooks/useRecentActivity';
import type { Dog } from '@/src/types/database';

// Dog List Row Component
interface DogListRowProps {
  dog: Dog;
  onPress: () => void;
  showDivider?: boolean;
}

function DogListRow({ dog, onPress, showDivider = true }: DogListRowProps) {
  const ageText = dog.age_years ? `${dog.age_years} ${dog.age_years === 1 ? 'yr' : 'yrs'}` : '';
  const subtitle = [dog.breed, ageText].filter(Boolean).join(', ');

  return (
    <>
      <Pressable 
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <Image
          source={{
            uri:
              dog.photo_url ||
              'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
          }}
          style={{ width: 48, height: 48, borderRadius: 24, marginRight: 16 }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginBottom: 2 }}>
            {dog.name}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>
            {subtitle || 'Mixed breed'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      </Pressable>
      {showDivider && (
        <View style={{ height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 }} />
      )}
    </>
  );
}

// Activity Item Component
interface ActivityItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
  title: string;
  subtitle: string;
  showDivider?: boolean;
}

function ActivityItem({ icon, iconColor, iconBgColor, title, subtitle, showDivider = true }: ActivityItemProps) {
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <View 
          style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 20, 
            backgroundColor: iconBgColor,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
          }}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#1A1A2E', marginBottom: 2 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 13, color: '#6B7280' }}>{subtitle}</Text>
        </View>
      </View>
      {showDivider && (
        <View style={{ height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 }} />
      )}
    </>
  );
}

// Stat Component
interface StatProps {
  value: number;
  label: string;
  compact?: boolean;
}

function Stat({ value, label, compact }: StatProps) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: compact ? 20 : 24, fontWeight: '700', color: '#1A1A2E' }}>{value}</Text>
      <Text style={{ fontSize: compact ? 11 : 13, color: '#6B7280', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// Profile Card Component
interface ProfileCardProps {
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string | undefined;
  parksVisited: number;
  playdatesCount: number;
  friendsCount: number;
  isMobile: boolean;
  isTablet: boolean;
}

function ProfileCard({ 
  displayName, 
  handle, 
  bio, 
  avatarUrl, 
  parksVisited, 
  playdatesCount, 
  friendsCount,
  isMobile,
  isTablet,
}: ProfileCardProps) {
  const avatarSize = isMobile ? 100 : 120;
  const compact = isMobile || isTablet;

  return (
    <View 
      style={{ 
        width: isMobile ? '100%' : isTablet ? 280 : 320,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: isMobile ? 24 : 32,
        alignItems: 'center',
        shadowColor: '#1A1918',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Avatar */}
      <View 
        style={{ 
          width: avatarSize, 
          height: avatarSize, 
          borderRadius: avatarSize / 2, 
          borderWidth: 3, 
          borderColor: '#6FCF97',
          padding: 3,
          marginBottom: isMobile ? 16 : 24,
        }}
      >
        <Image
          source={{
            uri:
              avatarUrl ||
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
          }}
          style={{ width: '100%', height: '100%', borderRadius: avatarSize / 2 }}
          resizeMode="cover"
        />
      </View>

      {/* Name & Handle */}
      <Text style={{ fontSize: isMobile ? 20 : 24, fontWeight: '600', color: '#1A1A2E', marginBottom: 4 }}>
        {displayName}
      </Text>
      <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 12 }}>
        @{handle}
      </Text>

      {/* Bio */}
      <Text 
        style={{ 
          fontSize: 14, 
          color: '#6B7280', 
          textAlign: 'center', 
          lineHeight: 21,
          marginBottom: isMobile ? 16 : 24,
          maxWidth: 280,
        }}
      >
        {bio}
      </Text>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: isMobile ? 16 : 24, width: '100%', justifyContent: 'center' }}>
        <Stat value={parksVisited} label="Parks Visited" compact={compact} />
        <Stat value={playdatesCount} label="Play Dates" compact={compact} />
        <Stat value={friendsCount} label="Friends" compact={compact} />
      </View>
    </View>
  );
}

export default function DesktopProfilePage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const showSidebar = width >= 768;

  const { session } = useAuth();
  const userId = session?.user?.id;
  const { dogs, loading } = useDogs(userId);
  const { friends } = useFriends();
  const { activities, loading: activitiesLoading } = useRecentActivity(userId);

  const displayName = session?.user?.user_metadata?.display_name || 'Alex Johnson';
  const handle = session?.user?.email?.split('@')[0] || 'alexjohnson';
  const bio = session?.user?.user_metadata?.bio || 
    'Lover of all things canine. You can find me and my pack at Central Park on weekends!';
  const avatarUrl = session?.user?.user_metadata?.avatar_url;

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      Alert.alert('Error', message);
    }
  }

  function handleAddDog() {
    router.push('/(tabs)/profile/dogs/create');
  }

  function handleDogPress(dog: Dog) {
    router.push(`/(tabs)/profile/dogs/${dog.id}`);
  }

  function handleEditProfile() {
    router.push('/(tabs)/profile/edit');
  }

  // Stats - use real data where available
  const parksVisited = 12; // TODO: Track unique parks visited
  const playdatesCount = 8; // TODO: Track total playdates attended
  const friendsCount = friends.length;

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F7F8FA' }}>
      {/* Left Sidebar - Hidden on mobile */}
      {showSidebar && <DesktopSidebar />}

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            backgroundColor: '#fff',
            paddingHorizontal: isMobile ? 20 : 40,
            paddingVertical: isMobile ? 16 : 24,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}
        >
          <Text style={{ fontSize: isMobile ? 20 : 24, fontWeight: '600', color: '#1A1A2E' }}>
            Profile
          </Text>
          <Pressable 
            onPress={handleEditProfile}
            style={{ 
              borderWidth: 1, 
              borderColor: '#E5E7EB', 
              paddingHorizontal: isMobile ? 16 : 20, 
              paddingVertical: isMobile ? 8 : 10, 
              borderRadius: 9999,
            }}
          >
            <Text style={{ fontSize: isMobile ? 14 : 15, fontWeight: '500', color: '#1A1A2E' }}>
              Edit Profile
            </Text>
          </Pressable>
        </View>

        {/* Content Area */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            padding: isMobile ? 20 : isTablet ? 24 : 40,
          }}
        >
          <View 
            style={{ 
              flexDirection: isMobile ? 'column' : 'row', 
              gap: isMobile ? 24 : isTablet ? 24 : 40,
              maxWidth: 1200,
            }}
          >
            {/* Left Column - Profile Card */}
            <ProfileCard
              displayName={displayName}
              handle={handle}
              bio={bio}
              avatarUrl={avatarUrl}
              parksVisited={parksVisited}
              playdatesCount={playdatesCount}
              friendsCount={friendsCount}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            {/* Right Column */}
            <View style={{ flex: 1, gap: 24 }}>
              {/* My Dogs Section */}
              <View>
                <View 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: isMobile ? 18 : 20, fontWeight: '600', color: '#1A1A2E' }}>
                    My Dogs
                  </Text>
                  <Pressable 
                    onPress={handleAddDog}
                    style={{ 
                      backgroundColor: '#6FCF97', 
                      paddingHorizontal: isMobile ? 16 : 20, 
                      paddingVertical: isMobile ? 8 : 10, 
                      borderRadius: 9999,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Add Dog</Text>
                  </Pressable>
                </View>

                <View 
                  style={{ 
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    overflow: 'hidden',
                    shadowColor: '#1A1918',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 12,
                    elevation: 2,
                  }}
                >
                  {loading ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#6FCF97" />
                    </View>
                  ) : dogs.length > 0 ? (
                    dogs.map((dog, index) => (
                      <DogListRow 
                        key={dog.id} 
                        dog={dog} 
                        onPress={() => handleDogPress(dog)}
                        showDivider={index < dogs.length - 1}
                      />
                    ))
                  ) : (
                    <View style={{ padding: isMobile ? 32 : 40, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
                        No dogs added yet
                      </Text>
                      <Pressable 
                        onPress={handleAddDog}
                        style={{ 
                          backgroundColor: '#6FCF97', 
                          paddingHorizontal: 20, 
                          paddingVertical: 10, 
                          borderRadius: 9999,
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                          Add your first dog
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>

              {/* Recent Activity Section */}
              <View>
                <Text style={{ fontSize: isMobile ? 18 : 20, fontWeight: '600', color: '#1A1A2E', marginBottom: 16 }}>
                  Recent Activity
                </Text>

                <View 
                  style={{ 
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    overflow: 'hidden',
                    shadowColor: '#1A1918',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 12,
                    elevation: 2,
                  }}
                >
                  {activitiesLoading ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#6FCF97" />
                    </View>
                  ) : activities.length > 0 ? (
                    activities.map((activity, index) => (
                      <ActivityItem 
                        key={activity.id}
                        icon={activity.icon}
                        iconColor={activity.iconColor}
                        iconBgColor={activity.iconBgColor}
                        title={activity.title}
                        subtitle={activity.subtitle}
                        showDivider={index < activities.length - 1}
                      />
                    ))
                  ) : (
                    <View style={{ padding: isMobile ? 32 : 40, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>
                        No recent activity
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Sign Out Button */}
              <Pressable 
                onPress={handleSignOut}
                style={{ 
                  paddingVertical: 14, 
                  borderRadius: 12, 
                  borderWidth: 1, 
                  borderColor: '#EF4444',
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/src/hooks/useAuth';
import { signOut } from '@/src/services/auth';
import { useDogs } from '@/src/hooks/useDogs';
import { useFriends } from '@/src/hooks/useFriends';
import type { Dog } from '@/src/types/database';

interface DogListItemProps {
  dog: Dog;
  onPress: () => void;
}

function DogListItem({ dog, onPress }: DogListItemProps) {
  const ageText = dog.age_years ? `${dog.age_years} ${dog.age_years === 1 ? 'yr' : 'yrs'}` : '';
  const subtitle = [dog.breed, ageText].filter(Boolean).join(', ');

  return (
    <Pressable 
      onPress={onPress}
      className="flex-row items-center bg-white p-3 rounded-xl mb-px"
    >
      <Image
        source={{
          uri:
            dog.photo_url ||
            'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
        }}
        className="w-12 h-12 rounded-full mr-3"
        resizeMode="cover"
      />
      <View className="flex-1">
        <Text className="text-base font-semibold text-text">{dog.name}</Text>
        <Text className="text-sm text-text-secondary">{subtitle || 'Mixed breed'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </Pressable>
  );
}

export default function ProfileTab() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { dogs, loading, error, loadDogs } = useDogs(userId);
  const { friends, pendingCount } = useFriends();
  const insets = useSafeAreaInsets();

  const displayName = session?.user?.user_metadata?.display_name || 'Alex Johnson';
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

  function handleBack() {
    router.back();
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3">
        <Pressable onPress={handleBack} className="w-10 h-10 justify-center items-center">
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text className="text-lg font-semibold text-text">Profile</Text>
        <Pressable onPress={handleEditProfile} className="w-10 h-10 justify-center items-center">
          <Ionicons name="create-outline" size={24} color="#1A1A2E" />
        </Pressable>
      </View>

      <FlatList
        data={dogs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* Profile Info */}
            <View className="items-center px-8 pt-2 pb-6">
              <View className="w-24 h-24 rounded-full border-[3px] border-secondary p-[3px] mb-4">
                <Image
                  source={{
                    uri:
                      avatarUrl ||
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
                  }}
                  className="w-full h-full rounded-full"
                  resizeMode="cover"
                />
              </View>
              <Text className="text-2xl font-bold text-text mb-2">{displayName}</Text>
              <Text className="text-sm text-text-secondary text-center leading-5">{bio}</Text>
            </View>

            {/* Friends Section */}
            <View className="flex-row justify-between items-center mb-4 mt-2">
              <Text className="text-xl font-bold text-text">
                Friends{friends.length > 0 ? ` (${friends.length})` : ''}
              </Text>
              <View className="flex-row items-center gap-3">
                {pendingCount > 0 && (
                  <Pressable
                    onPress={() => router.push('/(tabs)/profile/friends/requests')}
                    className="flex-row items-center"
                  >
                    <View className="bg-error w-5 h-5 rounded-full justify-center items-center mr-1">
                      <Text className="text-white text-xs font-bold">{pendingCount}</Text>
                    </View>
                    <Text className="text-sm text-secondary font-medium">Requests</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => router.push('/(tabs)/profile/friends')}
                  className="w-10 h-10 rounded-full bg-secondary justify-center items-center"
                >
                  <Ionicons name="people" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>

            {friends.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-6"
              >
                <View className="flex-row gap-4">
                  {friends.slice(0, 10).map((friend) => (
                    <Pressable
                      key={friend.id}
                      onPress={() => router.push(`/users/${friend.id}`)}
                      className="items-center"
                    >
                      <Image
                        source={{
                          uri:
                            friend.avatar_url ||
                            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
                        }}
                        className="w-14 h-14 rounded-full mb-1"
                        resizeMode="cover"
                      />
                      <Text
                        className="text-xs text-text-secondary max-w-[56px]"
                        numberOfLines={1}
                      >
                        {friend.display_name || 'User'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View className="items-center py-4 bg-white rounded-2xl mb-6">
                <Text className="text-sm text-text-secondary mb-2">No friends yet</Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/profile/friends')}
                  className="bg-secondary px-5 py-2 rounded-full"
                >
                  <Text className="text-white text-sm font-semibold">Find Friends</Text>
                </Pressable>
              </View>
            )}

            {/* My Dogs Section Header */}
            <View className="flex-row justify-between items-center mb-4 mt-2">
              <Text className="text-xl font-bold text-text">My Dogs</Text>
              <Pressable 
                onPress={handleAddDog}
                className="w-10 h-10 rounded-full bg-secondary justify-center items-center"
              >
                <Ionicons name="add" size={24} color="#fff" />
              </Pressable>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <DogListItem dog={item} onPress={() => handleDogPress(item)} />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="small" color="#6FCF97" style={{ paddingVertical: 24 }} />
          ) : error ? (
            <View className="items-center py-8 bg-white rounded-2xl">
              <Text className="text-sm text-error text-center">{error}</Text>
              <Pressable onPress={loadDogs}>
                <Text className="text-sm text-secondary mt-2 font-medium">Tap to retry</Text>
              </Pressable>
            </View>
          ) : (
            <View className="items-center py-8 bg-white rounded-2xl">
              <Text className="text-sm text-text-secondary mb-3">No dogs added yet</Text>
              <Pressable 
                onPress={handleAddDog}
                className="bg-secondary px-5 py-2.5 rounded-full"
              >
                <Text className="text-white text-sm font-semibold">Add your first dog</Text>
              </Pressable>
            </View>
          )
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Sign Out Button */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-background px-5 pt-2"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Pressable 
          onPress={handleSignOut}
          className="py-3.5 rounded-xl border border-error items-center bg-white"
        >
          <Text className="text-error text-base font-semibold">Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

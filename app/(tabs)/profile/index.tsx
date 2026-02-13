import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/src/hooks/useAuth';
import { signOut } from '@/src/services/auth';
import { useDogs } from '@/src/hooks/useDogs';
import { DogCard } from '@/src/components/dogs/DogCard';
import type { Dog } from '@/src/types/database';

export default function ProfileTab() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { dogs, loading, error, loadDogs } = useDogs(userId);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.email}>{session?.user?.email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Dogs</Text>
          <Pressable style={styles.addButton} onPress={handleAddDog}>
            <Text style={styles.addButtonText}>+ Add Dog</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator
            size="small"
            color="#4A90D9"
            style={styles.loader}
          />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={loadDogs}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          </View>
        ) : dogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No dogs added yet</Text>
            <Pressable style={styles.emptyButton} onPress={handleAddDog}>
              <Text style={styles.emptyButtonText}>Add your first dog</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={dogs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DogCard dog={item} onPress={() => handleDogPress(item)} />
            )}
            scrollEnabled={false}
          />
        )}
      </View>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  addButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    paddingVertical: 24,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#4A90D9',
    marginTop: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#4A90D9',
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    marginHorizontal: 24,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

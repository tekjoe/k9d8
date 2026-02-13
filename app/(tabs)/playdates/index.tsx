import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaydates } from '@/src/hooks/usePlaydates';
import { PlaydateCard } from '@/src/components/playdates/PlaydateCard';
import type { PlayDate } from '@/src/types/database';

export default function PlaydatesTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { playdates, myPlaydates, loading, error, refresh } = usePlaydates();

  const handleCardPress = useCallback(
    (id: string) => {
      router.push(`/playdates/${id}`);
    },
    [router],
  );

  const renderPlaydateCard = useCallback(
    ({ item }: { item: PlayDate }) => (
      <PlaydateCard
        playdate={item}
        onPress={() => handleCardPress(item.id)}
      />
    ),
    [handleCardPress],
  );

  const keyExtractor = useCallback((item: PlayDate) => item.id, []);

  if (loading && playdates.length === 0 && myPlaydates.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Play Dates</Text>
        <Pressable
          style={styles.createButton}
          onPress={() => router.push('/playdates/create')}
        >
          <Text style={styles.createButtonText}>+ New</Text>
        </Pressable>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListHeaderComponent={
          <>
            {/* My Play Dates Section */}
            {myPlaydates.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Play Dates</Text>
                {myPlaydates.map((item) => (
                  <PlaydateCard
                    key={item.id}
                    playdate={item}
                    onPress={() => handleCardPress(item.id)}
                  />
                ))}
              </View>
            )}

            {/* Upcoming Play Dates Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Play Dates</Text>
              {playdates.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No upcoming play dates</Text>
                  <Text style={styles.emptySubtext}>
                    Be the first to schedule one!
                  </Text>
                </View>
              ) : (
                playdates.map((item) => (
                  <PlaydateCard
                    key={item.id}
                    playdate={item}
                    onPress={() => handleCardPress(item.id)}
                  />
                ))
              )}
            </View>
          </>
        }
        keyExtractor={keyExtractor}
      />

      {/* Floating Action Button */}
      <Pressable
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        onPress={() => router.push('/playdates/create')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  createButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});

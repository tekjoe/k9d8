import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isSameDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/hooks/useAuth';
import { useDogs } from '@/src/hooks/useDogs';
import { getPlayDateById } from '@/src/services/playdates';
import {
  cancelPlayDate,
  rsvpToPlayDate,
  cancelRSVP,
} from '@/src/services/playdates';
import type { PlayDate, PlayDateRSVP, Dog } from '@/src/types/database';

function formatDateRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  const datePart = format(start, 'EEEE, MMMM d, yyyy');
  const startTime = format(start, 'h:mm a');
  const endTime = format(end, 'h:mm a');

  if (isSameDay(start, end)) {
    return `${datePart}\n${startTime} - ${endTime}`;
  }

  return `${datePart} ${startTime}\nto ${format(end, 'EEEE, MMMM d, yyyy')} ${endTime}`;
}

export default function PlayDateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { dogs } = useDogs(userId);

  const [playdate, setPlaydate] = useState<PlayDate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDogPicker, setShowDogPicker] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPlaydate = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPlayDateById(id);
      setPlaydate(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load play date';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlaydate();
  }, [loadPlaydate]);

  const isOrganizer = playdate?.organizer_id === userId;

  const userRsvp: PlayDateRSVP | undefined = (playdate?.rsvps ?? []).find(
    (r) => r.user_id === userId,
  );

  const goingRsvps = (playdate?.rsvps ?? []).filter(
    (r) => r.status === 'going',
  );
  const maybeRsvps = (playdate?.rsvps ?? []).filter(
    (r) => r.status === 'maybe',
  );

  const handleCancel = useCallback(async () => {
    if (!playdate) return;
    Alert.alert(
      'Cancel Play Date',
      'Are you sure you want to cancel this play date?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const updated = await cancelPlayDate(playdate.id);
              setPlaydate(updated);
            } catch (err) {
              const message =
                err instanceof Error ? err.message : 'Failed to cancel';
              Alert.alert('Error', message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  }, [playdate]);

  const handleRsvp = useCallback(
    async (dog: Dog) => {
      if (!playdate || !userId) return;
      setShowDogPicker(false);
      setActionLoading(true);
      try {
        const rsvp = await rsvpToPlayDate(playdate.id, userId, dog.id, 'going');
        setPlaydate((prev) => {
          if (!prev) return prev;
          const existingIdx = (prev.rsvps ?? []).findIndex(
            (r) => r.user_id === userId,
          );
          const rsvps = [...(prev.rsvps ?? [])];
          if (existingIdx >= 0) {
            rsvps[existingIdx] = rsvp;
          } else {
            rsvps.push(rsvp);
          }
          return { ...prev, rsvps };
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to RSVP';
        Alert.alert('Error', message);
      } finally {
        setActionLoading(false);
      }
    },
    [playdate, userId],
  );

  const handleCancelRsvp = useCallback(async () => {
    if (!userRsvp || !playdate) return;
    setActionLoading(true);
    try {
      await cancelRSVP(userRsvp.id);
      setPlaydate((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rsvps: (prev.rsvps ?? []).filter((r) => r.id !== userRsvp.id),
        };
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to cancel RSVP';
      Alert.alert('Error', message);
    } finally {
      setActionLoading(false);
    }
  }, [userRsvp, playdate]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (error || !playdate) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Play date not found'}</Text>
        <Pressable style={styles.retryButton} onPress={loadPlaydate}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const isCancelled = playdate.status === 'cancelled';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {playdate.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Badge */}
        {isCancelled && (
          <View style={styles.cancelledBanner}>
            <Text style={styles.cancelledBannerText}>
              This play date has been cancelled
            </Text>
          </View>
        )}

        {/* Title & Description */}
        <Text style={styles.title}>{playdate.title}</Text>
        {playdate.description ? (
          <Text style={styles.description}>{playdate.description}</Text>
        ) : null}

        {/* Park Info */}
        {playdate.park && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Park</Text>
            <Text style={styles.infoValue}>{playdate.park.name}</Text>
            {playdate.park.address && (
              <Text style={styles.infoSubvalue}>{playdate.park.address}</Text>
            )}
          </View>
        )}

        {/* Time Range */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>When</Text>
          <Text style={styles.infoValue}>
            {formatDateRange(playdate.starts_at, playdate.ends_at)}
          </Text>
        </View>

        {/* Max Dogs */}
        {playdate.max_dogs != null && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Max Dogs</Text>
            <Text style={styles.infoValue}>{playdate.max_dogs}</Text>
          </View>
        )}

        {/* Organizer */}
        {playdate.organizer && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Organizer</Text>
            <Text style={styles.infoValue}>
              {playdate.organizer.display_name ?? playdate.organizer.email}
              {isOrganizer ? ' (You)' : ''}
            </Text>
          </View>
        )}

        {/* RSVP List */}
        <View style={styles.rsvpSection}>
          <Text style={styles.sectionTitle}>
            Who's Coming ({goingRsvps.length})
          </Text>
          {goingRsvps.length === 0 ? (
            <Text style={styles.emptyRsvp}>
              No one has RSVP'd yet. Be the first!
            </Text>
          ) : (
            goingRsvps.map((rsvp) => (
              <View key={rsvp.id} style={styles.rsvpItem}>
                <View style={styles.rsvpAvatar}>
                  <Text style={styles.rsvpAvatarText}>
                    {(
                      rsvp.profile?.display_name ??
                      rsvp.profile?.email ??
                      '?'
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rsvpInfo}>
                  <Text style={styles.rsvpName}>
                    {rsvp.profile?.display_name ?? rsvp.profile?.email ?? 'Unknown'}
                    {rsvp.user_id === userId ? ' (You)' : ''}
                  </Text>
                  {rsvp.dog && (
                    <Text style={styles.rsvpDog}>
                      with {rsvp.dog.name}
                      {rsvp.dog.breed ? ` (${rsvp.dog.breed})` : ''}
                    </Text>
                  )}
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>Going</Text>
                </View>
              </View>
            ))
          )}

          {maybeRsvps.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, styles.maybeSectionTitle]}>
                Maybe ({maybeRsvps.length})
              </Text>
              {maybeRsvps.map((rsvp) => (
                <View key={rsvp.id} style={styles.rsvpItem}>
                  <View style={[styles.rsvpAvatar, styles.rsvpAvatarMaybe]}>
                    <Text style={styles.rsvpAvatarText}>
                      {(
                        rsvp.profile?.display_name ??
                        rsvp.profile?.email ??
                        '?'
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.rsvpInfo}>
                    <Text style={styles.rsvpName}>
                      {rsvp.profile?.display_name ?? rsvp.profile?.email ?? 'Unknown'}
                      {rsvp.user_id === userId ? ' (You)' : ''}
                    </Text>
                    {rsvp.dog && (
                      <Text style={styles.rsvpDog}>
                        with {rsvp.dog.name}
                        {rsvp.dog.breed ? ` (${rsvp.dog.breed})` : ''}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, styles.statusBadgeMaybe]}>
                    <Text style={[styles.statusBadgeText, styles.statusBadgeTextMaybe]}>
                      Maybe
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {!isCancelled && (
        <View style={styles.actionBar}>
          {actionLoading ? (
            <ActivityIndicator size="small" color="#4A90D9" />
          ) : isOrganizer ? (
            <Pressable style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel Play Date</Text>
            </Pressable>
          ) : userRsvp ? (
            <View style={styles.rsvpActions}>
              <View style={styles.currentRsvp}>
                <Text style={styles.currentRsvpText}>
                  You're {userRsvp.status === 'going' ? 'going' : 'maybe going'}
                  {userRsvp.dog ? ` with ${userRsvp.dog.name}` : ''}
                </Text>
              </View>
              <Pressable
                style={styles.cancelRsvpButton}
                onPress={handleCancelRsvp}
              >
                <Text style={styles.cancelRsvpButtonText}>Cancel RSVP</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.rsvpButton}
              onPress={() => setShowDogPicker(true)}
            >
              <Text style={styles.rsvpButtonText}>RSVP</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Dog Picker Modal */}
      <Modal
        visible={showDogPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDogPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Your Dog</Text>
            <Pressable onPress={() => setShowDogPicker(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>
          {dogs.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyRsvp}>
                You haven't added any dogs yet.{'\n'}Add a dog in your profile first.
              </Text>
            </View>
          ) : (
            <FlatList
              data={dogs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.dogList}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.dogOption}
                  onPress={() => handleRsvp(item)}
                >
                  <View style={styles.dogAvatar}>
                    <Text style={styles.dogAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.dogInfo}>
                    <Text style={styles.dogName}>{item.name}</Text>
                    {item.breed && (
                      <Text style={styles.dogBreed}>{item.breed}</Text>
                    )}
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  headerSpacer: {
    width: 32,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelledBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cancelledBannerText: {
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  infoSubvalue: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  rsvpSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  maybeSectionTitle: {
    marginTop: 20,
  },
  emptyRsvp: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
    lineHeight: 20,
  },
  rsvpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rsvpAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpAvatarMaybe: {
    backgroundColor: '#F59E0B',
  },
  rsvpAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  rsvpInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rsvpName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  rsvpDog: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeMaybe: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  statusBadgeTextMaybe: {
    color: '#F59E0B',
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  rsvpButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  rsvpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  rsvpActions: {
    width: '100%',
    gap: 10,
  },
  currentRsvp: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  currentRsvpText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelRsvpButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelRsvpButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90D9',
  },
  dogList: {
    padding: 16,
  },
  dogOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  dogAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dogAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dogInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dogName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  dogBreed: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format, isSameDay } from 'date-fns';
import type { PlayDate } from '@/src/types/database';

interface PlaydateCardProps {
  playdate: PlayDate;
  onPress?: () => void;
}

function formatDateRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  const datePart = format(start, 'EEE, MMM d');
  const startTime = format(start, 'h:mm a');
  const endTime = format(end, 'h:mm a');

  if (isSameDay(start, end)) {
    return `${datePart} \u00B7 ${startTime} - ${endTime}`;
  }

  return `${datePart} ${startTime} - ${format(end, 'EEE, MMM d')} ${endTime}`;
}

export function PlaydateCard({ playdate, onPress }: PlaydateCardProps) {
  const goingCount = (playdate.rsvps ?? []).filter(
    (r) => r.status === 'going',
  ).length;

  const isCancelled = playdate.status === 'cancelled';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isCancelled && styles.cardCancelled,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={[styles.title, isCancelled && styles.titleCancelled]} numberOfLines={1}>
          {playdate.title}
        </Text>
        {isCancelled && (
          <View style={styles.cancelledBadge}>
            <Text style={styles.cancelledBadgeText}>Cancelled</Text>
          </View>
        )}
      </View>

      {playdate.park && (
        <Text style={styles.parkName} numberOfLines={1}>
          {playdate.park.name}
        </Text>
      )}

      <Text style={styles.dateTime}>
        {formatDateRange(playdate.starts_at, playdate.ends_at)}
      </Text>

      <View style={styles.footer}>
        {playdate.organizer && (
          <Text style={styles.organizer} numberOfLines={1}>
            Organized by {playdate.organizer.display_name ?? playdate.organizer.email}
          </Text>
        )}
        <Text style={styles.rsvpCount}>
          {goingCount} {goingCount === 1 ? 'dog' : 'dogs'} going
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  cardCancelled: {
    opacity: 0.6,
  },
  cardPressed: {
    opacity: 0.7,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
  },
  titleCancelled: {
    textDecorationLine: 'line-through',
  },
  cancelledBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelledBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  parkName: {
    fontSize: 14,
    color: '#4A90D9',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  organizer: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  rsvpCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6FCF97',
    marginLeft: 8,
  },
});

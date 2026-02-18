import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format, isSameDay } from 'date-fns';
import type { PlayDate } from '@/src/types/database';
import { isPlaydateExpired, getPlaydateStatus } from '@/src/utils/playdates';

interface PlaydateCardProps {
  playdate: PlayDate;
  onPress?: () => void;
  showStatus?: boolean;
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

export function PlaydateCard({ playdate, onPress, showStatus = true }: PlaydateCardProps) {
  const goingCount = (playdate.rsvps ?? []).filter(
    (r) => r.status === 'going',
  ).length;

  const isCancelled = playdate.status === 'cancelled';
  const isExpired = playdate.status === 'completed' || isPlaydateExpired(playdate);
  const status = showStatus ? getPlaydateStatus(playdate) : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        (isCancelled || isExpired) && styles.cardInactive,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={[styles.title, (isCancelled || isExpired) && styles.titleInactive]} numberOfLines={1}>
          {playdate.title}
        </Text>
        {isCancelled && (
          <View style={styles.cancelledBadge}>
            <Text style={styles.cancelledBadgeText}>Cancelled</Text>
          </View>
        )}
        {isExpired && !isCancelled && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>Completed</Text>
          </View>
        )}
        {status?.label === 'Starting Soon' && !isExpired && !isCancelled && (
          <View style={styles.startingSoonBadge}>
            <Text style={styles.startingSoonBadgeText}>{status.label}</Text>
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
        <Text style={[styles.rsvpCount, isExpired && styles.rsvpCountInactive]}>
          {goingCount} {goingCount === 1 ? 'dog' : 'dogs'} {isExpired ? 'attended' : 'going'}
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
    borderColor: '#E5E4E1',
    marginBottom: 12,
  },
  cardInactive: {
    opacity: 0.75,
    backgroundColor: '#F9F9F8',
  },
  cardPressed: {
    opacity: 0.7,
    backgroundColor: '#F5F4F1',
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
    color: '#1A1918',
    flex: 1,
  },
  titleInactive: {
    color: '#6D6C6A',
  },
  cancelledBadge: {
    backgroundColor: '#F5E8E3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelledBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B5725E',
  },
  completedBadge: {
    backgroundColor: '#E8E8E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6D6C6A',
  },
  startingSoonBadge: {
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  startingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4A64A',
  },
  parkName: {
    fontSize: 14,
    color: '#3D8A5A',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 13,
    color: '#6D6C6A',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  organizer: {
    fontSize: 12,
    color: '#878685',
    flex: 1,
  },
  rsvpCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D8A5A',
    marginLeft: 8,
  },
  rsvpCountInactive: {
    color: '#9C9B99',
  },
});

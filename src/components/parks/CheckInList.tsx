import { FlatList, StyleSheet, Text, View } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import type { CheckIn } from '../../types/database';
import { Colors } from '../../constants/colors';

interface CheckInListProps {
  activeCheckIns: CheckIn[];
}

function DogChip({ name }: { name: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{name}</Text>
    </View>
  );
}

function CheckInItem({ checkIn }: { checkIn: CheckIn }) {
  const displayName =
    checkIn.profile?.display_name || checkIn.profile?.email || 'Unknown User';

  const timeAgo = formatDistanceToNow(new Date(checkIn.checked_in_at), {
    addSuffix: true,
  });

  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.userName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.timeText}>{timeAgo}</Text>
      </View>
      {checkIn.dogs && checkIn.dogs.length > 0 && (
        <View style={styles.chipRow}>
          {checkIn.dogs.map((dog) => (
            <DogChip key={dog.id} name={dog.name} />
          ))}
        </View>
      )}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No one is here right now</Text>
    </View>
  );
}

export function CheckInList({ activeCheckIns }: CheckInListProps) {
  const dogCount = activeCheckIns.reduce(
    (sum, ci) => sum + (ci.dogs?.length ?? 0),
    0,
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {dogCount} dog{dogCount !== 1 ? 's' : ''} at this park
      </Text>
      <FlatList
        data={activeCheckIns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CheckInItem checkIn={item} />}
        ListEmptyComponent={EmptyState}
        scrollEnabled={false}
        contentContainerStyle={
          activeCheckIns.length === 0 ? styles.emptyList : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  item: {
    backgroundColor: Colors.light.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    backgroundColor: Colors.light.primary + '1A',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  emptyList: {
    flexGrow: 1,
  },
});

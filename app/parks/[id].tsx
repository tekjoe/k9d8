import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getParkById } from '@/src/services/parks';
import { useAuth } from '@/src/hooks/useAuth';
import { useCheckIn } from '@/src/hooks/useCheckIn';
import { useDogs } from '@/src/hooks/useDogs';
import { CheckInList } from '@/src/components/parks/CheckInList';
import { CheckInButton } from '@/src/components/parks/CheckInButton';
import { Colors } from '@/src/constants/colors';
import type { Park } from '@/src/types/database';

function FeatureRow({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <View style={styles.featureRow}>
      <View
        style={[
          styles.featureIndicator,
          active ? styles.featureActive : styles.featureInactive,
        ]}
      />
      <Text
        style={[
          styles.featureLabel,
          !active && styles.featureLabelInactive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function AmenityChip({ label }: { label: string }) {
  return (
    <View style={styles.amenityChip}>
      <Text style={styles.amenityChipText}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function ParkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [park, setPark] = useState<Park | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    activeCheckIns,
    userCheckIn,
    loading: checkInLoading,
    checkIn,
    checkOut,
  } = useCheckIn(id!);

  const { dogs } = useDogs(userId);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function fetchPark() {
      try {
        const data = await getParkById(id!);
        if (isMounted) {
          setPark(data);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : 'Failed to load park details';
          setError(message);
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
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (error || !park) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Park not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.parkName}>{park.name}</Text>

      {park.address && (
        <Text style={styles.address}>{park.address}</Text>
      )}

      {park.description && (
        <Text style={styles.description}>{park.description}</Text>
      )}

      <SectionHeader title="Features" />
      <View style={styles.featuresContainer}>
        <FeatureRow label="Fenced area" active={park.is_fenced} />
        <FeatureRow label="Water station" active={park.has_water} />
        <FeatureRow label="Shaded areas" active={park.has_shade} />
      </View>

      {park.amenities.length > 0 && (
        <>
          <SectionHeader title="Amenities" />
          <View style={styles.amenities}>
            {park.amenities.map((amenity) => (
              <AmenityChip key={amenity} label={amenity} />
            ))}
          </View>
        </>
      )}

      <View style={styles.checkInSection}>
        <CheckInButton
          userCheckIn={userCheckIn}
          dogs={dogs}
          onCheckIn={checkIn}
          onCheckOut={checkOut}
          loading={checkInLoading}
        />
      </View>

      <CheckInList activeCheckIns={activeCheckIns} />

      <SectionHeader title="Upcoming Play Dates" />
      <View style={styles.placeholderSection}>
        <Text style={styles.placeholderText}>
          No upcoming play dates at this park.
        </Text>
        <Text style={styles.placeholderSubtext}>
          Play dates coming in a future update.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.error,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  parkName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  address: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginTop: 6,
  },
  description: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 28,
    marginBottom: 12,
  },
  featuresContainer: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  featureActive: {
    backgroundColor: Colors.light.success,
  },
  featureInactive: {
    backgroundColor: Colors.light.border,
  },
  featureLabel: {
    fontSize: 15,
    color: Colors.light.text,
  },
  featureLabelInactive: {
    color: Colors.light.textSecondary,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  amenityChipText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  checkInSection: {
    marginTop: 28,
  },
  placeholderSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  placeholderSubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
});

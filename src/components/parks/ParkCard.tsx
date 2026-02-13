import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Park } from '../../types/database';
import { Colors } from '../../constants/colors';

interface ParkCardProps {
  park: Park;
  distanceKm?: number;
  onPress: () => void;
}

function FeatureBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  return (
    <View style={styles.featureBadge}>
      <Text style={styles.featureBadgeText}>{label}</Text>
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

export default function ParkCard({ park, distanceKm, onPress }: ParkCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {park.name}
        </Text>
        {distanceKm !== undefined && (
          <Text style={styles.distance}>
            {distanceKm < 1
              ? `${Math.round(distanceKm * 1000)} m`
              : `${distanceKm.toFixed(1)} km`}
          </Text>
        )}
      </View>

      {park.address && (
        <Text style={styles.address} numberOfLines={1}>
          {park.address}
        </Text>
      )}

      <View style={styles.features}>
        <FeatureBadge label="Fenced" active={park.is_fenced} />
        <FeatureBadge label="Water" active={park.has_water} />
        <FeatureBadge label="Shade" active={park.has_shade} />
      </View>

      {park.amenities.length > 0 && (
        <View style={styles.amenities}>
          {park.amenities.map((amenity) => (
            <AmenityChip key={amenity} label={amenity} />
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  distance: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  address: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  features: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  featureBadge: {
    backgroundColor: Colors.light.secondary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D8B57',
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  amenityChip: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  amenityChipText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});

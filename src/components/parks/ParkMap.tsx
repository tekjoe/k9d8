import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import type { Park } from '../../types/database';

export interface ParkMapProps {
  parks: Park[];
  checkInCounts: Record<string, number>;
  userLocation: { latitude: number; longitude: number } | null;
  onParkSelect: (park: Park) => void;
  onMapPress?: () => void;
}

export default function ParkMap({
  parks,
  checkInCounts,
  userLocation,
  onParkSelect,
}: ParkMapProps) {
  // Native map implementation is a placeholder
  // In a real app, you would use react-native-maps here
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E5E4E1' }}>
      <Text style={{ fontSize: 16, color: '#6D6C6A', marginBottom: 8 }}>
        Map View
      </Text>
      <Text style={{ fontSize: 14, color: '#878685' }}>
        {parks.length} parks available
      </Text>
      {userLocation && (
        <Text style={{ fontSize: 12, color: '#878685', marginTop: 8 }}>
          Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
        </Text>
      )}
    </View>
  );
}

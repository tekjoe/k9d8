import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import type { Park } from '../../types/database';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

export interface ParkMapProps {
  parks: Park[];
  userLocation: { latitude: number; longitude: number } | null;
  onParkSelect: (park: Park) => void;
}

export default function ParkMap({
  parks,
  userLocation,
  onParkSelect,
}: ParkMapProps) {
  const centerCoordinate: [number, number] = userLocation
    ? [userLocation.longitude, userLocation.latitude]
    : [-98.5795, 39.8283]; // Center of US as fallback

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Street}>
        <MapboxGL.Camera
          zoomLevel={13}
          centerCoordinate={centerCoordinate}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {userLocation && (
          <MapboxGL.UserLocation visible animated />
        )}

        {parks.map((park) => (
          <MapboxGL.PointAnnotation
            key={park.id}
            id={park.id}
            coordinate={[park.longitude, park.latitude]}
            title={park.name}
            onSelected={() => onParkSelect(park)}
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker} />
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90D9',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

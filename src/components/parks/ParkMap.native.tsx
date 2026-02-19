import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Park } from '../../types/database';

let MapboxGL: typeof import('@rnmapbox/maps') | null = null;
try {
  MapboxGL = require('@rnmapbox/maps').default;
  MapboxGL?.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');
} catch {
  // Native map not linked (e.g. running in Expo Go). Fallback UI is shown.
}

export interface ParkMapProps {
  parks: Park[];
  checkInCounts: Record<string, number>;
  userLocation: { latitude: number; longitude: number } | null;
  onParkSelect: (park: Park) => void;
  onMapPress?: () => void;
}

function ParkMarker({ count }: { count: number }) {
  const hasActivity = count > 0;
  return (
    <View style={styles.markerContainer}>
      <View
        style={[
          styles.marker,
          !hasActivity && styles.markerInactive,
        ]}
      >
        {hasActivity ? (
          <Text style={styles.markerText}>{count}</Text>
        ) : (
          <Text style={styles.markerEmoji}>🐾</Text>
        )}
      </View>
    </View>
  );
}

function MapFallback({
  parks,
  checkInCounts,
  onParkSelect,
}: Pick<ParkMapProps, 'parks' | 'checkInCounts' | 'onParkSelect'>) {
  return (
    <View style={[styles.container, styles.fallbackList]}>
      <View style={styles.fallbackHeader}>
        <Text style={styles.fallbackTitle}>Map unavailable in Expo Go</Text>
        <Text style={styles.fallbackText}>Run a development build to see the map. Browse parks below:</Text>
      </View>
      {parks.map((park) => {
        const pupCount = checkInCounts[park.id] || 0;
        return (
          <Pressable
            key={park.id}
            style={styles.parkRow}
            onPress={() => onParkSelect(park)}
          >
            <View style={styles.parkRowContent}>
              <Text style={styles.parkName} numberOfLines={1}>{park.name}</Text>
              {park.address ? (
                <Text style={styles.parkAddress} numberOfLines={1}>{park.address}</Text>
              ) : null}
              <View style={styles.parkRowMeta}>
                <Ionicons name="paw" size={12} color="#3D8A5A" />
                <Text style={styles.parkPupCount}>{pupCount} {pupCount === 1 ? 'pup' : 'pups'} here</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#878685" />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ParkMap({
  parks,
  checkInCounts,
  userLocation,
  onParkSelect,
  onMapPress,
}: ParkMapProps) {
  if (!MapboxGL) {
    return (
      <MapFallback parks={parks} checkInCounts={checkInCounts} onParkSelect={onParkSelect} />
    );
  }

  const centerCoordinate: [number, number] = userLocation
    ? [userLocation.longitude, userLocation.latitude]
    : [-89.4, 43.07]; // Wisconsin center as fallback

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Outdoors}
        scaleBarEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        onPress={onMapPress}
      >
        <MapboxGL.Camera
          zoomLevel={9}
          centerCoordinate={centerCoordinate}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {userLocation && (
          <MapboxGL.UserLocation visible animated />
        )}

        {parks.map((park) => {
          const pupCount = checkInCounts[park.id] || 0;
          return (
            <MapboxGL.PointAnnotation
              key={park.id}
              id={park.id}
              coordinate={[park.longitude, park.latitude]}
              title={park.name}
              onSelected={() => onParkSelect(park)}
            >
              <ParkMarker count={pupCount} />
            </MapboxGL.PointAnnotation>
          );
        })}
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallbackHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F5F4F1',
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1918',
    marginBottom: 4,
  },
  fallbackText: {
    fontSize: 13,
    color: '#6D6C6A',
    lineHeight: 18,
  },
  fallbackList: {
    backgroundColor: '#FFF',
  },
  parkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E4E1',
  },
  parkRowContent: {
    flex: 1,
    marginRight: 8,
  },
  parkName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1918',
    marginBottom: 2,
  },
  parkAddress: {
    fontSize: 13,
    color: '#6D6C6A',
    marginBottom: 4,
  },
  parkRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  parkPupCount: {
    fontSize: 12,
    color: '#3D8A5A',
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3D8A5A',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3D8A5A',
  },
  markerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  markerEmoji: {
    fontSize: 14,
  },
});

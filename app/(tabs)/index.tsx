import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import ParkMap from '@/src/components/parks/ParkMap';
import { useLocation } from '@/src/hooks/useLocation';
import { useParks } from '@/src/hooks/useParks';
import { Colors } from '@/src/constants/colors';
import type { Park } from '@/src/types/database';

export default function MapTab() {
  const router = useRouter();
  const { location, errorMsg, isLoading: locationLoading } = useLocation();
  const { parks, loading: parksLoading, error: parksError, loadParks } = useParks();

  useEffect(() => {
    if (location) {
      loadParks(location.latitude, location.longitude);
    }
  }, [location, loadParks]);

  const handleParkSelect = (park: Park) => {
    router.push(`/parks/${park.id}`);
  };

  if (locationLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Text style={styles.subtext}>
          Please enable location services to find parks near you.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ParkMap
        parks={parks}
        userLocation={location}
        onParkSelect={handleParkSelect}
      />
      {parksLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.overlayText}>Loading parks...</Text>
        </View>
      )}
      {parksError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.overlayErrorText}>{parksError}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.error,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  overlayText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  errorOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: Colors.light.error,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  overlayErrorText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});

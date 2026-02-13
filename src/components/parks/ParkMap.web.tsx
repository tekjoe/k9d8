import React, { useCallback } from 'react';
import Map, { Marker } from 'react-map-gl';
import type { Park } from '../../types/database';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

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
  const initialViewState = {
    latitude: userLocation?.latitude ?? 39.8283,
    longitude: userLocation?.longitude ?? -98.5795,
    zoom: 13,
  };

  const handleMarkerClick = useCallback(
    (park: Park) => {
      onParkSelect(park);
    },
    [onParkSelect]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {userLocation && (
          <Marker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            anchor="center"
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#007AFF',
                border: '3px solid #FFFFFF',
                boxShadow: '0 0 0 2px rgba(0,122,255,0.3)',
              }}
            />
          </Marker>
        )}

        {parks.map((park) => (
          <Marker
            key={park.id}
            latitude={park.latitude}
            longitude={park.longitude}
            anchor="center"
            onClick={() => handleMarkerClick(park)}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#4A90D9',
                border: '3px solid #FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                cursor: 'pointer',
              }}
            />
          </Marker>
        ))}
      </Map>
    </div>
  );
}

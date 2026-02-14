import React, { useCallback } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import type { Park } from '../../types/database';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

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
  onMapPress,
}: ParkMapProps) {
  const initialViewState = {
    latitude: userLocation?.latitude ?? 37.7749,
    longitude: userLocation?.longitude ?? -122.4194,
    zoom: 9,
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
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
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

        {parks.map((park) => {
          const pupCount = checkInCounts[park.id] || 0;
          const hasActivity = pupCount > 0;
          return (
            <Marker
              key={park.id}
              latitude={park.latitude}
              longitude={park.longitude}
              anchor="center"
              onClick={() => handleMarkerClick(park)}
            >
              <div
                style={{
                  width: hasActivity ? 44 : 32,
                  height: hasActivity ? 44 : 32,
                  borderRadius: hasActivity ? 22 : 16,
                  backgroundColor: hasActivity ? '#2D8B57' : '#6FCF97',
                  border: '3px solid #FFFFFF',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {hasActivity ? (
                  <span
                    style={{
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {pupCount}
                  </span>
                ) : (
                  <span
                    style={{
                      color: '#fff',
                      fontSize: 14,
                    }}
                  >
                    🐾
                  </span>
                )}
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}

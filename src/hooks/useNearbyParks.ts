import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BoundingBox,
  boundingBoxFromCenter,
  getParksInBounds,
  getActiveCheckInCounts,
} from '../services/parks';
import type { Park } from '../types/database';

const INITIAL_RADIUS_MILES = 50;

interface UseNearbyParksReturn {
  parks: Park[];
  checkInCounts: Record<string, number>;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  loadBounds: (bounds: BoundingBox) => void;
  refresh: () => Promise<void>;
}

export function useNearbyParks(
  userLocation: { latitude: number; longitude: number } | null,
  locationReady: boolean = false
): UseNearbyParksReturn {
  const parkCache = useRef(new Map<string, Park>());
  const [parks, setParks] = useState<Park[]>([]);
  const [checkInCounts, setCheckInCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const mergeParks = useCallback((newParks: Park[]) => {
    let changed = false;
    for (const park of newParks) {
      if (!parkCache.current.has(park.id)) {
        parkCache.current.set(park.id, park);
        changed = true;
      }
    }
    if (changed) {
      setParks(Array.from(parkCache.current.values()));
    }
  }, []);

  const loadBounds = useCallback(
    (bounds: BoundingBox) => {
      setLoadingMore(true);
      getParksInBounds(bounds)
        .then((newParks) => mergeParks(newParks))
        .catch((err) => console.warn('Failed to load parks for bounds:', err))
        .finally(() => setLoadingMore(false));
    },
    [mergeParks]
  );

  const initialLoad = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    setError(null);
    try {
      const bounds = boundingBoxFromCenter(
        userLocation.latitude,
        userLocation.longitude,
        INITIAL_RADIUS_MILES
      );
      const [parkData, counts] = await Promise.all([
        getParksInBounds(bounds),
        getActiveCheckInCounts(),
      ]);
      mergeParks(parkData);
      setCheckInCounts(counts);
      initialLoadDone.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parks');
    } finally {
      setLoading(false);
    }
  }, [userLocation, mergeParks]);

  const refresh = useCallback(async () => {
    parkCache.current.clear();
    setParks([]);
    initialLoadDone.current = false;
    await initialLoad();
  }, [initialLoad]);

  // Trigger initial load when location becomes available
  useEffect(() => {
    if (userLocation && !initialLoadDone.current) {
      initialLoad();
    }
  }, [userLocation, initialLoad]);

  // If location resolved without coordinates (denied/error), stop loading
  useEffect(() => {
    if (locationReady && !userLocation) {
      setLoading(false);
    }
  }, [locationReady, userLocation]);

  return { parks, checkInCounts, loading, loadingMore, error, loadBounds, refresh };
}

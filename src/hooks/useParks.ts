import { useCallback, useState } from 'react';
import { getParksNearby } from '../services/parks';
import type { Park } from '../types/database';

interface UseParksReturn {
  parks: Park[];
  loading: boolean;
  error: string | null;
  loadParks: (lat: number, lng: number) => Promise<void>;
}

export function useParks(): UseParksReturn {
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadParks = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getParksNearby(lat, lng);
      setParks(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load parks';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { parks, loading, error, loadParks };
}

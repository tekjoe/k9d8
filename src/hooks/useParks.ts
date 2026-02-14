import { useCallback, useEffect, useState } from 'react';
import { getAllParks, getActiveCheckInCounts } from '../services/parks';
import type { Park } from '../types/database';

interface UseParksReturn {
  parks: Park[];
  checkInCounts: Record<string, number>;
  loading: boolean;
  error: string | null;
  loadParks: () => Promise<void>;
}

export function useParks(): UseParksReturn {
  const [parks, setParks] = useState<Park[]>([]);
  const [checkInCounts, setCheckInCounts] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadParks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [parkData, counts] = await Promise.all([
        getAllParks(),
        getActiveCheckInCounts(),
      ]);
      setParks(parkData);
      setCheckInCounts(counts);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load parks';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParks();
  }, [loadParks]);

  return { parks, checkInCounts, loading, error, loadParks };
}

import { useCallback, useEffect, useState } from 'react';
import type { Dog, Database } from '../types/database';
import {
  getDogsByOwner,
  createDog,
  updateDog,
  deleteDog,
} from '../services/dogs';

type DogInsert = Database['public']['Tables']['dogs']['Insert'];
type DogUpdate = Database['public']['Tables']['dogs']['Update'];

export function useDogs(ownerId: string | undefined) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDogs = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDogsByOwner(ownerId);
      setDogs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dogs';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    loadDogs();
  }, [loadDogs]);

  const addDog = useCallback(
    async (data: DogInsert): Promise<Dog> => {
      const dog = await createDog(data);
      setDogs((prev) => [dog, ...prev]);
      return dog;
    },
    [],
  );

  const editDog = useCallback(
    async (id: string, data: DogUpdate): Promise<Dog> => {
      const dog = await updateDog(id, data);
      setDogs((prev) => prev.map((d) => (d.id === id ? dog : d)));
      return dog;
    },
    [],
  );

  const removeDog = useCallback(
    async (id: string): Promise<void> => {
      await deleteDog(id);
      setDogs((prev) => prev.filter((d) => d.id !== id));
    },
    [],
  );

  return {
    dogs,
    loading,
    error,
    loadDogs,
    addDog,
    editDog,
    removeDog,
  };
}

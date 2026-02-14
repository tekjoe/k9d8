import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAllActiveCheckIns } from '../services/checkins';
import type { CheckIn, Dog } from '../types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NearbyPup {
  dog: Dog;
  parkName: string;
  parkId: string;
  ownerName: string;
  ownerId: string;
}

interface UseNearbyPupsReturn {
  pups: NearbyPup[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useNearbyPups(): UseNearbyPupsReturn {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadCheckIns = useCallback(async () => {
    try {
      const data = await getAllActiveCheckIns();
      setCheckIns(data);
    } catch (err) {
      console.error('Failed to load nearby pups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCheckIns();
  }, [loadCheckIns]);

  // Subscribe to check-in changes
  useEffect(() => {
    const channel = supabase
      .channel('all-check-ins')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_ins',
        },
        () => {
          loadCheckIns();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [loadCheckIns]);

  // Flatten check-ins into individual pups
  const pups: NearbyPup[] = checkIns.flatMap((checkIn) => {
    const dogs = checkIn.dogs ?? [];
    const parkName = (checkIn.park as { name?: string })?.name ?? 'Unknown Park';
    const parkId = checkIn.park_id;
    const ownerName = checkIn.profile?.display_name ?? 'Unknown Owner';
    const ownerId = checkIn.user_id;

    return dogs.map((dog) => ({
      dog,
      parkName,
      parkId,
      ownerName,
      ownerId,
    }));
  });

  return { pups, loading, refresh: loadCheckIns };
}

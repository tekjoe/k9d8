import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  checkIn as checkInService,
  checkOut as checkOutService,
  getActiveCheckIns,
  getUserActiveCheckIn,
} from '../services/checkins';
import { useAuth } from './useAuth';
import type { CheckIn } from '../types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseCheckInReturn {
  activeCheckIns: CheckIn[];
  userCheckIn: CheckIn | null;
  loading: boolean;
  checkIn: (dogIds: string[]) => Promise<void>;
  checkOut: () => Promise<void>;
}

export function useCheckIn(parkId: string): UseCheckInReturn {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [activeCheckIns, setActiveCheckIns] = useState<CheckIn[]>([]);
  const [userCheckIn, setUserCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadCheckIns = useCallback(async () => {
    if (!parkId) {
      setActiveCheckIns([]);
      setUserCheckIn(null);
      setLoading(false);
      return;
    }
    try {
      const [active, userActive] = await Promise.all([
        getActiveCheckIns(parkId),
        userId ? getUserActiveCheckIn(userId) : Promise.resolve(null),
      ]);
      setActiveCheckIns(active);
      // Only set userCheckIn if the user's active check-in is at this park
      if (userActive && userActive.park_id === parkId) {
        setUserCheckIn(userActive);
      } else {
        setUserCheckIn(null);
      }
    } catch (err) {
      console.error('Failed to load check-ins:', err);
    } finally {
      setLoading(false);
    }
  }, [parkId, userId]);

  // Load active check-ins on mount (skip when no parkId to avoid invalid UUID)
  useEffect(() => {
    loadCheckIns();
  }, [loadCheckIns]);

  // Subscribe to Realtime changes on check_ins filtered by park_id
  useEffect(() => {
    if (!parkId) return;
    const channel = supabase
      .channel(`check_ins:park_id=eq.${parkId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'check_ins',
          filter: `park_id=eq.${parkId}`,
        },
        () => {
          loadCheckIns();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'check_ins',
          filter: `park_id=eq.${parkId}`,
        },
        () => {
          loadCheckIns();
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [parkId, loadCheckIns]);

  const checkIn = useCallback(
    async (dogIds: string[]) => {
      if (!userId) throw new Error('User must be logged in to check in');
      setLoading(true);
      try {
        await checkInService(userId, parkId, dogIds);
        await loadCheckIns();
      } finally {
        setLoading(false);
      }
    },
    [userId, parkId, loadCheckIns],
  );

  const checkOut = useCallback(async () => {
    if (!userCheckIn) return;
    setLoading(true);
    try {
      await checkOutService(userCheckIn.id);
      await loadCheckIns();
    } finally {
      setLoading(false);
    }
  }, [userCheckIn, loadCheckIns]);

  return {
    activeCheckIns,
    userCheckIn,
    loading,
    checkIn,
    checkOut,
  };
}

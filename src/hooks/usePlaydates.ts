import { useCallback, useEffect, useState } from 'react';
import type { PlayDate, RSVPStatus, Database } from '../types/database';
import {
  getPlayDates,
  getMyPlayDates,
  getActivePlaydates,
  getPastPlaydates,
  getAllPlaydatesForUser,
  createPlayDate,
  cancelPlayDate,
  rsvpToPlayDate,
  cancelRSVP,
} from '../services/playdates';
import { useAuth } from './useAuth';

type PlayDateInsert = Database['public']['Tables']['play_dates']['Insert'];

interface UsePlaydatesReturn {
  playdates: PlayDate[];
  myPlaydates: PlayDate[];
  upcomingPlaydates: PlayDate[];
  pastPlaydates: PlayDate[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (data: PlayDateInsert) => Promise<PlayDate>;
  cancel: (id: string) => Promise<void>;
  rsvp: (playDateId: string, dogId: string, status?: RSVPStatus) => Promise<void>;
  cancelRsvp: (rsvpId: string, playDateId: string) => Promise<void>;
}

export function usePlaydates(parkId?: string): UsePlaydatesReturn {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [playdates, setPlaydates] = useState<PlayDate[]>([]);
  const [myPlaydates, setMyPlaydates] = useState<PlayDate[]>([]);
  const [upcomingPlaydates, setUpcomingPlaydates] = useState<PlayDate[]>([]);
  const [pastPlaydates, setPastPlaydates] = useState<PlayDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaydates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get active/upcoming play dates
      const upcoming = parkId 
        ? await getActivePlaydates(parkId)
        : await getPlayDates(parkId);
      setPlaydates(upcoming);
      setUpcomingPlaydates(upcoming);

      if (userId) {
        // Get all playdates for user (both upcoming and past)
        const allPlaydates = await getAllPlaydatesForUser(userId);
        setMyPlaydates([...allPlaydates.upcoming, ...allPlaydates.past]);
        setUpcomingPlaydates(allPlaydates.upcoming);
        setPastPlaydates(allPlaydates.past);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load play dates';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [parkId, userId]);

  useEffect(() => {
    loadPlaydates();
  }, [loadPlaydates]);

  const create = useCallback(
    async (data: PlayDateInsert): Promise<PlayDate> => {
      const playDate = await createPlayDate(data);
      setPlaydates((prev) => {
        const updated = [playDate, ...prev];
        updated.sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        );
        return updated;
      });
      setMyPlaydates((prev) => {
        const updated = [playDate, ...prev];
        updated.sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        );
        return updated;
      });
      return playDate;
    },
    [],
  );

  const cancel = useCallback(async (id: string): Promise<void> => {
    const updated = await cancelPlayDate(id);
    setPlaydates((prev) => prev.filter((pd) => pd.id !== id));
    setMyPlaydates((prev) =>
      prev.map((pd) => (pd.id === id ? updated : pd)),
    );
  }, []);

  const rsvp = useCallback(
    async (
      playDateId: string,
      dogId: string,
      status: RSVPStatus = 'going',
    ): Promise<void> => {
      if (!userId) return;
      const newRsvp = await rsvpToPlayDate(playDateId, userId, dogId, status);

      const updateRsvps = (prev: PlayDate[]) =>
        prev.map((pd) => {
          if (pd.id !== playDateId) return pd;
          const existingIdx = (pd.rsvps ?? []).findIndex(
            (r) => r.user_id === userId,
          );
          const rsvps = [...(pd.rsvps ?? [])];
          if (existingIdx >= 0) {
            rsvps[existingIdx] = newRsvp;
          } else {
            rsvps.push(newRsvp);
          }
          return { ...pd, rsvps };
        });

      setPlaydates(updateRsvps);
      setMyPlaydates(updateRsvps);
    },
    [userId],
  );

  const cancelRsvpFn = useCallback(
    async (rsvpId: string, playDateId: string): Promise<void> => {
      await cancelRSVP(rsvpId);

      const removeRsvp = (prev: PlayDate[]) =>
        prev.map((pd) => {
          if (pd.id !== playDateId) return pd;
          return {
            ...pd,
            rsvps: (pd.rsvps ?? []).filter((r) => r.id !== rsvpId),
          };
        });

      setPlaydates(removeRsvp);
      setMyPlaydates(removeRsvp);
    },
    [],
  );

  return {
    playdates,
    myPlaydates,
    upcomingPlaydates,
    pastPlaydates,
    loading,
    error,
    refresh: loadPlaydates,
    create,
    cancel,
    rsvp,
    cancelRsvp: cancelRsvpFn,
  };
}

import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/hooks/useAuth';
import { useDogs } from '@/src/hooks/useDogs';
import {
  getPlayDateById,
  cancelPlayDate,
  rsvpToPlayDate,
  cancelRSVP,
} from '@/src/services/playdates';
import type { PlayDate, PlayDateRSVP, Dog } from '@/src/types/database';

export function usePlaydateDetail(id: string | undefined) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { dogs } = useDogs(userId);

  const [playdate, setPlaydate] = useState<PlayDate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDogPicker, setShowDogPicker] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPlaydate = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPlayDateById(id);
      setPlaydate(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load play date';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlaydate();
  }, [loadPlaydate]);

  const isOrganizer = playdate?.organizer_id === userId;
  const isCancelled = playdate?.status === 'cancelled';

  const userRsvp: PlayDateRSVP | undefined = (playdate?.rsvps ?? []).find(
    (r) => r.user_id === userId,
  );

  const goingRsvps = (playdate?.rsvps ?? []).filter(
    (r) => r.status === 'going',
  );
  const maybeRsvps = (playdate?.rsvps ?? []).filter(
    (r) => r.status === 'maybe',
  );

  const handleCancel = useCallback(async () => {
    if (!playdate) return;
    Alert.alert(
      'Cancel Play Date',
      'Are you sure you want to cancel this play date?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const updated = await cancelPlayDate(playdate.id);
              setPlaydate(updated);
            } catch (err) {
              const message =
                err instanceof Error ? err.message : 'Failed to cancel';
              Alert.alert('Error', message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  }, [playdate]);

  const handleRsvp = useCallback(
    async (dog: Dog) => {
      if (!playdate || !userId) return;
      setShowDogPicker(false);
      setActionLoading(true);
      try {
        const rsvp = await rsvpToPlayDate(playdate.id, userId, dog.id, 'going');
        setPlaydate((prev) => {
          if (!prev) return prev;
          const existingIdx = (prev.rsvps ?? []).findIndex(
            (r) => r.user_id === userId,
          );
          const rsvps = [...(prev.rsvps ?? [])];
          if (existingIdx >= 0) {
            rsvps[existingIdx] = rsvp;
          } else {
            rsvps.push(rsvp);
          }
          return { ...prev, rsvps };
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to RSVP';
        Alert.alert('Error', message);
      } finally {
        setActionLoading(false);
      }
    },
    [playdate, userId],
  );

  const handleCancelRsvp = useCallback(async () => {
    if (!userRsvp || !playdate) return;
    setActionLoading(true);
    try {
      await cancelRSVP(userRsvp.id);
      setPlaydate((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rsvps: (prev.rsvps ?? []).filter((r) => r.id !== userRsvp.id),
        };
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to cancel RSVP';
      Alert.alert('Error', message);
    } finally {
      setActionLoading(false);
    }
  }, [userRsvp, playdate]);

  return {
    playdate,
    loading,
    error,
    actionLoading,
    dogs,
    userId,
    isOrganizer,
    isCancelled,
    userRsvp,
    goingRsvps,
    maybeRsvps,
    showDogPicker,
    setShowDogPicker,
    loadPlaydate,
    handleCancel,
    handleRsvp,
    handleCancelRsvp,
  };
}

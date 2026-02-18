import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to listen for play date expiration events.
 * Calls the onExpire callback when a play date expires in real-time.
 */
export function usePlaydateExpiration(onExpire?: (playdateId: string) => void) {
  const handleExpiration = useCallback(
    (payload: { new: { id: string; status: string } }) => {
      if (payload.new.status === 'completed') {
        console.log('[usePlaydateExpiration] Play date expired:', payload.new.id);
        onExpire?.(payload.new.id);
      }
    },
    [onExpire]
  );

  useEffect(() => {
    // Listen for status changes to 'completed' on play_dates table
    const subscription = supabase
      .channel('play_date_expirations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'play_dates',
          filter: 'status=eq.completed',
        },
        handleExpiration
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [handleExpiration]);
}

/**
 * Hook to refresh play date data periodically.
 * Useful for checking expiration without relying solely on real-time updates.
 */
export function usePlaydateRefresh(
  playdateId: string,
  onRefresh: () => void,
  intervalMs: number = 60000 // Check every minute by default
) {
  useEffect(() => {
    if (!playdateId) return;

    const interval = setInterval(() => {
      onRefresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [playdateId, onRefresh, intervalMs]);
}

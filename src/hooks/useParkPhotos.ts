import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  getParkPhotos,
  uploadParkPhoto,
  voteParkPhoto,
  deleteParkPhoto,
  reportParkPhoto,
} from '../services/parkPhotos';
import { useAuth } from './useAuth';
import type { ParkPhoto, PhotoReportReason } from '../types/database';

interface UseParkPhotosReturn {
  photos: ParkPhoto[];
  featuredPhoto: ParkPhoto | null;
  loading: boolean;
  upload: (uri: string) => Promise<void>;
  vote: (photoId: string) => Promise<void>;
  deletePhoto: (photoId: string, photoUrl: string) => Promise<void>;
  report: (photoId: string, reason: PhotoReportReason) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useParkPhotos(parkId: string | undefined): UseParkPhotosReturn {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [photos, setPhotos] = useState<ParkPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = useCallback(async () => {
    if (!parkId) return;
    try {
      const data = await getParkPhotos(parkId, userId);
      setPhotos(data);
    } catch (err) {
      console.warn('Failed to fetch park photos:', err);
    } finally {
      setLoading(false);
    }
  }, [parkId, userId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Real-time subscription
  useEffect(() => {
    if (!parkId) return;

    const channel = supabase
      .channel(`park-photos:${parkId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'park_photos', filter: `park_id=eq.${parkId}` },
        () => { fetchPhotos(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'park_photo_votes' },
        () => { fetchPhotos(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parkId, fetchPhotos]);

  const upload = useCallback(async (uri: string) => {
    if (!userId || !parkId) throw new Error('Not authenticated');
    const photo = await uploadParkPhoto(userId, parkId, uri);
    setPhotos(prev => [photo, ...prev]);
  }, [userId, parkId]);

  const vote = useCallback(async (photoId: string) => {
    // Optimistic update
    setPhotos(prev => prev.map(p => {
      if (p.id !== photoId) return p;
      const wasVoted = p.user_has_voted;
      return {
        ...p,
        user_has_voted: !wasVoted,
        vote_count: (p.vote_count ?? 0) + (wasVoted ? -1 : 1),
      };
    }));

    try {
      await voteParkPhoto(photoId);
    } catch {
      // Revert on error
      fetchPhotos();
    }
  }, [fetchPhotos]);

  const deletePhotoFn = useCallback(async (photoId: string, photoUrl: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    try {
      await deleteParkPhoto(photoId, photoUrl);
    } catch {
      fetchPhotos();
    }
  }, [fetchPhotos]);

  const report = useCallback(async (photoId: string, reason: PhotoReportReason) => {
    await reportParkPhoto(photoId, reason);
  }, []);

  const featuredPhoto = photos.length > 0 ? photos[0] : null;

  return { photos, featuredPhoto, loading, upload, vote, deletePhoto: deletePhotoFn, report, refresh: fetchPhotos };
}

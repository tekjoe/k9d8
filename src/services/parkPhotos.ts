import { supabase } from '../lib/supabase';
import { readFileForUpload } from '../utils/fileUpload';
import type { ParkPhoto, PhotoReportReason } from '../types/database';

export async function uploadParkPhoto(
  userId: string,
  parkId: string,
  uri: string,
): Promise<ParkPhoto> {
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.jpg`;

  const fileData = await readFileForUpload(uri);

  const { error: uploadError } = await supabase.storage
    .from('park-photos')
    .upload(filePath, fileData, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('park-photos')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('park_photos')
    .insert({
      park_id: parkId,
      user_id: userId,
      photo_url: urlData.publicUrl,
    })
    .select('*, user:profiles(id, display_name, avatar_url)')
    .single();

  if (error) throw error;
  return { ...data, vote_count: 0, user_has_voted: false } as ParkPhoto;
}

export async function getParkPhotos(
  parkId: string,
  userId?: string,
): Promise<ParkPhoto[]> {
  const { data: photos, error } = await supabase
    .from('park_photos')
    .select('*, user:profiles(id, display_name, avatar_url)')
    .eq('park_id', parkId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch vote counts
  const { data: votes } = await supabase
    .from('park_photo_votes')
    .select('photo_id')
    .in('photo_id', photos.map((p: any) => p.id));

  // Count votes per photo
  const voteCounts: Record<string, number> = {};
  const userVotes = new Set<string>();

  for (const vote of votes ?? []) {
    voteCounts[vote.photo_id] = (voteCounts[vote.photo_id] || 0) + 1;
  }

  // Check which photos the current user has voted on
  if (userId) {
    const { data: myVotes } = await supabase
      .from('park_photo_votes')
      .select('photo_id')
      .eq('user_id', userId)
      .in('photo_id', photos.map((p: any) => p.id));

    for (const v of myVotes ?? []) {
      userVotes.add(v.photo_id);
    }
  }

  const enriched: ParkPhoto[] = photos.map((p: any) => ({
    ...p,
    vote_count: voteCounts[p.id] || 0,
    user_has_voted: userVotes.has(p.id),
  }));

  // Sort by votes descending, then by date
  enriched.sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));

  return enriched;
}

export async function voteParkPhoto(photoId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('park_photo_votes')
    .insert({ photo_id: photoId, user_id: user.id });

  if (error) {
    if (error.code === '23505') {
      // Already voted — remove vote (toggle)
      await unvoteParkPhoto(photoId);
      return;
    }
    throw error;
  }
}

export async function unvoteParkPhoto(photoId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('park_photo_votes')
    .delete()
    .eq('photo_id', photoId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function deleteParkPhoto(photoId: string, photoUrl: string): Promise<void> {
  // Extract storage path from public URL
  const match = photoUrl.match(/park-photos\/(.+)$/);
  if (match) {
    await supabase.storage.from('park-photos').remove([match[1]]);
  }

  const { error } = await supabase
    .from('park_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;
}

/**
 * Get the top-voted photo URL for each park in a batch.
 * Returns a map of parkId -> photo_url.
 */
export async function getFeaturedPhotosForParks(
  parkIds: string[],
): Promise<Record<string, string>> {
  if (parkIds.length === 0) return {};

  // Get all photos for these parks
  const { data: photos, error } = await supabase
    .from('park_photos')
    .select('id, park_id, photo_url')
    .in('park_id', parkIds);

  if (error || !photos || photos.length === 0) return {};

  // Get vote counts
  const photoIds = photos.map((p: any) => p.id);
  const { data: votes } = await supabase
    .from('park_photo_votes')
    .select('photo_id')
    .in('photo_id', photoIds);

  const voteCounts: Record<string, number> = {};
  for (const v of votes ?? []) {
    voteCounts[v.photo_id] = (voteCounts[v.photo_id] || 0) + 1;
  }

  // Group by park, pick top-voted photo per park
  const parkPhotos: Record<string, { photo_url: string; votes: number }> = {};
  for (const p of photos) {
    const vc = voteCounts[p.id] || 0;
    if (!parkPhotos[p.park_id] || vc > parkPhotos[p.park_id].votes) {
      parkPhotos[p.park_id] = { photo_url: p.photo_url, votes: vc };
    }
  }

  const result: Record<string, string> = {};
  for (const [parkId, data] of Object.entries(parkPhotos)) {
    result[parkId] = data.photo_url;
  }
  return result;
}

export async function reportParkPhoto(
  photoId: string,
  reason: PhotoReportReason,
  details?: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('park_photo_reports').insert({
    reporter_id: user.id,
    photo_id: photoId,
    reason,
    details: details || null,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already reported this photo.');
    }
    throw error;
  }
}

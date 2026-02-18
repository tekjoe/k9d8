import { supabase } from '../lib/supabase';
import type { PlayDate, PlayDateRSVP, RSVPStatus, Database } from '../types/database';
import { isPlaydateActive, isPlaydateExpired } from '../utils/playdates';

type PlayDateInsert = Database['public']['Tables']['play_dates']['Insert'];
type PlayDateUpdate = Database['public']['Tables']['play_dates']['Update'];

const PLAY_DATE_SELECT = `
  *,
  organizer:profiles!organizer_id (*),
  park:parks!park_id (*),
  rsvps:play_date_rsvps (
    *,
    profile:profiles!user_id (*),
    dog:dogs!dog_id (*)
  )
`;

/**
 * Fetches upcoming scheduled play dates, optionally filtered by park.
 */
export async function getPlayDates(parkId?: string): Promise<PlayDate[]> {
  let query = supabase
    .from('play_dates')
    .select(PLAY_DATE_SELECT)
    .eq('status', 'scheduled')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true });

  if (parkId) {
    query = query.eq('park_id', parkId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as PlayDate[];
}

/**
 * Fetches a single play date by its ID with all joins.
 */
export async function getPlayDateById(id: string): Promise<PlayDate> {
  const { data, error } = await supabase
    .from('play_dates')
    .select(PLAY_DATE_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as PlayDate;
}

/**
 * Fetches play dates where the user is the organizer OR has an RSVP.
 */
export async function getMyPlayDates(userId: string): Promise<PlayDate[]> {
  // Fetch upcoming play dates organized by the user
  const { data: organized, error: orgError } = await supabase
    .from('play_dates')
    .select(PLAY_DATE_SELECT)
    .eq('organizer_id', userId)
    .eq('status', 'scheduled')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true });

  if (orgError) throw orgError;

  // Fetch play date IDs where the user has an RSVP
  const { data: rsvpRows, error: rsvpError } = await supabase
    .from('play_date_rsvps')
    .select('play_date_id')
    .eq('user_id', userId);

  if (rsvpError) throw rsvpError;

  const rsvpPlayDateIds = (rsvpRows ?? []).map((r) => r.play_date_id);
  const organizedIds = new Set((organized ?? []).map((pd) => pd.id));

  // Filter out IDs already in the organized set
  const additionalIds = rsvpPlayDateIds.filter((id) => !organizedIds.has(id));

  let rsvpPlayDates: PlayDate[] = [];
  if (additionalIds.length > 0) {
    const { data: rsvpData, error: rsvpDataError } = await supabase
      .from('play_dates')
      .select(PLAY_DATE_SELECT)
      .in('id', additionalIds)
      .eq('status', 'scheduled')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    if (rsvpDataError) throw rsvpDataError;
    rsvpPlayDates = (rsvpData ?? []) as PlayDate[];
  }

  // Merge and sort by starts_at
  const all = [...(organized ?? []) as PlayDate[], ...rsvpPlayDates];
  all.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return all;
}

/**
 * Creates a new play date.
 */
export async function createPlayDate(data: PlayDateInsert): Promise<PlayDate> {
  const { data: playDate, error } = await supabase
    .from('play_dates')
    .insert(data)
    .select(PLAY_DATE_SELECT)
    .single();

  if (error) throw error;
  return playDate as PlayDate;
}

/**
 * Updates an existing play date.
 */
export async function updatePlayDate(
  id: string,
  data: PlayDateUpdate,
): Promise<PlayDate> {
  const { data: playDate, error } = await supabase
    .from('play_dates')
    .update(data)
    .eq('id', id)
    .select(PLAY_DATE_SELECT)
    .single();

  if (error) throw error;
  return playDate as PlayDate;
}

/**
 * Cancels a play date by setting its status to 'cancelled'.
 */
export async function cancelPlayDate(id: string): Promise<PlayDate> {
  const { data: playDate, error } = await supabase
    .from('play_dates')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select(PLAY_DATE_SELECT)
    .single();

  if (error) throw error;
  return playDate as PlayDate;
}

/**
 * Upserts an RSVP to a play date.
 * If the user already has an RSVP for this play date, it will be updated.
 */
export async function rsvpToPlayDate(
  playDateId: string,
  userId: string,
  dogId: string,
  status: RSVPStatus = 'going',
): Promise<PlayDateRSVP> {
  const { data: rsvp, error } = await supabase
    .from('play_date_rsvps')
    .upsert(
      {
        play_date_id: playDateId,
        user_id: userId,
        dog_id: dogId,
        status,
      },
      { onConflict: 'play_date_id,dog_id' },
    )
    .select(`
      *,
      profile:profiles!user_id (*),
      dog:dogs!dog_id (*)
    `)
    .single();

  if (error) throw error;
  return rsvp as PlayDateRSVP;
}

/**
 * Cancels (deletes) an RSVP.
 */
export async function cancelRSVP(rsvpId: string): Promise<void> {
  const { error } = await supabase
    .from('play_date_rsvps')
    .delete()
    .eq('id', rsvpId);

  if (error) throw error;
}

/**
 * Get a play date with real-time expiration check.
 * If the play date is scheduled but has ended, it will be expired.
 */
export async function getPlaydateWithExpirationCheck(id: string): Promise<PlayDate> {
  const { data, error } = await supabase
    .from('play_dates')
    .select(PLAY_DATE_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;

  const playDate = data as PlayDate;

  // Application-level expiration check
  if (playDate && playDate.status === 'scheduled' && isPlaydateExpired(playDate)) {
    // Trigger server-side expiration via RPC
    await supabase.rpc('force_expire_play_date', {
      play_date_id: id,
    });

    // Return updated data
    return {
      ...playDate,
      status: 'completed',
    } as PlayDate;
  }

  return playDate;
}

/**
 * RSVP to play date with expiration check.
 * Throws error if play date has already ended.
 */
export async function rsvpToPlaydateWithCheck(
  playDateId: string,
  userId: string,
  dogId: string,
  status: RSVPStatus = 'going'
): Promise<PlayDateRSVP> {
  // First check if play date is still active
  const { data: playDate, error: fetchError } = await supabase
    .from('play_dates')
    .select('status, ends_at')
    .eq('id', playDateId)
    .single();

  if (fetchError) throw fetchError;

  if (!isPlaydateActive(playDate)) {
    throw new Error('This play date has ended. You cannot RSVP anymore.');
  }

  // Proceed with RSVP
  return rsvpToPlayDate(playDateId, userId, dogId, status);
}

/**
 * Get active play dates only (scheduled and not expired).
 */
export async function getActivePlaydates(parkId?: string): Promise<PlayDate[]> {
  let query = supabase
    .from('play_dates')
    .select(PLAY_DATE_SELECT)
    .eq('status', 'scheduled')
    .gt('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: true });

  if (parkId) {
    query = query.eq('park_id', parkId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as PlayDate[];
}

/**
 * Get past/completed play dates.
 */
export async function getPastPlaydates(
  userId?: string,
  limit: number = 20
): Promise<PlayDate[]> {
  let query = supabase
    .from('play_dates')
    .select(PLAY_DATE_SELECT)
    .or('status.eq.completed,ends_at.lt.now()')
    .order('ends_at', { ascending: false })
    .limit(limit);

  if (userId) {
    // Get play dates where user is organizer OR has an RSVP
    const { data: rsvpRows } = await supabase
      .from('play_date_rsvps')
      .select('play_date_id')
      .eq('user_id', userId);

    const rsvpIds = (rsvpRows ?? []).map((r) => r.play_date_id);

    query = query.or(`organizer_id.eq.${userId},id.in.(${rsvpIds.join(',')})`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as PlayDate[];
}

/**
 * Get all play dates for a user (both upcoming and past).
 */
export async function getAllPlaydatesForUser(userId: string): Promise<{
  upcoming: PlayDate[];
  past: PlayDate[];
}> {
  // Fetch play dates organized by the user
  const { data: organized, error: orgError } = await supabase
    .from('play_dates')
    .select(PLAY_DATE_SELECT)
    .eq('organizer_id', userId)
    .order('starts_at', { ascending: true });

  if (orgError) throw orgError;

  // Fetch play date IDs where the user has an RSVP
  const { data: rsvpRows, error: rsvpError } = await supabase
    .from('play_date_rsvps')
    .select('play_date_id')
    .eq('user_id', userId);

  if (rsvpError) throw rsvpError;

  const rsvpPlayDateIds = (rsvpRows ?? []).map((r) => r.play_date_id);
  const organizedIds = new Set((organized ?? []).map((pd) => pd.id));

  // Filter out IDs already in the organized set
  const additionalIds = rsvpPlayDateIds.filter((id) => !organizedIds.has(id));

  let rsvpPlayDates: PlayDate[] = [];
  if (additionalIds.length > 0) {
    const { data: rsvpData, error: rsvpDataError } = await supabase
      .from('play_dates')
      .select(PLAY_DATE_SELECT)
      .in('id', additionalIds)
      .order('starts_at', { ascending: true });

    if (rsvpDataError) throw rsvpDataError;
    rsvpPlayDates = (rsvpData ?? []) as PlayDate[];
  }

  // Merge all play dates
  const all = [...(organized ?? []) as PlayDate[], ...rsvpPlayDates];

  // Filter into upcoming and past
  const upcoming: PlayDate[] = [];
  const past: PlayDate[] = [];

  for (const playDate of all) {
    if (isPlaydateActive(playDate) || (playDate.status === 'scheduled' && !isPlaydateExpired(playDate))) {
      upcoming.push(playDate);
    } else {
      past.push(playDate);
    }
  }

  // Sort upcoming by start time (ascending), past by end time (descending)
  upcoming.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  past.sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime());

  return { upcoming, past };
}

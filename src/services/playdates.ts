import { supabase } from '../lib/supabase';
import type { PlayDate, PlayDateRSVP, RSVPStatus, Database } from '../types/database';

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
      { onConflict: 'play_date_id,user_id' },
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

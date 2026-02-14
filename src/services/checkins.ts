import { supabase } from '../lib/supabase';
import type { CheckIn } from '../types/database';

/**
 * Creates a check-in record for a user at a park, along with the associated
 * check_in_dogs records for each dog they are bringing.
 *
 * Uses a transaction-like pattern: insert check_in first, then insert all
 * check_in_dogs. If the second step fails, the check_in is cleaned up.
 */
export async function checkIn(
  userId: string,
  parkId: string,
  dogIds: string[],
): Promise<CheckIn> {
  const { data: checkInRecord, error: checkInError } = await supabase
    .from('check_ins')
    .insert({ user_id: userId, park_id: parkId })
    .select()
    .single();

  if (checkInError) throw checkInError;

  if (dogIds.length > 0) {
    const checkInDogRows = dogIds.map((dogId) => ({
      check_in_id: checkInRecord.id,
      dog_id: dogId,
    }));

    const { error: dogsError } = await supabase
      .from('check_in_dogs')
      .insert(checkInDogRows);

    if (dogsError) {
      // Clean up the check_in record if dog insertion fails
      await supabase.from('check_ins').delete().eq('id', checkInRecord.id);
      throw dogsError;
    }
  }

  // Fire-and-forget: notify friends about check-in
  supabase.functions
    .invoke('friend-checkin-notification', {
      body: { user_id: userId, park_id: parkId },
    })
    .catch(console.error);

  return checkInRecord as CheckIn;
}

/**
 * Checks a user out by setting checked_out_at to the current time.
 */
export async function checkOut(checkInId: string): Promise<void> {
  const { error } = await supabase
    .from('check_ins')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('id', checkInId);

  if (error) throw error;
}

/**
 * Gets all active check-ins at a park (where checked_out_at IS NULL).
 * Includes profile information and dog details for each check-in.
 */
export async function getActiveCheckIns(parkId: string): Promise<CheckIn[]> {
  const { data: checkIns, error: checkInsError } = await supabase
    .from('check_ins')
    .select(
      `
      *,
      profile:profiles!user_id(*),
      check_in_dogs(
        *,
        dog:dogs(*)
      )
    `,
    )
    .eq('park_id', parkId)
    .is('checked_out_at', null)
    .order('checked_in_at', { ascending: false });

  if (checkInsError) throw checkInsError;

  // Map the check_in_dogs join into a flat dogs array on each check-in
  const enriched: CheckIn[] = (checkIns ?? []).map((ci) => {
    const checkInDogs = (ci as Record<string, unknown>).check_in_dogs as
      | Array<{ dog: CheckIn['dogs'] extends (infer D)[] | undefined ? D : never }>
      | undefined;

    return {
      id: ci.id,
      user_id: ci.user_id,
      park_id: ci.park_id,
      checked_in_at: ci.checked_in_at,
      checked_out_at: ci.checked_out_at,
      profile: ci.profile ?? undefined,
      dogs: checkInDogs
        ? checkInDogs
            .map((cid) => cid.dog)
            .filter((d): d is NonNullable<typeof d> => d != null)
        : [],
    } as CheckIn;
  });

  return enriched;
}

/**
 * Gets the current user's active check-in, if any.
 * Returns null if the user is not currently checked in anywhere.
 */
export async function getUserActiveCheckIn(
  userId: string,
): Promise<CheckIn | null> {
  const { data, error } = await supabase
    .from('check_ins')
    .select(
      `
      *,
      profile:profiles!user_id(*),
      check_in_dogs(
        *,
        dog:dogs(*)
      )
    `,
    )
    .eq('user_id', userId)
    .is('checked_out_at', null)
    .order('checked_in_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const checkInDogs = (data as Record<string, unknown>).check_in_dogs as
    | Array<{ dog: CheckIn['dogs'] extends (infer D)[] | undefined ? D : never }>
    | undefined;

  return {
    id: data.id,
    user_id: data.user_id,
    park_id: data.park_id,
    checked_in_at: data.checked_in_at,
    checked_out_at: data.checked_out_at,
    profile: data.profile ?? undefined,
    dogs: checkInDogs
      ? checkInDogs
          .map((cid) => cid.dog)
          .filter((d): d is NonNullable<typeof d> => d != null)
      : [],
  } as CheckIn;
}

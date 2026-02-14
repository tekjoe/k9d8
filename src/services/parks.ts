import { supabase } from '../lib/supabase';
import type { Park } from '../types/database';

/**
 * Fetches all parks from the database.
 */
export async function getAllParks(): Promise<Park[]> {
  const { data, error } = await supabase
    .from('parks')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Park[];
}

/**
 * Fetches parks within a bounding box around the given coordinates.
 * Uses a simple lat/lng range filter instead of PostGIS.
 *
 * @param lat - Center latitude
 * @param lng - Center longitude
 * @param radiusDegrees - Half-width of the bounding box in degrees (default ~11 km)
 */
export async function getParksNearby(
  lat: number,
  lng: number,
  radiusDegrees: number = 0.1
): Promise<Park[]> {
  const minLat = lat - radiusDegrees;
  const maxLat = lat + radiusDegrees;
  const minLng = lng - radiusDegrees;
  const maxLng = lng + radiusDegrees;

  const { data, error } = await supabase
    .from('parks')
    .select('*')
    .gte('latitude', minLat)
    .lte('latitude', maxLat)
    .gte('longitude', minLng)
    .lte('longitude', maxLng)
    .order('name');

  if (error) throw error;
  return data as Park[];
}

/**
 * Fetches the count of active check-ins (dogs) for all parks.
 * Returns a map of parkId -> dog count.
 */
export async function getActiveCheckInCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('check_ins')
    .select(`
      park_id,
      check_in_dogs(count)
    `)
    .is('checked_out_at', null);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const parkId = row.park_id;
    const dogCount =
      Array.isArray(row.check_in_dogs) && row.check_in_dogs.length > 0
        ? (row.check_in_dogs[0] as { count: number }).count
        : 0;
    counts[parkId] = (counts[parkId] || 0) + dogCount;
  }
  return counts;
}

/**
 * Fetches a single park by its ID.
 */
export async function getParkById(id: string): Promise<Park> {
  const { data, error } = await supabase
    .from('parks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Park;
}

/**
 * Fetches a single park by a partial ID (first 8 characters of UUID).
 * Used for SEO-friendly slug URLs like /parks/sunnyside-dog-park-9566f589
 * 
 * Since Supabase/PostgREST doesn't support LIKE on UUID columns directly,
 * we fetch all parks and filter client-side. This is acceptable because:
 * 1. Parks list is typically small (hundreds, not thousands)
 * 2. This query is cached by useParks hook in most cases
 * 3. The alternative (RPC function) adds complexity
 */
export async function getParkByShortId(shortId: string): Promise<Park | null> {
  const normalizedShortId = shortId.toLowerCase();
  
  const { data, error } = await supabase
    .from('parks')
    .select('*');

  if (error) {
    console.error('[getParkByShortId] Supabase error:', error);
    throw error;
  }
  
  // Find the park whose ID starts with the short ID
  const park = data?.find(p => p.id.toLowerCase().startsWith(normalizedShortId));
  
  console.log('[getParkByShortId] Searching for:', normalizedShortId, 
    'Found:', park ? `${park.name} (${park.id})` : 'none',
    'Total parks:', data?.length ?? 0);
  
  return park ?? null;
}

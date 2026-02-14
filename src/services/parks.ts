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

import { supabase } from '../lib/supabase';
import type { Park } from '../types/database';

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

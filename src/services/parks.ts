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
 * Used for SEO-friendly slug URLs like /dog-parks/sunnyside-dog-park-9566f589
 * 
 * Since Supabase/PostgREST doesn't support LIKE on UUID columns directly,
 * we fetch all parks and filter client-side. This is acceptable because:
 * 1. Parks list is typically small (hundreds, not thousands)
 * 2. This query is cached by useParks hook in most cases
 * 3. The alternative (RPC function) adds complexity
 * 
 * @deprecated Use getParkBySlug instead
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
  
  const park = data?.find(p => p.id.toLowerCase().startsWith(normalizedShortId));
  
  console.log('[getParkByShortId] Searching for:', normalizedShortId, 
    'Found:', park ? `${park.name} (${park.id})` : 'none',
    'Total parks:', data?.length ?? 0);
  
  return park ?? null;
}

/**
 * Fetches a single park by its URL slug (slugified name) and optional state.
 * Matches against a lowercase, hyphenated version of the park name.
 * If state is provided, also filters by state abbreviation.
 */
export async function getParkBySlug(slug: string, state?: string): Promise<Park | null> {
  const normalizedSlug = slug.toLowerCase();
  
  let query = supabase
    .from('parks')
    .select('*');
  
  if (state) {
    const abbrev = stateNameToAbbrev(state);
    if (abbrev) {
      query = query.or(`state.ilike.${abbrev}%,city.eq.${abbrev}`);
    }
  }
  
  const { data, error } = await query.order('name').limit(1000);

  if (error) {
    console.error('[getParkBySlug] Supabase error:', error);
    throw error;
  }
  
  const park = data?.find(p => {
    const parkSlug = p.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return parkSlug === normalizedSlug;
  });
  
  console.log('[getParkBySlug] Searching for:', normalizedSlug, 'state:', state,
    'Found:', park ? `${park.name} (${park.id})` : 'none',
    'Total parks:', data?.length ?? 0);
  
  return park ?? null;
}

/**
 * Fetches distinct city/state combinations with park counts.
 * Used for the dog parks directory index page.
 */
export async function getParkCityCounts(): Promise<
  Array<{ city: string; state: string; count: number }>
> {
  const { data, error } = await supabase
    .from('parks')
    .select('city, state')
    .not('city', 'is', null)
    .not('state', 'is', null);

  if (error) throw error;

  const counts = new Map<string, { city: string; state: string; count: number }>();
  for (const row of data ?? []) {
    if (!row.city || !row.state) continue;
    const key = `${row.city}|${row.state}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, { city: row.city, state: row.state, count: 1 });
    }
  }

  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

/**
 * Fetches parks for a specific city (case-insensitive match).
 */
export async function getParksByCity(city: string): Promise<Park[]> {
  const { data, error } = await supabase
    .from('parks')
    .select('*')
    .ilike('city', city)
    .order('name');

  if (error) throw error;
  return data as Park[];
}

/** Maps a 2-letter US state abbreviation to its full name. */
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

/**
 * Extracts a 2-letter state abbreviation from a park row.
 * Handles messy data: "WI 53711", zip-only with swapped city/state, or just "IL".
 */
function extractStateAbbrev(row: { city?: string | null; state?: string | null }): string | null {
  const st = row.state?.trim() ?? '';
  // "WI 53711" or "WI"
  if (/^[A-Z]{2}(\s|$)/.test(st)) return st.slice(0, 2);
  // Zip-only — city column might hold the state abbrev (data has city/state swapped)
  const city = row.city?.trim() ?? '';
  if (/^\d+$/.test(st) && /^[A-Z]{2}$/.test(city)) return city;
  return null;
}

/** Returns the full state name for a 2-letter abbreviation. */
export function stateAbbrevToName(abbrev: string): string {
  return STATE_NAMES[abbrev.toUpperCase()] ?? abbrev;
}

/** Returns the 2-letter abbreviation for a full state name. */
export function stateNameToAbbrev(name: string): string | null {
  const entry = Object.entries(STATE_NAMES).find(
    ([, v]) => v.toLowerCase() === name.toLowerCase()
  );
  return entry ? entry[0] : null;
}

/**
 * Extracts a state slug from a park's state/city fields.
 * Returns full state slug like "wisconsin" instead of abbreviation "wi".
 * Handles messy data like "WI 53711" or swapped city/state.
 */
export function getParkStateSlug(park: { city?: string | null; state?: string | null }): string | null {
  const st = park.state?.trim() ?? '';
  // "WI" or "WI 53711"
  if (/^[A-Z]{2}(\s|$)/.test(st)) {
    const abbrev = st.slice(0, 2);
    const stateName = STATE_NAMES[abbrev];
    return stateName ? stateName.toLowerCase().replace(/\s+/g, '-') : null;
  }
  // Zip-only: city might hold state abbrev (swapped data)
  const city = park.city?.trim() ?? '';
  if (/^\d+$/.test(st) && /^[A-Z]{2}$/.test(city)) {
    const stateName = STATE_NAMES[city];
    return stateName ? stateName.toLowerCase().replace(/\s+/g, '-') : null;
  }
  return null;
}

/**
 * Fetches distinct states with total park counts.
 * Used for the dog parks directory "Browse by State" section.
 * Uses pagination to fetch all parks (API has 1000 row limit per request).
 */
export async function getParkStateCounts(): Promise<
  Array<{ state: string; count: number }>
> {
  const allRows: { city: string | null; state: string | null }[] = [];
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  // Fetch all parks in batches
  while (hasMore) {
    const { data, error } = await supabase
      .from('parks')
      .select('city, state')
      .not('state', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (error) throw error;
    
    if (data && data.length > 0) {
      allRows.push(...data);
      offset += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  const counts = new Map<string, number>();
  for (const row of allRows) {
    const abbrev = extractStateAbbrev(row);
    if (!abbrev || !STATE_NAMES[abbrev]) continue;
    const fullName = STATE_NAMES[abbrev];
    counts.set(fullName, (counts.get(fullName) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => a.state.localeCompare(b.state)); // Sort alphabetically
}

/**
 * Fetches parks for a specific state.
 * Accepts a full state name (e.g. "Minnesota") and matches by abbreviation
 * against both the state and city columns (handles swapped data).
 */
export async function getParksByState(stateName: string): Promise<Park[]> {
  const abbrev = stateNameToAbbrev(stateName);
  if (!abbrev) return [];

  // Query parks where state starts with the abbreviation OR city equals the abbreviation
  // (handles both "WI 53711" and swapped rows where city="MN", state="55008")
  const { data, error } = await supabase
    .from('parks')
    .select('*')
    .or(`state.ilike.${abbrev}%,city.eq.${abbrev}`)
    .order('name');

  if (error) throw error;
  return data as Park[];
}

/**
 * Fetches a few featured parks (highest activity or random selection).
 * Used for the directory page "Featured Parks" section.
 */
export async function getFeaturedParks(limit = 3): Promise<Park[]> {
  const { data, error } = await supabase
    .from('parks')
    .select('*')
    .not('image_url', 'is', null)
    .limit(limit);

  if (error) throw error;
  return data as Park[];
}

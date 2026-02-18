/**
 * Generate a URL-friendly slug from a park name
 * Example: "Sunnyside Dog Park" -> "sunnyside-dog-park"
 */
export function generateParkSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a URL-friendly slug for a park with state
 * Example: "Sunnyside Dog Park", "Minnesota" -> "minnesota/sunnyside-dog-park"
 */
export function generateParkSlugWithState(name: string, state: string): string {
  const stateSlug = state
    .toLowerCase()
    .replace(/\s+/g, '-');
  return `${stateSlug}/${generateParkSlug(name)}`;
}

/**
 * Extract the slug from a park URL
 * Example: "stoneridge-park" -> "stoneridge-park"
 */
export function extractSlugFromUrl(slug: string): string | null {
  if (!slug || slug.length < 2) return null;
  return slug.toLowerCase();
}

/**
 * @deprecated Use extractSlugFromUrl instead
 * Extract the short ID (first 8 chars of UUID) from a slugified URL
 * Example: "sunnyside-dog-park-9566f589" -> "9566f589"
 * 
 * The short ID is always the last 8 characters of the slug (after the final hyphen)
 * and should be a valid hex string.
 */
export function extractShortIdFromSlug(slug: string): string | null {
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  if (lastPart && /^[a-f0-9]{8}$/i.test(lastPart)) {
    return lastPart.toLowerCase();
  }
  
  return null;
}

/**
 * Check if a string is a valid full UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Parse a URL parameter that could be either a full UUID or a slug
 * Returns: { type: 'uuid', id: string } | { type: 'slug', slug: string } | { type: 'invalid' }
 */
export function parseSlugOrId(slugOrId: string): 
  | { type: 'uuid'; id: string }
  | { type: 'slug'; slug: string }
  | { type: 'invalid' } {
  
  if (!slugOrId) {
    return { type: 'invalid' };
  }
  
  if (isValidUUID(slugOrId)) {
    return { type: 'uuid', id: slugOrId };
  }
  
  const slug = extractSlugFromUrl(slugOrId);
  if (slug) {
    return { type: 'slug', slug };
  }
  
  return { type: 'invalid' };
}

/**
 * @deprecated Use parseSlugOrId and getParkByShortId instead
 * Find a park ID from a slug by matching the short ID portion
 * This requires the full park list to match against
 */
export function findParkIdFromSlug(slug: string, parkIds: string[]): string | null {
  const shortId = extractShortIdFromSlug(slug);
  if (!shortId) return null;
  
  // Find the park whose ID starts with this short ID
  const matchingId = parkIds.find(id => id.toLowerCase().startsWith(shortId));
  
  return matchingId || null;
}

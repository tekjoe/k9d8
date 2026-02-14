/**
 * Generate a URL-friendly slug from a park name and ID
 * Example: "Sunnyside Dog Park" + "9566f589-cdeb-4ea4-a6d2-d8e1c93c0d60"
 *          -> "sunnyside-dog-park-9566f589"
 */
export function generateParkSlug(name: string, id: string): string {
  // Take first 8 characters of UUID for uniqueness
  const shortId = id.split('-')[0];
  
  // Convert name to lowercase and replace spaces/special chars with hyphens
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
  
  return `${slug}-${shortId}`;
}

/**
 * Extract the short ID (first 8 chars of UUID) from a slugified URL
 * Example: "sunnyside-dog-park-9566f589" -> "9566f589"
 * 
 * The short ID is always the last 8 characters of the slug (after the final hyphen)
 * and should be a valid hex string.
 */
export function extractShortIdFromSlug(slug: string): string | null {
  // The short ID is the last segment, which should be 8 hex characters
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  // Validate it looks like a short UUID (8 hex characters)
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
 * Returns: { type: 'uuid', id: string } | { type: 'slug', shortId: string } | { type: 'invalid' }
 */
export function parseSlugOrId(slugOrId: string): 
  | { type: 'uuid'; id: string }
  | { type: 'slug'; shortId: string }
  | { type: 'invalid' } {
  
  if (!slugOrId) {
    return { type: 'invalid' };
  }
  
  // Check if it's a full UUID
  if (isValidUUID(slugOrId)) {
    return { type: 'uuid', id: slugOrId };
  }
  
  // Try to extract short ID from slug
  const shortId = extractShortIdFromSlug(slugOrId);
  if (shortId) {
    return { type: 'slug', shortId };
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

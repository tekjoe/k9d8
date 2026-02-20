import {
  generateParkSlug,
  generateParkSlugWithState,
  extractSlugFromUrl,
  extractShortIdFromSlug,
  isValidUUID,
  parseSlugOrId,
  findParkIdFromSlug,
} from '../../src/utils/slug';

describe('slug utils', () => {
  describe('generateParkSlug', () => {
    it('converts name to lowercase hyphenated slug', () => {
      expect(generateParkSlug('Sunnyside Dog Park')).toBe('sunnyside-dog-park');
    });

    it('strips special characters', () => {
      expect(generateParkSlug("St. Mark's Dog Run")).toBe('st-marks-dog-run');
    });

    it('collapses multiple spaces', () => {
      expect(generateParkSlug('Loring   Park')).toBe('loring-park');
    });

    it('collapses multiple hyphens', () => {
      expect(generateParkSlug('Off---Leash Area')).toBe('off-leash-area');
    });

    it('trims leading and trailing whitespace', () => {
      expect(generateParkSlug('  Central Park  ')).toBe('central-park');
    });

    it('strips leading/trailing hyphens', () => {
      expect(generateParkSlug('-Dog Park-')).toBe('dog-park');
    });

    it('handles empty string', () => {
      expect(generateParkSlug('')).toBe('');
    });
  });

  describe('generateParkSlugWithState', () => {
    it('combines state and name slugs', () => {
      expect(generateParkSlugWithState('Sunnyside Dog Park', 'Minnesota')).toBe(
        'minnesota/sunnyside-dog-park'
      );
    });

    it('handles multi-word state names', () => {
      expect(generateParkSlugWithState('Central Park', 'New York')).toBe(
        'new-york/central-park'
      );
    });
  });

  describe('extractSlugFromUrl', () => {
    it('returns lowercase slug', () => {
      expect(extractSlugFromUrl('Sunnyside-Park')).toBe('sunnyside-park');
    });

    it('returns null for empty string', () => {
      expect(extractSlugFromUrl('')).toBeNull();
    });

    it('returns null for single char', () => {
      expect(extractSlugFromUrl('a')).toBeNull();
    });

    it('returns slug for valid input', () => {
      expect(extractSlugFromUrl('loring-park')).toBe('loring-park');
    });
  });

  describe('extractShortIdFromSlug', () => {
    it('extracts 8-char hex from end of slug', () => {
      expect(extractShortIdFromSlug('sunnyside-dog-park-9566f589')).toBe('9566f589');
    });

    it('returns null when last segment is not hex', () => {
      expect(extractShortIdFromSlug('sunnyside-dog-park')).toBeNull();
    });

    it('returns null when hex is wrong length', () => {
      expect(extractShortIdFromSlug('park-9566f5')).toBeNull();
    });

    it('handles uppercase hex', () => {
      expect(extractShortIdFromSlug('park-AABB1122')).toBe('aabb1122');
    });
  });

  describe('isValidUUID', () => {
    it('returns true for valid UUID', () => {
      expect(isValidUUID('9566f589-1234-5678-abcd-ef0123456789')).toBe(true);
    });

    it('returns false for short string', () => {
      expect(isValidUUID('9566f589')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidUUID('')).toBe(false);
    });

    it('returns false for slug', () => {
      expect(isValidUUID('sunnyside-dog-park')).toBe(false);
    });

    it('handles uppercase UUID', () => {
      expect(isValidUUID('9566F589-1234-5678-ABCD-EF0123456789')).toBe(true);
    });
  });

  describe('parseSlugOrId', () => {
    it('returns uuid type for valid UUID', () => {
      const result = parseSlugOrId('9566f589-1234-5678-abcd-ef0123456789');
      expect(result).toEqual({ type: 'uuid', id: '9566f589-1234-5678-abcd-ef0123456789' });
    });

    it('returns slug type for valid slug', () => {
      const result = parseSlugOrId('sunnyside-dog-park');
      expect(result).toEqual({ type: 'slug', slug: 'sunnyside-dog-park' });
    });

    it('returns invalid for empty string', () => {
      expect(parseSlugOrId('')).toEqual({ type: 'invalid' });
    });

    it('returns invalid for single char', () => {
      // extractSlugFromUrl returns null for length < 2
      expect(parseSlugOrId('a')).toEqual({ type: 'invalid' });
    });
  });

  describe('findParkIdFromSlug', () => {
    const parkIds = [
      '9566f589-1234-5678-abcd-ef0123456789',
      'aabb1122-5678-9abc-def0-123456789abc',
    ];

    it('finds matching park by short ID', () => {
      expect(findParkIdFromSlug('sunnyside-dog-park-9566f589', parkIds)).toBe(
        '9566f589-1234-5678-abcd-ef0123456789'
      );
    });

    it('returns null when no match', () => {
      expect(findParkIdFromSlug('sunnyside-dog-park-deadbeef', parkIds)).toBeNull();
    });

    it('returns null when slug has no short ID', () => {
      expect(findParkIdFromSlug('sunnyside-dog-park', parkIds)).toBeNull();
    });
  });
});

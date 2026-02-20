jest.mock('../../src/lib/supabase');

import {
  boundingBoxFromCenter,
  stateAbbrevToName,
  stateNameToAbbrev,
  getParkStateSlug,
} from '../../src/services/parks';

describe('parks pure functions', () => {
  describe('boundingBoxFromCenter', () => {
    it('returns a bounding box around the given center', () => {
      const box = boundingBoxFromCenter(44.98, -93.27, 10);
      expect(box.minLat).toBeLessThan(44.98);
      expect(box.maxLat).toBeGreaterThan(44.98);
      expect(box.minLng).toBeLessThan(-93.27);
      expect(box.maxLng).toBeGreaterThan(-93.27);
    });

    it('returns a wider box for larger radius', () => {
      const small = boundingBoxFromCenter(44.98, -93.27, 5);
      const large = boundingBoxFromCenter(44.98, -93.27, 20);
      expect(large.maxLat - large.minLat).toBeGreaterThan(small.maxLat - small.minLat);
      expect(large.maxLng - large.minLng).toBeGreaterThan(small.maxLng - small.minLng);
    });

    it('returns symmetric box around center', () => {
      const box = boundingBoxFromCenter(44.98, -93.27, 10);
      const latDelta = box.maxLat - 44.98;
      expect(44.98 - box.minLat).toBeCloseTo(latDelta, 5);
    });

    it('returns zero-size box for zero radius', () => {
      const box = boundingBoxFromCenter(44.98, -93.27, 0);
      expect(box.minLat).toBe(44.98);
      expect(box.maxLat).toBe(44.98);
      expect(box.minLng).toBe(-93.27);
      expect(box.maxLng).toBe(-93.27);
    });
  });

  describe('stateAbbrevToName', () => {
    it('converts MN to Minnesota', () => {
      expect(stateAbbrevToName('MN')).toBe('Minnesota');
    });

    it('converts lowercase mn to Minnesota', () => {
      expect(stateAbbrevToName('mn')).toBe('Minnesota');
    });

    it('returns input for unknown abbreviation', () => {
      expect(stateAbbrevToName('XX')).toBe('XX');
    });

    it('converts CA to California', () => {
      expect(stateAbbrevToName('CA')).toBe('California');
    });

    it('converts NY to New York', () => {
      expect(stateAbbrevToName('NY')).toBe('New York');
    });
  });

  describe('stateNameToAbbrev', () => {
    it('converts Minnesota to MN', () => {
      expect(stateNameToAbbrev('Minnesota')).toBe('MN');
    });

    it('is case-insensitive', () => {
      expect(stateNameToAbbrev('minnesota')).toBe('MN');
    });

    it('returns null for unknown state name', () => {
      expect(stateNameToAbbrev('Neverland')).toBeNull();
    });

    it('converts New York to NY', () => {
      expect(stateNameToAbbrev('New York')).toBe('NY');
    });
  });

  describe('getParkStateSlug', () => {
    it('converts 2-letter abbreviation to state slug', () => {
      expect(getParkStateSlug({ state: 'MN', city: 'Minneapolis' })).toBe('minnesota');
    });

    it('handles abbreviation with zip code in state field', () => {
      expect(getParkStateSlug({ state: 'WI 53711', city: 'Madison' })).toBe('wisconsin');
    });

    it('handles swapped city/state (state is zip, city is abbreviation)', () => {
      expect(getParkStateSlug({ state: '53711', city: 'WI' })).toBe('wisconsin');
    });

    it('returns null for missing state', () => {
      expect(getParkStateSlug({ state: null, city: null })).toBeNull();
    });

    it('handles multi-word state names in slug format', () => {
      expect(getParkStateSlug({ state: 'NY', city: 'New York' })).toBe('new-york');
    });

    it('returns null for unrecognized state format', () => {
      expect(getParkStateSlug({ state: 'Some Random Text', city: 'City' })).toBeNull();
    });
  });
});

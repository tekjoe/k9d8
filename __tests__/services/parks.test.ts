jest.mock('../../src/lib/supabase');

import { getParksInBounds, getAllParks, getParksNearby, getActiveCheckInCounts, getParkById, getParkByShortId, getParkBySlug, getParkCityCounts, getParksByCity, getParkStateCounts, getParksByState, getParksByStatePaginated, getFeaturedParks } from '../../src/services/parks';
import { supabase } from '../../src/lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function mockFrom(resolvedValue: { data: any; error: any; count?: number }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in', 'gte', 'gt', 'lt', 'lte', 'ilike', 'range', 'not'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('parks service', () => {
  describe('getAllParks', () => {
    it('returns all parks', async () => {
      const parks = [{ id: 'p1', name: 'Loring Park' }];
      mockFrom({ data: parks, error: null });
      const result = await getAllParks();
      expect(result).toEqual(parks);
    });

    it('throws on error', async () => {
      mockFrom({ data: null, error: { message: 'fail' } });
      await expect(getAllParks()).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('getParksInBounds', () => {
    it('queries parks within bounding box', async () => {
      const parks = [{ id: 'p1' }];
      const chain = mockFrom({ data: parks, error: null });
      const result = await getParksInBounds({ minLat: 44.0, maxLat: 45.0, minLng: -94.0, maxLng: -93.0 });
      expect(result).toEqual(parks);
      expect(chain.gte).toHaveBeenCalled();
    });
  });

  describe('getParksNearby', () => {
    it('returns parks near a location', async () => {
      mockFrom({ data: [{ id: 'p1' }], error: null });
      const result = await getParksNearby(44.98, -93.27);
      expect(result.length).toBe(1);
    });
  });

  describe('getParkById', () => {
    it('returns a single park', async () => {
      const park = { id: 'p1', name: 'Loring' };
      mockFrom({ data: park, error: null });
      const result = await getParkById('p1');
      expect(result).toEqual(park);
    });
  });

  describe('getParkByShortId', () => {
    it('returns park matching short ID prefix', async () => {
      const parks = [{ id: 'p1234567-rest' }];
      mockFrom({ data: parks, error: null });
      const result = await getParkByShortId('p1234567');
      expect(result).toEqual(parks[0]);
    });
  });

  describe('getParkBySlug', () => {
    it('returns park matching name slug', async () => {
      const park = { id: 'p1', name: 'Loring Park' };
      mockFrom({ data: [park], error: null });
      const result = await getParkBySlug('loring-park');
      expect(result).toEqual(park);
    });
  });

  describe('getActiveCheckInCounts', () => {
    it('returns dog counts per park', async () => {
      const data = [
        { park_id: 'p1', check_in_dogs: [{ count: 2 }] },
        { park_id: 'p1', check_in_dogs: [{ count: 1 }] },
        { park_id: 'p2', check_in_dogs: [{ count: 3 }] },
      ];
      mockFrom({ data, error: null });
      const result = await getActiveCheckInCounts();
      expect(result['p1']).toBe(3);
      expect(result['p2']).toBe(3);
    });
  });

  describe('getParkCityCounts', () => {
    it('returns city counts', async () => {
      mockFrom({ data: [{ city: 'Minneapolis', state: 'MN' }, { city: 'Minneapolis', state: 'MN' }, { city: 'St Paul', state: 'MN' }], error: null });
      const result = await getParkCityCounts();
      const mpls = result.find((r: any) => r.city === 'Minneapolis');
      expect(mpls?.count).toBe(2);
    });
  });

  describe('getParksByCity', () => {
    it('returns parks in a city', async () => {
      mockFrom({ data: [{ id: 'p1' }], error: null });
      const result = await getParksByCity('Minneapolis');
      expect(result.length).toBe(1);
    });
  });

  describe('getParkStateCounts', () => {
    it('returns state counts', async () => {
      // getParkStateCounts fetches in batches; first call returns data, second returns empty to stop
      const chain: any = {};
      const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in', 'gte', 'gt', 'lt', 'lte', 'ilike', 'range', 'not'];
      for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
      // First batch returns data, second returns empty
      let callCount = 0;
      chain.then = (resolve: any) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(resolve({ data: [{ city: 'Minneapolis', state: 'MN' }], error: null }));
        }
        return Promise.resolve(resolve({ data: [], error: null }));
      };
      mockSupabase.from.mockReturnValue(chain);
      const result = await getParkStateCounts();
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getParksByState', () => {
    it('returns parks in a state', async () => {
      mockFrom({ data: [{ id: 'p1' }], error: null });
      const result = await getParksByState('Minnesota');
      expect(result.length).toBe(1);
    });

    it('returns empty array for unknown state', async () => {
      const result = await getParksByState('Neverland');
      expect(result).toEqual([]);
    });
  });

  describe('getParksByStatePaginated', () => {
    it('returns parks with count', async () => {
      mockFrom({ data: [{ id: 'p1' }], error: null, count: 1 });
      const result = await getParksByStatePaginated('Minnesota', 1, 10);
      expect(result.parks.length).toBe(1);
      expect(result.totalCount).toBe(1);
    });

    it('returns empty for unknown state', async () => {
      const result = await getParksByStatePaginated('Neverland', 1, 10);
      expect(result).toEqual({ parks: [], totalCount: 0 });
    });
  });

  describe('getFeaturedParks', () => {
    it('returns featured parks', async () => {
      mockFrom({ data: [{ id: 'p1' }], error: null });
      const result = await getFeaturedParks();
      expect(result.length).toBe(1);
    });
  });
});

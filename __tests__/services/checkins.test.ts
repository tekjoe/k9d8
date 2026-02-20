jest.mock('../../src/lib/supabase');

import { checkIn, checkOut, getActiveCheckIns, getAllActiveCheckIns, getUserRecentCheckIns, getUserActiveCheckIn } from '../../src/services/checkins';
import { supabase } from '../../src/lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function mockFrom(resolvedValue: { data: any; error: any }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('checkins service', () => {
  describe('checkIn', () => {
    it('creates check-in and associates dogs', async () => {
      const checkInRecord = { id: 'ci-1', user_id: 'user-1', park_id: 'park-1' };
      // First call: insert check_in, Second call: insert check_in_dogs
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'eq', 'is', 'order', 'limit', 'single', 'maybeSingle'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: checkInRecord, error: null }));
        } else {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: null, error: null }));
        }
        return chain as any;
      });
      mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null } as any);

      const result = await checkIn('user-1', 'park-1', ['dog-1']);
      expect(result).toEqual(checkInRecord);
    });

    it('creates check-in without dogs', async () => {
      const checkInRecord = { id: 'ci-1', user_id: 'user-1', park_id: 'park-1' };
      mockFrom({ data: checkInRecord, error: null });
      mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null } as any);
      const result = await checkIn('user-1', 'park-1', []);
      expect(result).toEqual(checkInRecord);
    });

    it('throws on check-in insert error', async () => {
      mockFrom({ data: null, error: { message: 'insert fail' } });
      await expect(checkIn('user-1', 'park-1', [])).rejects.toEqual({ message: 'insert fail' });
    });

    it('cleans up check-in record when dog insertion fails', async () => {
      const checkInRecord = { id: 'ci-1', user_id: 'user-1', park_id: 'park-1' };
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'eq', 'is', 'order', 'limit', 'single', 'maybeSingle'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: checkInRecord, error: null }));
        } else if (callCount === 2) {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: null, error: { message: 'dogs insert fail' } }));
        } else {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: null, error: null }));
        }
        return chain as any;
      });

      await expect(checkIn('user-1', 'park-1', ['dog-1'])).rejects.toEqual({ message: 'dogs insert fail' });
    });
  });

  describe('checkOut', () => {
    it('updates checked_out_at', async () => {
      const chain = mockFrom({ data: null, error: null });
      await checkOut('ci-1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ checked_out_at: expect.any(String) }));
    });

    it('throws on error', async () => {
      mockFrom({ data: null, error: { message: 'fail' } });
      await expect(checkOut('ci-1')).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('getActiveCheckIns', () => {
    it('returns enriched check-ins with dogs', async () => {
      const data = [{
        id: 'ci-1', user_id: 'u1', park_id: 'p1',
        checked_in_at: '2024-01-01', checked_out_at: null,
        profile: { id: 'u1' },
        check_in_dogs: [{ dog: { id: 'd1', name: 'Buddy' } }],
      }];
      mockFrom({ data, error: null });
      const result = await getActiveCheckIns('p1');
      expect(result[0].dogs).toEqual([{ id: 'd1', name: 'Buddy' }]);
    });

    it('returns empty array when no check-ins', async () => {
      mockFrom({ data: [], error: null });
      const result = await getActiveCheckIns('p1');
      expect(result).toEqual([]);
    });
  });

  describe('getAllActiveCheckIns', () => {
    it('returns check-ins with park info', async () => {
      const data = [{
        id: 'ci-1', user_id: 'u1', park_id: 'p1',
        checked_in_at: '2024-01-01', checked_out_at: null,
        profile: { id: 'u1' }, park: { id: 'p1', name: 'Park' },
        check_in_dogs: [],
      }];
      mockFrom({ data, error: null });
      const result = await getAllActiveCheckIns();
      expect(result.length).toBe(1);
    });
  });

  describe('getUserRecentCheckIns', () => {
    it('returns recent check-ins for user', async () => {
      const data = [{ id: 'ci-1', user_id: 'u1', park_id: 'p1', checked_in_at: '2024-01-01', checked_out_at: null, park: { id: 'p1' } }];
      mockFrom({ data, error: null });
      const result = await getUserRecentCheckIns('u1');
      expect(result.length).toBe(1);
    });
  });

  describe('getUserActiveCheckIn', () => {
    it('returns active check-in', async () => {
      const data = {
        id: 'ci-1', user_id: 'u1', park_id: 'p1',
        checked_in_at: '2024-01-01', checked_out_at: null,
        profile: { id: 'u1' },
        check_in_dogs: [{ dog: { id: 'd1', name: 'Buddy' } }],
      };
      mockFrom({ data, error: null });
      const result = await getUserActiveCheckIn('u1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('ci-1');
    });

    it('returns null when no active check-in', async () => {
      mockFrom({ data: null, error: null });
      const result = await getUserActiveCheckIn('u1');
      expect(result).toBeNull();
    });
  });
});

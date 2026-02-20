jest.mock('../../src/lib/supabase');

import { getPlayDates, getPlayDateById, getMyPlayDates, createPlayDate, updatePlayDate, cancelPlayDate, rsvpToPlayDate, cancelRSVP, getPlaydateWithExpirationCheck, rsvpToPlaydateWithCheck, getActivePlaydates, getPastPlaydates, getAllPlaydatesForUser } from '../../src/services/playdates';
import { supabase } from '../../src/lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function mockFrom(resolvedValue: { data: any; error: any }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in', 'gte', 'gt', 'lt'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('playdates service', () => {
  describe('getPlayDates', () => {
    it('returns upcoming play dates', async () => {
      const playdates = [{ id: 'pd1', status: 'scheduled' }];
      mockFrom({ data: playdates, error: null });
      const result = await getPlayDates();
      expect(result).toEqual(playdates);
    });

    it('filters by park when provided', async () => {
      const chain = mockFrom({ data: [], error: null });
      await getPlayDates('p1');
      expect(chain.eq).toHaveBeenCalledWith('park_id', 'p1');
    });

    it('throws on error', async () => {
      mockFrom({ data: null, error: { message: 'fail' } });
      await expect(getPlayDates()).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('getPlayDateById', () => {
    it('returns a single play date', async () => {
      const pd = { id: 'pd1', title: 'Test' };
      mockFrom({ data: pd, error: null });
      const result = await getPlayDateById('pd1');
      expect(result).toEqual(pd);
    });
  });

  describe('createPlayDate', () => {
    it('creates and returns a play date', async () => {
      const pd = { id: 'pd1', title: 'New Playdate' };
      mockFrom({ data: pd, error: null });
      const result = await createPlayDate({ title: 'New Playdate' } as any);
      expect(result).toEqual(pd);
    });
  });

  describe('updatePlayDate', () => {
    it('updates and returns a play date', async () => {
      const pd = { id: 'pd1', title: 'Updated' };
      mockFrom({ data: pd, error: null });
      const result = await updatePlayDate('pd1', { title: 'Updated' });
      expect(result).toEqual(pd);
    });
  });

  describe('cancelPlayDate', () => {
    it('sets status to cancelled', async () => {
      const chain = mockFrom({ data: { id: 'pd1', status: 'cancelled' }, error: null });
      await cancelPlayDate('pd1');
      expect(chain.update).toHaveBeenCalledWith({ status: 'cancelled' });
    });
  });

  describe('rsvpToPlayDate', () => {
    it('upserts an RSVP', async () => {
      const rsvp = { id: 'rsvp1', status: 'going' };
      const chain = mockFrom({ data: rsvp, error: null });
      const result = await rsvpToPlayDate('pd1', 'u1', 'd1');
      expect(result).toEqual(rsvp);
      expect(chain.upsert).toHaveBeenCalled();
    });
  });

  describe('cancelRSVP', () => {
    it('deletes the RSVP', async () => {
      const chain = mockFrom({ data: null, error: null });
      await cancelRSVP('rsvp1');
      expect(chain.delete).toHaveBeenCalled();
    });
  });

  describe('getPlaydateWithExpirationCheck', () => {
    it('returns playdate as-is if still active', async () => {
      const pd = { id: 'pd1', status: 'scheduled', ends_at: new Date(Date.now() + 3600000).toISOString() };
      mockFrom({ data: pd, error: null });
      const result = await getPlaydateWithExpirationCheck('pd1');
      expect(result.status).toBe('scheduled');
    });

    it('expires and returns completed for ended playdate', async () => {
      const pd = { id: 'pd1', status: 'scheduled', ends_at: new Date(Date.now() - 3600000).toISOString() };
      mockFrom({ data: pd, error: null });
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null } as any);
      const result = await getPlaydateWithExpirationCheck('pd1');
      expect(result.status).toBe('completed');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('force_expire_play_date', { play_date_id: 'pd1' });
    });
  });

  describe('rsvpToPlaydateWithCheck', () => {
    it('throws when playdate has ended', async () => {
      const pd = { status: 'completed', ends_at: new Date(Date.now() - 3600000).toISOString() };
      mockFrom({ data: pd, error: null });
      await expect(rsvpToPlaydateWithCheck('pd1', 'u1', 'd1')).rejects.toThrow('This play date has ended');
    });

    it('succeeds when playdate is still active', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in', 'gte', 'gt', 'lt'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          // getPlayDateById
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: { id: 'pd1', status: 'scheduled', ends_at: new Date(Date.now() + 3600000).toISOString() },
            error: null,
          }));
        } else {
          // rsvpToPlayDate
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: { id: 'rsvp1', status: 'going' },
            error: null,
          }));
        }
        return chain as any;
      });
      const result = await rsvpToPlaydateWithCheck('pd1', 'u1', 'd1');
      expect(result).toEqual({ id: 'rsvp1', status: 'going' });
    });
  });

  describe('getActivePlaydates', () => {
    it('returns active playdate list', async () => {
      const data = [{ id: 'pd1' }];
      mockFrom({ data, error: null });
      const result = await getActivePlaydates();
      expect(result).toEqual(data);
    });

    it('filters by park', async () => {
      const chain = mockFrom({ data: [], error: null });
      await getActivePlaydates('p1');
      expect(chain.eq).toHaveBeenCalledWith('park_id', 'p1');
    });
  });

  describe('getMyPlayDates', () => {
    it('merges organized and RSVPed playdates', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in', 'gte', 'gt', 'lt'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          // organized playdates
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [{ id: 'pd1', starts_at: '2025-06-01T10:00:00Z' }],
            error: null,
          }));
        } else if (callCount === 2) {
          // rsvp rows
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [{ play_date_id: 'pd2' }],
            error: null,
          }));
        } else {
          // fetch additional playdates
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [{ id: 'pd2', starts_at: '2025-06-02T10:00:00Z' }],
            error: null,
          }));
        }
        return chain as any;
      });

      const result = await getMyPlayDates('u1');
      expect(result.length).toBe(2);
    });
  });

  describe('getPastPlaydates', () => {
    it('returns past playdates', async () => {
      mockFrom({ data: [{ id: 'pd1' }], error: null });
      const result = await getPastPlaydates();
      expect(result.length).toBe(1);
    });

    it('filters by userId when provided', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in', 'gte', 'gt', 'lt'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount <= 2) {
          // First: main query, second: rsvp rows
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: callCount === 1
              ? [{ id: 'pd1', organizer_id: 'u1', starts_at: '2024-01-01', ends_at: '2024-01-01', status: 'completed' }]
              : [{ play_date_id: 'pd2' }],
            error: null,
          }));
        } else {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: [], error: null }));
        }
        return chain as any;
      });
      const result = await getPastPlaydates('p1', 'u1');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getAllPlaydatesForUser', () => {
    it('separates upcoming and past', async () => {
      let callCount = 0;
      const future = new Date(Date.now() + 86400000).toISOString();
      const past = new Date(Date.now() - 86400000).toISOString();
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in', 'gte', 'gt', 'lt'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [
              { id: 'pd1', status: 'scheduled', starts_at: future, ends_at: future },
              { id: 'pd2', status: 'completed', starts_at: past, ends_at: past },
            ],
            error: null,
          }));
        } else {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: [], error: null }));
        }
        return chain as any;
      });

      const result = await getAllPlaydatesForUser('u1');
      expect(result.upcoming.length).toBe(1);
      expect(result.past.length).toBe(1);
    });
  });
});

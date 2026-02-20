jest.mock('../../src/lib/supabase');

import { createParkReview, getParkReviews, voteParkReview, unvoteParkReview, deleteParkReview, reportParkReview } from '../../src/services/parkReviews';
import { supabase } from '../../src/lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function mockAuth(userId: string | null) {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: userId ? { id: userId } : null },
    error: null,
  } as any);
}

function mockFrom(resolvedValue: { data: any; error: any }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('parkReviews service', () => {
  describe('createParkReview', () => {
    it('creates a review', async () => {
      mockAuth('u1');
      const review = { id: 'r1', content: 'Great park!', user: { id: 'u1' } };
      mockFrom({ data: review, error: null });
      const result = await createParkReview('p1', 'Great park!');
      expect(result.vote_count).toBe(0);
      expect(result.user_has_voted).toBe(false);
    });

    it('rejects profane content', async () => {
      mockAuth('u1');
      await expect(createParkReview('p1', 'this is shit')).rejects.toThrow('inappropriate language');
    });

    it('throws when not authenticated', async () => {
      mockAuth(null);
      await expect(createParkReview('p1', 'Nice!')).rejects.toThrow('Not authenticated');
    });
  });

  describe('getParkReviews', () => {
    it('returns threaded reviews with vote counts', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [
              { id: 'r1', park_id: 'p1', parent_id: null, content: 'Great!', created_at: '2024-01-01' },
              { id: 'r2', park_id: 'p1', parent_id: 'r1', content: 'Reply!', created_at: '2024-01-02' },
            ],
            error: null,
          }));
        } else {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: [], error: null }));
        }
        return chain as any;
      });

      const result = await getParkReviews('p1');
      expect(result.length).toBe(1);
      expect(result[0].replies?.length).toBe(1);
    });

    it('returns reviews with votes and user vote status', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [
              { id: 'r1', park_id: 'p1', parent_id: null, content: 'Nice park!', created_at: '2024-01-01' },
            ],
            error: null,
          }));
        } else if (callCount === 2) {
          // votes
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [{ review_id: 'r1' }, { review_id: 'r1' }],
            error: null,
          }));
        } else {
          // user votes
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [{ review_id: 'r1' }],
            error: null,
          }));
        }
        return chain as any;
      });

      const result = await getParkReviews('p1', 'u1');
      expect(result[0].vote_count).toBe(2);
      expect(result[0].user_has_voted).toBe(true);
    });
  });

  describe('voteParkReview', () => {
    it('inserts a vote', async () => {
      mockAuth('u1');
      mockFrom({ data: null, error: null });
      await voteParkReview('r1');
      expect(mockSupabase.from).toHaveBeenCalledWith('park_review_votes');
    });

    it('toggles vote on duplicate (23505)', async () => {
      mockAuth('u1');
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: null, error: { code: '23505', message: 'duplicate' } }));
        } else {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: null, error: null }));
        }
        return chain as any;
      });
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null } as any);
      await voteParkReview('r1');
    });

    it('throws when not authenticated', async () => {
      mockAuth(null);
      await expect(voteParkReview('r1')).rejects.toThrow('Not authenticated');
    });
  });

  describe('unvoteParkReview', () => {
    it('deletes a vote', async () => {
      mockAuth('u1');
      const chain = mockFrom({ data: null, error: null });
      await unvoteParkReview('r1');
      expect(chain.delete).toHaveBeenCalled();
    });
  });

  describe('deleteParkReview', () => {
    it('deletes a review', async () => {
      const chain = mockFrom({ data: null, error: null });
      await deleteParkReview('r1');
      expect(chain.delete).toHaveBeenCalled();
    });
  });

  describe('reportParkReview', () => {
    it('inserts a report', async () => {
      mockAuth('u1');
      const chain = mockFrom({ data: null, error: null });
      await reportParkReview('r1', 'spam');
      expect(mockSupabase.from).toHaveBeenCalledWith('park_review_reports');
    });

    it('throws for duplicate report', async () => {
      mockAuth('u1');
      mockFrom({ data: null, error: { code: '23505', message: 'duplicate' } });
      await expect(reportParkReview('r1', 'spam')).rejects.toThrow('You have already reported this review.');
    });

    it('throws when not authenticated', async () => {
      mockAuth(null);
      await expect(reportParkReview('r1', 'spam')).rejects.toThrow('Not authenticated');
    });
  });
});

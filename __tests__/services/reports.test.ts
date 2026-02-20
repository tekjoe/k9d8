jest.mock('../../src/lib/supabase');

import { reportMessage } from '../../src/services/reports';
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
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'single', 'maybeSingle'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('reports service', () => {
  describe('reportMessage', () => {
    it('inserts a report', async () => {
      mockAuth('user-1');
      const chain = mockFrom({ data: null, error: null });
      await reportMessage('msg-1', 'spam', 'test details');
      expect(mockSupabase.from).toHaveBeenCalledWith('message_reports');
      expect(chain.insert).toHaveBeenCalledWith({
        reporter_id: 'user-1',
        message_id: 'msg-1',
        reason: 'spam',
        details: 'test details',
      });
    });

    it('sends null details when not provided', async () => {
      mockAuth('user-1');
      const chain = mockFrom({ data: null, error: null });
      await reportMessage('msg-1', 'harassment');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ details: null })
      );
    });

    it('throws when not authenticated', async () => {
      mockAuth(null);
      await expect(reportMessage('msg-1', 'spam')).rejects.toThrow('Not authenticated');
    });

    it('throws user-friendly message for duplicate report', async () => {
      mockAuth('user-1');
      mockFrom({ data: null, error: { code: '23505', message: 'duplicate' } });
      await expect(reportMessage('msg-1', 'spam')).rejects.toThrow(
        'You have already reported this message.'
      );
    });

    it('throws original error for non-duplicate errors', async () => {
      mockAuth('user-1');
      mockFrom({ data: null, error: { code: '42000', message: 'Something else' } });
      await expect(reportMessage('msg-1', 'spam')).rejects.toEqual({
        code: '42000',
        message: 'Something else',
      });
    });
  });
});

jest.mock('../../src/lib/supabase');

import { blockUser, unblockUser, getBlockStatus, getBlockedUsers } from '../../src/services/blocks';
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
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('blocks service', () => {
  describe('blockUser', () => {
    it('inserts a block record', async () => {
      mockAuth('user-1');
      const chain = mockFrom({ data: null, error: null });
      await blockUser('user-2');
      expect(mockSupabase.from).toHaveBeenCalledWith('user_blocks');
      expect(chain.insert).toHaveBeenCalledWith({ blocker_id: 'user-1', blocked_id: 'user-2' });
    });

    it('throws when not authenticated', async () => {
      mockAuth(null);
      await expect(blockUser('user-2')).rejects.toThrow('Not authenticated');
    });

    it('throws on supabase error', async () => {
      mockAuth('user-1');
      mockFrom({ data: null, error: { message: 'DB error' } });
      await expect(blockUser('user-2')).rejects.toEqual({ message: 'DB error' });
    });
  });

  describe('unblockUser', () => {
    it('deletes a block record', async () => {
      mockAuth('user-1');
      const chain = mockFrom({ data: null, error: null });
      await unblockUser('user-2');
      expect(mockSupabase.from).toHaveBeenCalledWith('user_blocks');
      expect(chain.delete).toHaveBeenCalled();
    });

    it('throws when not authenticated', async () => {
      mockAuth(null);
      await expect(unblockUser('user-2')).rejects.toThrow('Not authenticated');
    });
  });

  describe('getBlockStatus', () => {
    it('returns block status from RPC', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 'blocked', error: null } as any);
      const result = await getBlockStatus('user-2');
      expect(result).toBe('blocked');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_block_status', { other_uid: 'user-2' });
    });

    it('returns null when no block relationship', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null } as any);
      const result = await getBlockStatus('user-2');
      expect(result).toBeNull();
    });

    it('throws on error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC error' } } as any);
      await expect(getBlockStatus('user-2')).rejects.toEqual({ message: 'RPC error' });
    });
  });

  describe('getBlockedUsers', () => {
    it('returns list of blocked profiles', async () => {
      mockAuth('user-1');
      const profiles = [{ blocked: { id: 'user-2', display_name: 'Blocked User' } }];
      mockFrom({ data: profiles, error: null });
      const result = await getBlockedUsers();
      expect(result).toEqual([{ id: 'user-2', display_name: 'Blocked User' }]);
    });

    it('returns empty array when no blocks', async () => {
      mockAuth('user-1');
      mockFrom({ data: [], error: null });
      const result = await getBlockedUsers();
      expect(result).toEqual([]);
    });

    it('throws when not authenticated', async () => {
      mockAuth(null);
      await expect(getBlockedUsers()).rejects.toThrow('Not authenticated');
    });
  });
});

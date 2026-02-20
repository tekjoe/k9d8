jest.mock('../../src/lib/supabase');

import { getFriends, getPendingRequests, getSentRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, removeFriendByUserId, getRecentFriendships, getFriendshipStatus } from '../../src/services/friends';
import { supabase } from '../../src/lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function mockFrom(resolvedValue: { data: any; error: any }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('friends service', () => {
  describe('getFriends', () => {
    it('calls RPC and returns profiles', async () => {
      const profiles = [{ id: 'u2', display_name: 'Friend' }];
      mockSupabase.rpc.mockResolvedValue({ data: profiles, error: null } as any);
      const result = await getFriends('u1');
      expect(result).toEqual(profiles);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_friends', { uid: 'u1' });
    });

    it('throws on error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'fail' } } as any);
      await expect(getFriends('u1')).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('getPendingRequests', () => {
    it('returns pending requests addressed to user', async () => {
      const requests = [{ id: 'f1', status: 'pending' }];
      mockFrom({ data: requests, error: null });
      const result = await getPendingRequests('u1');
      expect(result).toEqual(requests);
    });
  });

  describe('getSentRequests', () => {
    it('returns sent pending requests', async () => {
      const requests = [{ id: 'f2', status: 'pending' }];
      mockFrom({ data: requests, error: null });
      const result = await getSentRequests('u1');
      expect(result).toEqual(requests);
    });
  });

  describe('sendFriendRequest', () => {
    it('checks for existing and creates new request', async () => {
      // First call: check existing (maybeSingle returns null)
      // Second call: insert new friendship
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'eq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: null, error: null }));
        } else {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: { id: 'f1', status: 'pending' }, error: null }));
        }
        return chain as any;
      });
      const result = await sendFriendRequest('u1', 'u2');
      expect(result).toEqual({ id: 'f1', status: 'pending' });
    });

    it('throws when already pending', async () => {
      mockFrom({ data: { id: 'f1', status: 'pending' }, error: null });
      await expect(sendFriendRequest('u1', 'u2')).rejects.toThrow('Friend request already pending');
    });

    it('throws when already friends', async () => {
      mockFrom({ data: { id: 'f1', status: 'accepted' }, error: null });
      await expect(sendFriendRequest('u1', 'u2')).rejects.toThrow('Already friends');
    });

    it('throws when prior request was declined', async () => {
      mockFrom({ data: { id: 'f1', status: 'declined' }, error: null });
      await expect(sendFriendRequest('u1', 'u2')).rejects.toThrow('prior request was declined');
    });
  });

  describe('acceptFriendRequest', () => {
    it('updates status to accepted', async () => {
      const chain = mockFrom({ data: null, error: null });
      await acceptFriendRequest('f1');
      expect(chain.update).toHaveBeenCalledWith({ status: 'accepted' });
    });
  });

  describe('declineFriendRequest', () => {
    it('updates status to declined', async () => {
      const chain = mockFrom({ data: null, error: null });
      await declineFriendRequest('f1');
      expect(chain.update).toHaveBeenCalledWith({ status: 'declined' });
    });
  });

  describe('removeFriend', () => {
    it('deletes the friendship record', async () => {
      const chain = mockFrom({ data: null, error: null });
      await removeFriend('f1');
      expect(chain.delete).toHaveBeenCalled();
    });
  });

  describe('removeFriendByUserId', () => {
    it('looks up friendship then removes it', async () => {
      // First call: getFriendshipStatus returns a friendship
      // Second call: removeFriend deletes it
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'eq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: { id: 'f1' }, error: null }));
        } else {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: null, error: null }));
        }
        return chain as any;
      });
      await removeFriendByUserId('u1', 'u2');
    });

    it('throws when friendship not found', async () => {
      mockFrom({ data: null, error: null });
      await expect(removeFriendByUserId('u1', 'u2')).rejects.toThrow('Friendship not found');
    });
  });

  describe('getRecentFriendships', () => {
    it('returns recent accepted friendships', async () => {
      const data = [{ id: 'f1', status: 'accepted' }];
      mockFrom({ data, error: null });
      const result = await getRecentFriendships('u1');
      expect(result).toEqual(data);
    });
  });

  describe('getFriendshipStatus', () => {
    it('returns friendship record between two users', async () => {
      const friendship = { id: 'f1', status: 'accepted' };
      mockFrom({ data: friendship, error: null });
      const result = await getFriendshipStatus('u1', 'u2');
      expect(result).toEqual(friendship);
    });

    it('returns null when no friendship exists', async () => {
      mockFrom({ data: null, error: null });
      const result = await getFriendshipStatus('u1', 'u2');
      expect(result).toBeNull();
    });
  });
});

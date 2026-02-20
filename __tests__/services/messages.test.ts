jest.mock('../../src/lib/supabase');

import { getConversations, getOrCreateConversation, getMessages, sendMessage, markConversationRead } from '../../src/services/messages';
import { supabase } from '../../src/lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function mockFrom(resolvedValue: { data: any; error: any }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'lt', 'gte', 'gt', 'in', 'upsert'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('messages service', () => {
  describe('getConversations', () => {
    it('returns conversations ordered by recent', async () => {
      const convos = [{ id: 'c1', last_message_at: '2024-01-01' }];
      mockFrom({ data: convos, error: null });
      const result = await getConversations();
      expect(result).toEqual(convos);
      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
    });

    it('throws on error', async () => {
      mockFrom({ data: null, error: { message: 'fail' } });
      await expect(getConversations()).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('getOrCreateConversation', () => {
    it('returns conversation ID via RPC', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 'conv-123', error: null } as any);
      const result = await getOrCreateConversation('user-2');
      expect(result).toBe('conv-123');
    });

    it('throws friendly error for blocked user', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'Cannot message this user' } } as any);
      await expect(getOrCreateConversation('user-2')).rejects.toThrow('You cannot message this user.');
    });

    it('throws friendly error for non-friends', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'must be friends' } } as any);
      await expect(getOrCreateConversation('user-2')).rejects.toThrow('You must be friends to start a conversation.');
    });

    it('throws original error for other errors', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'DB error' } } as any);
      await expect(getOrCreateConversation('user-2')).rejects.toEqual({ message: 'DB error' });
    });
  });

  describe('getMessages', () => {
    it('returns messages in chronological order', async () => {
      const msgs = [
        { id: 'm2', created_at: '2024-01-02' },
        { id: 'm1', created_at: '2024-01-01' },
      ];
      mockFrom({ data: msgs, error: null });
      const result = await getMessages('c1');
      // reversed for chronological display
      expect(result[0].id).toBe('m1');
      expect(result[1].id).toBe('m2');
    });
  });

  describe('sendMessage', () => {
    it('inserts and returns message', async () => {
      const msg = { id: 'm1', content: 'Hello' };
      mockFrom({ data: msg, error: null });
      mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null } as any);
      const result = await sendMessage('c1', 'u1', 'Hello');
      expect(result).toEqual(msg);
    });

    it('rejects profane messages', async () => {
      await expect(sendMessage('c1', 'u1', 'this is shit')).rejects.toThrow('inappropriate language');
    });

    it('throws on insert error', async () => {
      mockFrom({ data: null, error: { message: 'fail' } });
      await expect(sendMessage('c1', 'u1', 'Hello')).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('markConversationRead', () => {
    it('updates last_read_at', async () => {
      const chain = mockFrom({ data: null, error: null });
      await markConversationRead('c1', 'u1');
      expect(mockSupabase.from).toHaveBeenCalledWith('conversation_participants');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ last_read_at: expect.any(String) }));
    });
  });
});

jest.mock('../../src/lib/supabase');

import { registerPushToken, removePushToken, getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, cleanupOldNotifications, subscribeToNotifications } from '../../src/services/notifications';
import { supabase } from '../../src/lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function mockFrom(resolvedValue: { data?: any; error: any; count?: number }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('notifications service', () => {
  describe('registerPushToken', () => {
    it('upserts a push token', async () => {
      const chain = mockFrom({ data: null, error: null });
      await registerPushToken('u1', 'token123');
      expect(mockSupabase.from).toHaveBeenCalledWith('push_tokens');
      expect(chain.upsert).toHaveBeenCalled();
    });

    it('throws on error', async () => {
      mockFrom({ data: null, error: { message: 'fail' } });
      await expect(registerPushToken('u1', 'token')).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('removePushToken', () => {
    it('deletes a push token', async () => {
      const chain = mockFrom({ data: null, error: null });
      await removePushToken('token123');
      expect(chain.delete).toHaveBeenCalled();
    });
  });

  describe('getNotifications', () => {
    it('returns notifications', async () => {
      const notifs = [{ id: 'n1', title: 'Hello' }];
      mockFrom({ data: notifs, error: null });
      const result = await getNotifications();
      expect(result).toEqual(notifs);
    });

    it('filters unread only when option is set', async () => {
      const chain = mockFrom({ data: [], error: null });
      await getNotifications({ unreadOnly: true });
      expect(chain.eq).toHaveBeenCalledWith('read', false);
    });

    it('throws on error', async () => {
      mockFrom({ data: null, error: { message: 'fail' } });
      await expect(getNotifications()).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread count', async () => {
      mockFrom({ count: 5, error: null });
      const result = await getUnreadCount();
      expect(result).toBe(5);
    });

    it('returns 0 when count is null', async () => {
      mockFrom({ count: null as any, error: null });
      const result = await getUnreadCount();
      expect(result).toBe(0);
    });
  });

  describe('markNotificationAsRead', () => {
    it('updates read to true', async () => {
      const chain = mockFrom({ data: null, error: null });
      await markNotificationAsRead('n1');
      expect(chain.update).toHaveBeenCalledWith({ read: true });
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('calls RPC to mark all read', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null } as any);
      await markAllNotificationsAsRead();
      expect(mockSupabase.rpc).toHaveBeenCalledWith('mark_all_notifications_read');
    });

    it('falls back to manual update if RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'no function' } } as any);
      mockFrom({ data: null, error: null });
      await markAllNotificationsAsRead();
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });
  });

  describe('deleteNotification', () => {
    it('deletes a notification', async () => {
      const chain = mockFrom({ data: null, error: null });
      await deleteNotification('n1');
      expect(chain.delete).toHaveBeenCalled();
    });
  });

  describe('cleanupOldNotifications', () => {
    it('calls RPC and returns count', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 5, error: null } as any);
      const result = await cleanupOldNotifications();
      expect(result).toBe(5);
    });
  });

  describe('subscribeToNotifications', () => {
    it('sets up a real-time subscription', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      };
      mockSupabase.channel.mockReturnValue(mockChannel as any);

      const callback = jest.fn();
      subscribeToNotifications('u1', callback);
      expect(mockSupabase.channel).toHaveBeenCalledWith('notifications:u1');
      expect(mockChannel.on).toHaveBeenCalledWith('postgres_changes', expect.any(Object), expect.any(Function));
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });
});

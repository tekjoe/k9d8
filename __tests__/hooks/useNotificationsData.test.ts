jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/notifications');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNotificationsData } from '../../src/hooks/useNotificationsData';
import * as notifService from '../../src/services/notifications';
import { createWrapper } from '../helpers/renderWithProviders';

const mockGetNotifications = notifService.getNotifications as jest.Mock;
const mockGetUnreadCount = notifService.getUnreadCount as jest.Mock;
const mockMarkNotificationAsRead = notifService.markNotificationAsRead as jest.Mock;
const mockMarkAllNotificationsAsRead = notifService.markAllNotificationsAsRead as jest.Mock;
const mockDeleteNotification = notifService.deleteNotification as jest.Mock;
const mockSubscribeToNotifications = notifService.subscribeToNotifications as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockSubscribeToNotifications.mockReturnValue({ unsubscribe: jest.fn() });
});

describe('useNotificationsData', () => {
  it('loads notifications and unread count on mount', async () => {
    const notifications = [{ id: 'n1', read: false, type: 'friend_request' }];
    mockGetNotifications.mockResolvedValue(notifications);
    mockGetUnreadCount.mockResolvedValue(3);

    const { result } = renderHook(() => useNotificationsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.notifications).toEqual(notifications);
    expect(result.current.unreadCount).toBe(3);
  });

  it('handles load failure with error state', async () => {
    mockGetNotifications.mockRejectedValue(new Error('Network error'));
    mockGetUnreadCount.mockResolvedValue(0);

    const { result } = renderHook(() => useNotificationsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Network error');
  });

  it('markAsRead updates notification and decrements count', async () => {
    const notifications = [{ id: 'n1', read: false }];
    mockGetNotifications.mockResolvedValue(notifications);
    mockGetUnreadCount.mockResolvedValue(1);
    mockMarkNotificationAsRead.mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotificationsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(mockMarkNotificationAsRead).toHaveBeenCalledWith('n1');
    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('markAllAsRead updates all notifications', async () => {
    const notifications = [
      { id: 'n1', read: false },
      { id: 'n2', read: false },
    ];
    mockGetNotifications.mockResolvedValue(notifications);
    mockGetUnreadCount.mockResolvedValue(2);
    mockMarkAllNotificationsAsRead.mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotificationsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.notifications.every((n: any) => n.read)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('removeNotification deletes and updates list', async () => {
    const notifications = [{ id: 'n1', read: false }];
    mockGetNotifications.mockResolvedValue(notifications);
    mockGetUnreadCount.mockResolvedValue(1);
    mockDeleteNotification.mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotificationsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.removeNotification('n1');
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });
});

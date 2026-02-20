jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/notifications');
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test]' }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  AndroidImportance: { MAX: 5 },
}));
jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import { renderHook, waitFor } from '@testing-library/react-native';
import { useNotifications } from '../../src/hooks/useNotifications';
import * as notifService from '../../src/services/notifications';
import * as Notifications from 'expo-notifications';
import { createWrapper } from '../helpers/renderWithProviders';

const mockRegisterPushToken = notifService.registerPushToken as jest.Mock;
const mockRemovePushToken = notifService.removePushToken as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRegisterPushToken.mockResolvedValue(undefined);
  mockRemovePushToken.mockResolvedValue(undefined);
});

describe('useNotifications', () => {
  it('registers push token on mount when user is logged in', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockRegisterPushToken).toHaveBeenCalledWith(
        'test-user-id',
        'ExponentPushToken[test]'
      );
    });
  });

  it('does not register when no session', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper({ session: null }),
    });

    // Wait a tick to ensure effect had a chance to run
    await new Promise((r) => setTimeout(r, 50));
    expect(mockRegisterPushToken).not.toHaveBeenCalled();
  });

  it('sets up notification response listener', () => {
    renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
  });

  it('does not register when permission is denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

    renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockRegisterPushToken).not.toHaveBeenCalled();
  });
});

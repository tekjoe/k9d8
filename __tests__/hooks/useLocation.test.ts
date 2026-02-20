jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

import { renderHook, waitFor } from '@testing-library/react-native';
import { useLocation } from '../../src/hooks/useLocation';
import * as Location from 'expo-location';

const mockRequestPermissions = Location.requestForegroundPermissionsAsync as jest.Mock;
const mockGetPosition = Location.getCurrentPositionAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useLocation', () => {
  it('returns location when permission is granted', async () => {
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockResolvedValue({
      coords: { latitude: 44.98, longitude: -93.27 },
    });

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.location).toEqual({ latitude: 44.98, longitude: -93.27 });
    expect(result.current.errorMsg).toBeNull();
  });

  it('sets error when permission is denied', async () => {
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.location).toBeNull();
    expect(result.current.errorMsg).toBe('Permission to access location was denied');
  });

  it('sets error when getCurrentPositionAsync fails', async () => {
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockRejectedValue(new Error('GPS unavailable'));

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.location).toBeNull();
    expect(result.current.errorMsg).toBe('GPS unavailable');
  });

  it('starts in loading state', () => {
    mockRequestPermissions.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useLocation());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.location).toBeNull();
  });
});

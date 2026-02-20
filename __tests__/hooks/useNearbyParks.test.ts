jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/parks');

import { renderHook, waitFor } from '@testing-library/react-native';
import { useNearbyParks } from '../../src/hooks/useNearbyParks';
import * as parksService from '../../src/services/parks';

const mockGetParksInBounds = parksService.getParksInBounds as jest.Mock;
const mockGetActiveCheckInCounts = parksService.getActiveCheckInCounts as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useNearbyParks', () => {
  it('loads parks when user location is provided', async () => {
    const parks = [{ id: 'p1', name: 'Loring Park' }];
    const counts = { p1: 5 };
    mockGetParksInBounds.mockResolvedValue(parks);
    mockGetActiveCheckInCounts.mockResolvedValue(counts);

    const location = { latitude: 44.98, longitude: -93.27 };
    const { result } = renderHook(() => useNearbyParks(location, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.parks).toEqual(parks);
    expect(result.current.checkInCounts).toEqual(counts);
  });

  it('stays loading when location is null and not ready', () => {
    const { result } = renderHook(() => useNearbyParks(null, false));
    expect(result.current.loading).toBe(true);
    expect(result.current.parks).toEqual([]);
  });

  it('stops loading when locationReady but no location', async () => {
    const { result } = renderHook(() => useNearbyParks(null, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.parks).toEqual([]);
  });

  it('sets error on failure', async () => {
    mockGetParksInBounds.mockRejectedValue(new Error('Failed'));
    mockGetActiveCheckInCounts.mockResolvedValue({});

    const location = { latitude: 44.98, longitude: -93.27 };
    const { result } = renderHook(() => useNearbyParks(location, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Failed');
  });
});

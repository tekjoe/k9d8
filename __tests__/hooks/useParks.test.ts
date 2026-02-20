jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/parks');

import { renderHook, waitFor } from '@testing-library/react-native';
import { useParks } from '../../src/hooks/useParks';
import * as parksService from '../../src/services/parks';

const mockGetAllParks = parksService.getAllParks as jest.Mock;
const mockGetActiveCheckInCounts = parksService.getActiveCheckInCounts as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useParks', () => {
  it('loads parks and check-in counts on mount', async () => {
    const parks = [{ id: 'p1', name: 'Loring Park' }];
    const counts = { p1: 3 };
    mockGetAllParks.mockResolvedValue(parks);
    mockGetActiveCheckInCounts.mockResolvedValue(counts);

    const { result } = renderHook(() => useParks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.parks).toEqual(parks);
    expect(result.current.checkInCounts).toEqual(counts);
  });

  it('sets error on failure', async () => {
    mockGetAllParks.mockRejectedValue(new Error('Failed'));
    mockGetActiveCheckInCounts.mockResolvedValue({});

    const { result } = renderHook(() => useParks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Failed');
  });
});

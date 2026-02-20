jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/checkins');

import { renderHook, waitFor } from '@testing-library/react-native';
import { useNearbyPups } from '../../src/hooks/useNearbyPups';
import * as checkinsService from '../../src/services/checkins';

const mockGetAllActiveCheckIns = checkinsService.getAllActiveCheckIns as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useNearbyPups', () => {
  it('loads and flattens check-ins into pups', async () => {
    const checkIns = [
      {
        id: 'c1',
        park_id: 'p1',
        user_id: 'u1',
        park: { name: 'Loring Park' },
        profile: { display_name: 'Alice' },
        dogs: [
          { id: 'd1', name: 'Buddy' },
          { id: 'd2', name: 'Max' },
        ],
      },
    ];
    mockGetAllActiveCheckIns.mockResolvedValue(checkIns);

    const { result } = renderHook(() => useNearbyPups());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.pups).toHaveLength(2);
    expect(result.current.pups[0].dog.name).toBe('Buddy');
    expect(result.current.pups[0].parkName).toBe('Loring Park');
    expect(result.current.pups[0].ownerName).toBe('Alice');
  });

  it('handles load failure gracefully', async () => {
    mockGetAllActiveCheckIns.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNearbyPups());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.pups).toEqual([]);
  });

  it('returns empty pups when no check-ins', async () => {
    mockGetAllActiveCheckIns.mockResolvedValue([]);

    const { result } = renderHook(() => useNearbyPups());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.pups).toEqual([]);
  });

  it('handles check-ins with no dogs gracefully', async () => {
    mockGetAllActiveCheckIns.mockResolvedValue([
      {
        id: 'c1',
        park_id: 'p1',
        user_id: 'u1',
        park: { name: 'Park' },
        profile: { display_name: 'Bob' },
        dogs: undefined,
      },
    ]);

    const { result } = renderHook(() => useNearbyPups());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.pups).toEqual([]);
  });
});

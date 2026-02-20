jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/checkins');
jest.mock('../../src/services/friends');
jest.mock('../../src/services/playdates');

import { renderHook, waitFor } from '@testing-library/react-native';
import { useRecentActivity } from '../../src/hooks/useRecentActivity';
import * as checkinsService from '../../src/services/checkins';
import * as friendsService from '../../src/services/friends';
import * as playdatesService from '../../src/services/playdates';

const mockGetUserRecentCheckIns = checkinsService.getUserRecentCheckIns as jest.Mock;
const mockGetRecentFriendships = friendsService.getRecentFriendships as jest.Mock;
const mockGetMyPlayDates = playdatesService.getMyPlayDates as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useRecentActivity', () => {
  it('loads and combines activities', async () => {
    mockGetUserRecentCheckIns.mockResolvedValue([
      { id: 'c1', checked_in_at: '2024-06-01T10:00:00Z', park: { name: 'Dog Park' } },
    ]);
    mockGetRecentFriendships.mockResolvedValue([
      {
        id: 'f1',
        requester_id: 'u1',
        updated_at: '2024-06-01T09:00:00Z',
        addressee: { display_name: 'Bob' },
      },
    ]);
    mockGetMyPlayDates.mockResolvedValue([
      { id: 'pd1', starts_at: '2024-01-01T10:00:00Z', park: { name: 'Park A' } },
    ]);

    const { result } = renderHook(() => useRecentActivity('u1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.activities.length).toBeGreaterThan(0);
    expect(result.current.activities[0].type).toBe('check_in');
  });

  it('returns empty when userId is undefined', async () => {
    const { result } = renderHook(() => useRecentActivity(undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.activities).toEqual([]);
    expect(mockGetUserRecentCheckIns).not.toHaveBeenCalled();
  });

  it('handles load failure gracefully', async () => {
    mockGetUserRecentCheckIns.mockRejectedValue(new Error('fail'));
    mockGetRecentFriendships.mockRejectedValue(new Error('fail'));
    mockGetMyPlayDates.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useRecentActivity('u1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.activities).toEqual([]);
  });

  it('sorts activities most recent first', async () => {
    mockGetUserRecentCheckIns.mockResolvedValue([
      { id: 'c1', checked_in_at: '2024-06-01T08:00:00Z', park: { name: 'Park' } },
    ]);
    mockGetRecentFriendships.mockResolvedValue([
      {
        id: 'f1',
        requester_id: 'u1',
        updated_at: '2024-06-01T12:00:00Z',
        addressee: { display_name: 'Alice' },
      },
    ]);
    mockGetMyPlayDates.mockResolvedValue([]);

    const { result } = renderHook(() => useRecentActivity('u1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    // Friendship at 12:00 should come first
    expect(result.current.activities[0].type).toBe('friendship');
  });
});

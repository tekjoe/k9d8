jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/playdates');
jest.mock('../../src/hooks/useDogs', () => ({
  useDogs: jest.fn().mockReturnValue({ dogs: [{ id: 'd1', name: 'Buddy' }], loading: false }),
}));
jest.mock('../../src/utils/playdates', () => ({
  isPlaydateActive: jest.fn().mockReturnValue(true),
  isPlaydateExpired: jest.fn().mockReturnValue(false),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePlaydateDetail } from '../../src/hooks/usePlaydateDetail';
import * as playdatesService from '../../src/services/playdates';
import { createWrapper } from '../helpers/renderWithProviders';

const mockGetPlaydate = playdatesService.getPlaydateWithExpirationCheck as jest.Mock;
const mockRsvpToPlayDate = playdatesService.rsvpToPlayDate as jest.Mock;
const mockCancelRSVP = playdatesService.cancelRSVP as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('usePlaydateDetail', () => {
  const mockPlaydate = {
    id: 'pd1',
    organizer_id: 'other-user',
    status: 'active',
    starts_at: '2025-12-01T10:00:00Z',
    rsvps: [],
    park: { name: 'Dog Park' },
  };

  it('loads playdate on mount', async () => {
    mockGetPlaydate.mockResolvedValue(mockPlaydate);

    const { result } = renderHook(() => usePlaydateDetail('pd1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.playdate).toEqual(mockPlaydate);
    expect(result.current.isOrganizer).toBe(false);
  });

  it('sets error on load failure', async () => {
    mockGetPlaydate.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => usePlaydateDetail('pd1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Not found');
  });

  it('identifies organizer correctly', async () => {
    mockGetPlaydate.mockResolvedValue({
      ...mockPlaydate,
      organizer_id: 'test-user-id',
    });

    const { result } = renderHook(() => usePlaydateDetail('pd1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.isOrganizer).toBe(true);
  });

  it('handleRsvp adds rsvp to playdate', async () => {
    mockGetPlaydate.mockResolvedValue(mockPlaydate);
    const newRsvp = { id: 'r1', user_id: 'test-user-id', dog_id: 'd1', status: 'going' };
    mockRsvpToPlayDate.mockResolvedValue(newRsvp);

    const { result } = renderHook(() => usePlaydateDetail('pd1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleRsvp({ id: 'd1', name: 'Buddy' } as any);
    });

    expect(mockRsvpToPlayDate).toHaveBeenCalledWith('pd1', 'test-user-id', 'd1', 'going');
    expect(result.current.playdate?.rsvps).toContainEqual(newRsvp);
  });

  it('does not load when id is undefined', async () => {
    const { result } = renderHook(() => usePlaydateDetail(undefined), {
      wrapper: createWrapper(),
    });

    // Should stay in loading = true since loadPlaydate returns early
    expect(mockGetPlaydate).not.toHaveBeenCalled();
  });
});

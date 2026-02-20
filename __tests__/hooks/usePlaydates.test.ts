jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/playdates');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePlaydates } from '../../src/hooks/usePlaydates';
import * as playdatesService from '../../src/services/playdates';
import { createWrapper } from '../helpers/renderWithProviders';

const mockGetPlayDates = playdatesService.getPlayDates as jest.Mock;
const mockGetActivePlaydates = playdatesService.getActivePlaydates as jest.Mock;
const mockGetAllPlaydatesForUser = playdatesService.getAllPlaydatesForUser as jest.Mock;
const mockCreatePlayDate = playdatesService.createPlayDate as jest.Mock;
const mockCancelPlayDate = playdatesService.cancelPlayDate as jest.Mock;
const mockRsvpToPlayDate = playdatesService.rsvpToPlayDate as jest.Mock;
const mockCancelRSVP = playdatesService.cancelRSVP as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('usePlaydates', () => {
  it('loads playdates on mount with parkId', async () => {
    const upcoming = [{ id: 'pd1', starts_at: '2025-12-01' }];
    mockGetActivePlaydates.mockResolvedValue(upcoming);
    mockGetAllPlaydatesForUser.mockResolvedValue({ upcoming: [], past: [] });

    const { result } = renderHook(() => usePlaydates('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockGetActivePlaydates).toHaveBeenCalledWith('p1');
    expect(result.current.playdates).toEqual(upcoming);
  });

  it('loads playdates without parkId using getPlayDates', async () => {
    mockGetPlayDates.mockResolvedValue([]);
    mockGetAllPlaydatesForUser.mockResolvedValue({ upcoming: [], past: [] });

    const { result } = renderHook(() => usePlaydates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockGetPlayDates).toHaveBeenCalledWith(undefined);
  });

  it('sets error on failure', async () => {
    mockGetActivePlaydates.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => usePlaydates('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Server error');
  });

  it('create adds new playdate to list', async () => {
    mockGetActivePlaydates.mockResolvedValue([]);
    mockGetAllPlaydatesForUser.mockResolvedValue({ upcoming: [], past: [] });
    const newPlaydate = { id: 'pd2', starts_at: '2025-12-15' };
    mockCreatePlayDate.mockResolvedValue(newPlaydate);

    const { result } = renderHook(() => usePlaydates('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let created: any;
    await act(async () => {
      created = await result.current.create({ park_id: 'p1' } as any);
    });

    expect(created).toEqual(newPlaydate);
    expect(result.current.playdates).toContainEqual(newPlaydate);
  });

  it('cancel removes playdate from list', async () => {
    const playdate = { id: 'pd1', starts_at: '2025-12-01' };
    mockGetActivePlaydates.mockResolvedValue([playdate]);
    mockGetAllPlaydatesForUser.mockResolvedValue({ upcoming: [], past: [] });
    mockCancelPlayDate.mockResolvedValue({ ...playdate, status: 'cancelled' });

    const { result } = renderHook(() => usePlaydates('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.playdates).toHaveLength(1);
    });

    await act(async () => {
      await result.current.cancel('pd1');
    });

    expect(result.current.playdates).toEqual([]);
  });
});

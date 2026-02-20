jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/checkins');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCheckIn } from '../../src/hooks/useCheckIn';
import * as checkinsService from '../../src/services/checkins';
import { createWrapper } from '../helpers/renderWithProviders';

const mockGetActiveCheckIns = checkinsService.getActiveCheckIns as jest.Mock;
const mockGetUserActiveCheckIn = checkinsService.getUserActiveCheckIn as jest.Mock;
const mockCheckIn = checkinsService.checkIn as jest.Mock;
const mockCheckOut = checkinsService.checkOut as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useCheckIn', () => {
  it('loads active check-ins on mount', async () => {
    const active = [{ id: 'c1', park_id: 'p1', user_id: 'u2' }];
    mockGetActiveCheckIns.mockResolvedValue(active);
    mockGetUserActiveCheckIn.mockResolvedValue(null);

    const { result } = renderHook(() => useCheckIn('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.activeCheckIns).toEqual(active);
    expect(result.current.userCheckIn).toBeNull();
  });

  it('sets userCheckIn when user is checked in at this park', async () => {
    const userCheck = { id: 'c2', park_id: 'p1', user_id: 'test-user-id' };
    mockGetActiveCheckIns.mockResolvedValue([userCheck]);
    mockGetUserActiveCheckIn.mockResolvedValue(userCheck);

    const { result } = renderHook(() => useCheckIn('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.userCheckIn).toEqual(userCheck);
  });

  it('handles load failure gracefully', async () => {
    mockGetActiveCheckIns.mockRejectedValue(new Error('Network error'));
    mockGetUserActiveCheckIn.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCheckIn('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.activeCheckIns).toEqual([]);
  });

  it('checkIn calls service and reloads', async () => {
    mockGetActiveCheckIns.mockResolvedValue([]);
    mockGetUserActiveCheckIn.mockResolvedValue(null);
    mockCheckIn.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCheckIn('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.checkIn(['dog1']);
    });

    expect(mockCheckIn).toHaveBeenCalledWith('test-user-id', 'p1', ['dog1']);
  });

  it('checkOut calls service when user has active check-in', async () => {
    const userCheck = { id: 'c2', park_id: 'p1', user_id: 'test-user-id' };
    mockGetActiveCheckIns.mockResolvedValue([userCheck]);
    mockGetUserActiveCheckIn.mockResolvedValue(userCheck);
    mockCheckOut.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCheckIn('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.userCheckIn).not.toBeNull();
    });

    await act(async () => {
      await result.current.checkOut();
    });

    expect(mockCheckOut).toHaveBeenCalledWith('c2');
  });

  it('does nothing when parkId is empty', async () => {
    const { result } = renderHook(() => useCheckIn(''), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockGetActiveCheckIns).not.toHaveBeenCalled();
  });
});

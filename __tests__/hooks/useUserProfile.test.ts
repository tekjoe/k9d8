jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/dogs');
jest.mock('../../src/services/friends');
jest.mock('../../src/services/messages');
jest.mock('../../src/services/blocks');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useUserProfile } from '../../src/hooks/useUserProfile';
import { supabase } from '../../src/lib/supabase';
import * as dogsService from '../../src/services/dogs';
import * as friendsService from '../../src/services/friends';
import * as blocksService from '../../src/services/blocks';
import { createWrapper } from '../helpers/renderWithProviders';

const mockGetDogsByOwner = dogsService.getDogsByOwner as jest.Mock;
const mockGetFriendshipStatus = friendsService.getFriendshipStatus as jest.Mock;
const mockSendFriendRequest = friendsService.sendFriendRequest as jest.Mock;
const mockGetBlockStatus = blocksService.getBlockStatus as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  // Setup supabase.from chain for profile fetch
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: 'u2', display_name: 'Alice' },
      error: null,
    }),
  };
  (supabase.from as jest.Mock).mockReturnValue(chain);
});

describe('useUserProfile', () => {
  it('loads profile, dogs, friendship and block status', async () => {
    const dogs = [{ id: 'd1', name: 'Rex' }];
    mockGetDogsByOwner.mockResolvedValue(dogs);
    mockGetFriendshipStatus.mockResolvedValue(null);
    mockGetBlockStatus.mockResolvedValue(null);

    const { result } = renderHook(() => useUserProfile('u2'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.profile).toEqual({ id: 'u2', display_name: 'Alice' });
    expect(result.current.dogs).toEqual(dogs);
    expect(result.current.isFriend).toBe(false);
    expect(result.current.isOwnProfile).toBe(false);
  });

  it('identifies own profile', async () => {
    // Reconfigure chain for own profile
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'test-user-id', display_name: 'Me' },
        error: null,
      }),
    };
    (supabase.from as jest.Mock).mockReturnValue(chain);
    mockGetDogsByOwner.mockResolvedValue([]);

    const { result } = renderHook(() => useUserProfile('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.isOwnProfile).toBe(true);
    // Should not fetch friendship/block status for own profile
    expect(mockGetFriendshipStatus).not.toHaveBeenCalled();
  });

  it('handles profile load error', async () => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    };
    (supabase.from as jest.Mock).mockReturnValue(chain);
    mockGetDogsByOwner.mockResolvedValue([]);

    const { result } = renderHook(() => useUserProfile('u2'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    // Profile should remain null on error
    expect(result.current.profile).toBeNull();
  });

  it('handleSendRequest sends friend request', async () => {
    mockGetDogsByOwner.mockResolvedValue([]);
    mockGetFriendshipStatus.mockResolvedValue(null);
    mockGetBlockStatus.mockResolvedValue(null);
    const newFriendship = { id: 'f1', status: 'pending', requester_id: 'test-user-id' };
    mockSendFriendRequest.mockResolvedValue(newFriendship);

    const { result } = renderHook(() => useUserProfile('u2'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleSendRequest();
    });

    expect(mockSendFriendRequest).toHaveBeenCalledWith('test-user-id', 'u2');
    expect(result.current.isPending).toBe(true);
    expect(result.current.isSentByMe).toBe(true);
  });
});

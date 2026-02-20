jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/friends');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFriends } from '../../src/hooks/useFriends';
import * as friendsService from '../../src/services/friends';
import { createWrapper } from '../helpers/renderWithProviders';

const mockGetFriends = friendsService.getFriends as jest.Mock;
const mockGetPendingRequests = friendsService.getPendingRequests as jest.Mock;
const mockGetSentRequests = friendsService.getSentRequests as jest.Mock;
const mockSendFriendRequest = friendsService.sendFriendRequest as jest.Mock;
const mockAcceptFriendRequest = friendsService.acceptFriendRequest as jest.Mock;
const mockDeclineFriendRequest = friendsService.declineFriendRequest as jest.Mock;
const mockRemoveFriend = friendsService.removeFriend as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useFriends', () => {
  it('loads friends, pending, and sent requests on mount', async () => {
    const friends = [{ id: 'u2', display_name: 'Alice' }];
    const pending = [{ id: 'f1', status: 'pending' }];
    const sent = [{ id: 'f2', status: 'pending' }];
    mockGetFriends.mockResolvedValue(friends);
    mockGetPendingRequests.mockResolvedValue(pending);
    mockGetSentRequests.mockResolvedValue(sent);

    const { result } = renderHook(() => useFriends(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.friends).toEqual(friends);
    expect(result.current.pendingRequests).toEqual(pending);
    expect(result.current.sentRequests).toEqual(sent);
    expect(result.current.pendingCount).toBe(1);
  });

  it('handles load failure gracefully', async () => {
    mockGetFriends.mockRejectedValue(new Error('Network error'));
    mockGetPendingRequests.mockRejectedValue(new Error('Network error'));
    mockGetSentRequests.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFriends(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.friends).toEqual([]);
  });

  it('sendFriendRequest calls service', async () => {
    mockGetFriends.mockResolvedValue([]);
    mockGetPendingRequests.mockResolvedValue([]);
    mockGetSentRequests.mockResolvedValue([]);
    mockSendFriendRequest.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFriends(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.sendFriendRequest('u2');
    });

    expect(mockSendFriendRequest).toHaveBeenCalledWith('test-user-id', 'u2');
  });

  it('acceptFriendRequest calls service', async () => {
    mockGetFriends.mockResolvedValue([]);
    mockGetPendingRequests.mockResolvedValue([]);
    mockGetSentRequests.mockResolvedValue([]);
    mockAcceptFriendRequest.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFriends(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.acceptFriendRequest('f1');
    });

    expect(mockAcceptFriendRequest).toHaveBeenCalledWith('f1');
  });

  it('removeFriend calls service', async () => {
    mockGetFriends.mockResolvedValue([]);
    mockGetPendingRequests.mockResolvedValue([]);
    mockGetSentRequests.mockResolvedValue([]);
    mockRemoveFriend.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFriends(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.removeFriend('f1');
    });

    expect(mockRemoveFriend).toHaveBeenCalledWith('f1');
  });
});

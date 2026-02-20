jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/messages');

import { renderHook, waitFor } from '@testing-library/react-native';
import { useConversations } from '../../src/hooks/useConversations';
import * as messagesService from '../../src/services/messages';
import { createWrapper } from '../helpers/renderWithProviders';

const mockGetConversations = messagesService.getConversations as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useConversations', () => {
  it('loads conversations on mount', async () => {
    const conversations = [
      { id: 'conv1', last_message_at: '2024-01-01T00:00:00Z', participants: [] },
    ];
    mockGetConversations.mockResolvedValue(conversations);

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.conversations).toEqual(conversations);
  });

  it('computes unread count from participants', async () => {
    const conversations = [
      {
        id: 'conv1',
        last_message_at: '2024-06-01T12:00:00Z',
        participants: [
          { user_id: 'test-user-id', last_read_at: '2024-06-01T10:00:00Z' },
        ],
      },
      {
        id: 'conv2',
        last_message_at: '2024-06-01T08:00:00Z',
        participants: [
          { user_id: 'test-user-id', last_read_at: '2024-06-01T09:00:00Z' },
        ],
      },
    ];
    mockGetConversations.mockResolvedValue(conversations);

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    // conv1 is unread (last_message_at > last_read_at), conv2 is read
    expect(result.current.unreadCount).toBe(1);
  });

  it('handles load failure gracefully', async () => {
    mockGetConversations.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.conversations).toEqual([]);
  });

  it('refresh reloads conversations', async () => {
    mockGetConversations.mockResolvedValue([]);

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockGetConversations.mockResolvedValue([{ id: 'conv2', last_message_at: '2024-01-02', participants: [] }]);

    await result.current.refresh();

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1);
    });
  });
});

jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/messages');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useMessages } from '../../src/hooks/useMessages';
import * as messagesService from '../../src/services/messages';
import { createWrapper } from '../helpers/renderWithProviders';

const mockGetMessages = messagesService.getMessages as jest.Mock;
const mockSendMessage = messagesService.sendMessage as jest.Mock;
const mockMarkConversationRead = messagesService.markConversationRead as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useMessages', () => {
  it('loads messages on mount', async () => {
    const messages = [
      { id: 'm1', content: 'Hello', conversation_id: 'conv1', created_at: '2024-01-01' },
    ];
    mockGetMessages.mockResolvedValue(messages);
    mockMarkConversationRead.mockResolvedValue(undefined);

    const { result } = renderHook(() => useMessages('conv1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.messages).toEqual(messages);
    expect(mockMarkConversationRead).toHaveBeenCalledWith('conv1', 'test-user-id');
  });

  it('sets hasMore to false when fewer than 50 messages', async () => {
    mockGetMessages.mockResolvedValue([{ id: 'm1' }]);
    mockMarkConversationRead.mockResolvedValue(undefined);

    const { result } = renderHook(() => useMessages('conv1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.hasMore).toBe(false);
  });

  it('handles load failure gracefully', async () => {
    mockGetMessages.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMessages('conv1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.messages).toEqual([]);
  });

  it('sendMessage calls service and adds message optimistically', async () => {
    mockGetMessages.mockResolvedValue([]);
    mockMarkConversationRead.mockResolvedValue(undefined);
    const newMsg = { id: 'm2', content: 'Hi there', conversation_id: 'conv1' };
    mockSendMessage.mockResolvedValue(newMsg);

    const { result } = renderHook(() => useMessages('conv1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.sendMessage('Hi there');
    });

    expect(mockSendMessage).toHaveBeenCalledWith('conv1', 'test-user-id', 'Hi there');
    expect(result.current.messages).toContainEqual(newMsg);
  });
});

jest.mock('../../../src/lib/supabase');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MessageBubble from '../../../src/components/messages/MessageBubble';
import type { Message } from '../../../src/types/database';

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  conversation_id: 'conv-1',
  sender_id: 'user-1',
  content: 'Hello there!',
  created_at: '2024-06-15T14:30:00Z',
  ...overrides,
});

describe('MessageBubble', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(
      <MessageBubble message={makeMessage()} isOwn={true} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('displays message content', () => {
    const { getByText } = render(
      <MessageBubble message={makeMessage()} isOwn={false} />
    );
    expect(getByText('Hello there!')).toBeTruthy();
  });

  it('calls onReport on long press for non-own messages', () => {
    const onReport = jest.fn();
    const { getByText } = render(
      <MessageBubble message={makeMessage()} isOwn={false} onReport={onReport} />
    );
    fireEvent(getByText('Hello there!'), 'longPress');
    expect(onReport).toHaveBeenCalledWith('msg-1');
  });

  it('does not call onReport on long press for own messages', () => {
    const onReport = jest.fn();
    const { getByText } = render(
      <MessageBubble message={makeMessage()} isOwn={true} onReport={onReport} />
    );
    fireEvent(getByText('Hello there!'), 'longPress');
    expect(onReport).not.toHaveBeenCalled();
  });
});

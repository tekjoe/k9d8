jest.mock('../../../src/lib/supabase');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ConversationListItem from '../../../src/components/messages/ConversationListItem';
import type { Conversation } from '../../../src/types/database';

const makeConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conv-1',
  last_message_at: new Date().toISOString(),
  last_message_preview: 'Hey, want to meet at the park?',
  created_at: '2024-01-01T00:00:00Z',
  participants: [
    {
      id: 'p1',
      conversation_id: 'conv-1',
      user_id: 'current-user',
      last_read_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: '',
      profile: { id: 'current-user', email: '', display_name: 'Me', avatar_url: null, created_at: '', updated_at: '' },
    },
    {
      id: 'p2',
      conversation_id: 'conv-1',
      user_id: 'other-user',
      last_read_at: '',
      created_at: '',
      profile: { id: 'other-user', email: '', display_name: 'Alice Smith', avatar_url: null, created_at: '', updated_at: '' },
    },
  ],
  ...overrides,
});

describe('ConversationListItem', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(
      <ConversationListItem
        conversation={makeConversation()}
        currentUserId="current-user"
        onPress={jest.fn()}
      />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('displays other participant name', () => {
    const { getByText } = render(
      <ConversationListItem
        conversation={makeConversation()}
        currentUserId="current-user"
        onPress={jest.fn()}
      />
    );
    expect(getByText('Alice Smith')).toBeTruthy();
  });

  it('displays last message preview', () => {
    const { getByText } = render(
      <ConversationListItem
        conversation={makeConversation()}
        currentUserId="current-user"
        onPress={jest.fn()}
      />
    );
    expect(getByText('Hey, want to meet at the park?')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ConversationListItem
        conversation={makeConversation()}
        currentUserId="current-user"
        onPress={onPress}
      />
    );
    fireEvent.press(getByText('Alice Smith'));
    expect(onPress).toHaveBeenCalled();
  });
});

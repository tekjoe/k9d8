jest.mock('../../../src/lib/supabase');
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ParkReviewCard from '../../../src/components/parks/ParkReviewCard';
import type { ParkReview } from '../../../src/types/database';

const makeReview = (overrides: Partial<ParkReview> = {}): ParkReview => ({
  id: 'r1',
  park_id: 'park-1',
  user_id: 'u1',
  parent_id: null,
  content: 'This park is fantastic!',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user: { id: 'u1', email: 'alice@test.com', display_name: 'Alice', avatar_url: null, created_at: '', updated_at: '' },
  vote_count: 5,
  user_has_voted: false,
  replies: [],
  ...overrides,
});

describe('ParkReviewCard', () => {
  const defaultProps = {
    review: makeReview(),
    onVote: jest.fn(),
    onDelete: jest.fn(),
    onReport: jest.fn(),
    onReply: jest.fn(),
    isOwner: false,
    isAuthenticated: true,
  };

  it('renders without crashing', () => {
    const { toJSON } = render(<ParkReviewCard {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays review content and user name', () => {
    const { getByText } = render(<ParkReviewCard {...defaultProps} />);
    expect(getByText('This park is fantastic!')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
  });

  it('displays vote count', () => {
    const { getByText } = render(<ParkReviewCard {...defaultProps} />);
    expect(getByText('5')).toBeTruthy();
  });

  it('shows Reply button for authenticated non-reply reviews', () => {
    const { getByText } = render(<ParkReviewCard {...defaultProps} />);
    expect(getByText('Reply')).toBeTruthy();
  });

  it('does not show Reply button when isReply is true', () => {
    const { queryByText } = render(<ParkReviewCard {...defaultProps} isReply />);
    expect(queryByText('Reply')).toBeNull();
  });

  it('shows delete button for owner', () => {
    const { getByTestId } = render(<ParkReviewCard {...defaultProps} isOwner />);
    expect(getByTestId('icon-trash-outline')).toBeTruthy();
  });
});

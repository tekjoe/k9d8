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
import ParkPhotoCard from '../../../src/components/parks/ParkPhotoCard';
import type { ParkPhoto } from '../../../src/types/database';

const makePhoto = (overrides: Partial<ParkPhoto> = {}): ParkPhoto => ({
  id: 'photo-1',
  park_id: 'park-1',
  user_id: 'u1',
  photo_url: 'http://example.com/photo.jpg',
  created_at: '2024-01-01T00:00:00Z',
  user: { id: 'u1', email: '', display_name: 'Alice', avatar_url: null, created_at: '', updated_at: '' },
  vote_count: 3,
  user_has_voted: false,
  ...overrides,
});

describe('ParkPhotoCard', () => {
  const defaultProps = {
    photo: makePhoto(),
    onVote: jest.fn(),
    onDelete: jest.fn(),
    onReport: jest.fn(),
    isOwner: false,
    isAuthenticated: true,
  };

  it('renders without crashing', () => {
    const { toJSON } = render(<ParkPhotoCard {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays user name', () => {
    const { getByText } = render(<ParkPhotoCard {...defaultProps} />);
    expect(getByText('Alice')).toBeTruthy();
  });

  it('displays vote count', () => {
    const { getByText } = render(<ParkPhotoCard {...defaultProps} />);
    expect(getByText('3')).toBeTruthy();
  });

  it('shows vote button for authenticated users', () => {
    const onVote = jest.fn();
    const { getByTestId } = render(
      <ParkPhotoCard {...defaultProps} onVote={onVote} />
    );
    expect(getByTestId('icon-heart-outline')).toBeTruthy();
  });

  it('shows delete button for owner', () => {
    const { getByTestId } = render(
      <ParkPhotoCard {...defaultProps} isOwner />
    );
    expect(getByTestId('icon-trash-outline')).toBeTruthy();
  });

  it('shows report button for non-owner authenticated users', () => {
    const { getByTestId } = render(
      <ParkPhotoCard {...defaultProps} isOwner={false} />
    );
    expect(getByTestId('icon-flag-outline')).toBeTruthy();
  });
});

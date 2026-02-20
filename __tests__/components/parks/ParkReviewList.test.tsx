jest.mock('../../../src/lib/supabase');
jest.mock('../../../src/hooks/useParkReviews', () => ({
  useParkReviews: jest.fn(() => ({
    reviews: [],
    loading: false,
    sortBy: 'votes',
    setSortBy: jest.fn(),
    createReview: jest.fn(),
    vote: jest.fn(),
    deleteReview: jest.fn(),
    report: jest.fn(),
  })),
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});

import React from 'react';
import { render } from '@testing-library/react-native';
import ParkReviewList from '../../../src/components/parks/ParkReviewList';
import { useParkReviews } from '../../../src/hooks/useParkReviews';

const mockUseParkReviews = useParkReviews as jest.Mock;

describe('ParkReviewList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(
      <ParkReviewList parkId="park-1" isAuthenticated={false} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('shows empty state for unauthenticated users', () => {
    const { getByText } = render(
      <ParkReviewList parkId="park-1" isAuthenticated={false} />
    );
    expect(getByText('Sign in to write a review')).toBeTruthy();
  });

  it('shows empty state for authenticated users', () => {
    const { getByText } = render(
      <ParkReviewList parkId="park-1" isAuthenticated={true} userId="u1" />
    );
    expect(getByText('Be the first to review this park!')).toBeTruthy();
  });

  it('shows "Write a Review" button for authenticated users', () => {
    const { getByText } = render(
      <ParkReviewList parkId="park-1" isAuthenticated={true} userId="u1" />
    );
    expect(getByText('Write a Review')).toBeTruthy();
  });

  it('shows review count when reviews exist', () => {
    mockUseParkReviews.mockReturnValue({
      reviews: [
        { id: 'r1', content: 'Great park!', user_id: 'u2', created_at: new Date().toISOString(), vote_count: 0, user_has_voted: false, user: { display_name: 'Alice' } },
      ],
      loading: false,
      sortBy: 'votes',
      setSortBy: jest.fn(),
      createReview: jest.fn(),
      vote: jest.fn(),
      deleteReview: jest.fn(),
      report: jest.fn(),
    });
    const { getByText } = render(
      <ParkReviewList parkId="park-1" isAuthenticated={false} />
    );
    expect(getByText('Reviews (1)')).toBeTruthy();
  });
});

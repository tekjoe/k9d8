jest.mock('../../../src/lib/supabase');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CheckInButton } from '../../../src/components/parks/CheckInButton';
import type { Dog } from '../../../src/types/database';

const makeDog = (id: string, name: string): Dog => ({
  id,
  owner_id: 'user-1',
  name,
  breed: 'Lab',
  size: 'large',
  temperament: ['friendly'],
  age_years: 3,
  photo_url: null,
  notes: null,
  color: null,
  weight_lbs: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
});

describe('CheckInButton', () => {
  const defaultProps = {
    userCheckIn: null,
    dogs: [makeDog('d1', 'Rex'), makeDog('d2', 'Spot')],
    onCheckIn: jest.fn(),
    onCheckOut: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<CheckInButton {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows "Check In" when not checked in', () => {
    const { getByText } = render(<CheckInButton {...defaultProps} />);
    expect(getByText('Check In')).toBeTruthy();
  });

  it('shows "Check Out" when checked in', () => {
    const { getByText } = render(
      <CheckInButton
        {...defaultProps}
        userCheckIn={{ id: 'ci-1', user_id: 'u1', park_id: 'p1', checked_in_at: '', checked_out_at: null }}
      />
    );
    expect(getByText('Check Out')).toBeTruthy();
  });

  it('calls onCheckOut directly when checked in', () => {
    const onCheckOut = jest.fn();
    const { getByText } = render(
      <CheckInButton
        {...defaultProps}
        userCheckIn={{ id: 'ci-1', user_id: 'u1', park_id: 'p1', checked_in_at: '', checked_out_at: null }}
        onCheckOut={onCheckOut}
      />
    );
    fireEvent.press(getByText('Check Out'));
    expect(onCheckOut).toHaveBeenCalled();
  });

  it('opens modal when checking in', () => {
    const { getByText } = render(<CheckInButton {...defaultProps} />);
    fireEvent.press(getByText('Check In'));
    expect(getByText('Select Dogs to Bring')).toBeTruthy();
  });
});

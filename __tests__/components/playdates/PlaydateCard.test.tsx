jest.mock('../../../src/lib/supabase');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PlaydateCard } from '../../../src/components/playdates/PlaydateCard';
import type { PlayDate } from '../../../src/types/database';

const futureDate = new Date(Date.now() + 86400000 * 7);
const futureEndDate = new Date(futureDate.getTime() + 7200000);

const makePlaydate = (overrides: Partial<PlayDate> = {}): PlayDate => ({
  id: 'pd-1',
  organizer_id: 'u1',
  park_id: 'park-1',
  title: 'Sunday Meetup',
  description: 'Fun at the park',
  starts_at: futureDate.toISOString(),
  ends_at: futureEndDate.toISOString(),
  max_dogs: 10,
  status: 'scheduled',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  organizer: { id: 'u1', email: 'org@test.com', display_name: 'Organizer', avatar_url: null, created_at: '', updated_at: '' },
  park: {
    id: 'park-1', name: 'Central Park', description: null, latitude: 0, longitude: 0,
    address: null, city: null, state: null, image_url: null, amenities: [],
    is_fenced: false, has_water: false, has_shade: false, created_at: '',
  },
  rsvps: [
    { id: 'rsvp-1', play_date_id: 'pd-1', user_id: 'u2', dog_id: 'd1', status: 'going', created_at: '' },
    { id: 'rsvp-2', play_date_id: 'pd-1', user_id: 'u3', dog_id: 'd2', status: 'going', created_at: '' },
  ],
  ...overrides,
});

describe('PlaydateCard', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<PlaydateCard playdate={makePlaydate()} />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays playdate title', () => {
    const { getByText } = render(<PlaydateCard playdate={makePlaydate()} />);
    expect(getByText('Sunday Meetup')).toBeTruthy();
  });

  it('displays park name', () => {
    const { getByText } = render(<PlaydateCard playdate={makePlaydate()} />);
    expect(getByText('Central Park')).toBeTruthy();
  });

  it('displays organizer name', () => {
    const { getByText } = render(<PlaydateCard playdate={makePlaydate()} />);
    expect(getByText('Organized by Organizer')).toBeTruthy();
  });

  it('shows RSVP count', () => {
    const { getByText } = render(<PlaydateCard playdate={makePlaydate()} />);
    expect(getByText('2 dogs going')).toBeTruthy();
  });

  it('shows cancelled badge when cancelled', () => {
    const { getByText } = render(
      <PlaydateCard playdate={makePlaydate({ status: 'cancelled' })} />
    );
    expect(getByText('Cancelled')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PlaydateCard playdate={makePlaydate()} onPress={onPress} />
    );
    fireEvent.press(getByText('Sunday Meetup'));
    expect(onPress).toHaveBeenCalled();
  });
});

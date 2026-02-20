jest.mock('../../../src/lib/supabase');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ParkCard from '../../../src/components/parks/ParkCard';
import type { Park } from '../../../src/types/database';

const makePark = (overrides: Partial<Park> = {}): Park => ({
  id: 'park-1',
  name: 'Sunny Dog Park',
  description: 'A great park',
  latitude: 37.7749,
  longitude: -122.4194,
  address: '123 Main St, San Francisco, CA',
  city: 'San Francisco',
  state: 'CA',
  image_url: null,
  amenities: ['Benches', 'Waste Stations'],
  is_fenced: true,
  has_water: true,
  has_shade: false,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('ParkCard', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<ParkCard park={makePark()} onPress={jest.fn()} />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays park name and address', () => {
    const { getByText } = render(<ParkCard park={makePark()} onPress={jest.fn()} />);
    expect(getByText('Sunny Dog Park')).toBeTruthy();
    expect(getByText('123 Main St, San Francisco, CA')).toBeTruthy();
  });

  it('displays feature badges for active features', () => {
    const { getByText, queryByText } = render(
      <ParkCard park={makePark()} onPress={jest.fn()} />
    );
    expect(getByText('Fenced')).toBeTruthy();
    expect(getByText('Water')).toBeTruthy();
    expect(queryByText('Shade')).toBeNull();
  });

  it('displays amenity chips', () => {
    const { getByText } = render(<ParkCard park={makePark()} onPress={jest.fn()} />);
    expect(getByText('Benches')).toBeTruthy();
    expect(getByText('Waste Stations')).toBeTruthy();
  });

  it('displays distance when provided', () => {
    const { getByText } = render(
      <ParkCard park={makePark()} distanceKm={2.5} onPress={jest.fn()} />
    );
    expect(getByText('2.5 km')).toBeTruthy();
  });

  it('displays distance in meters when less than 1km', () => {
    const { getByText } = render(
      <ParkCard park={makePark()} distanceKm={0.5} onPress={jest.fn()} />
    );
    expect(getByText('500 m')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<ParkCard park={makePark()} onPress={onPress} />);
    fireEvent.press(getByText('Sunny Dog Park'));
    expect(onPress).toHaveBeenCalled();
  });
});

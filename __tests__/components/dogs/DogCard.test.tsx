jest.mock('../../../src/lib/supabase');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DogCard } from '../../../src/components/dogs/DogCard';
import type { Dog } from '../../../src/types/database';

const makeDog = (overrides: Partial<Dog> = {}): Dog => ({
  id: 'dog-1',
  owner_id: 'user-1',
  name: 'Buddy',
  breed: 'Golden Retriever',
  size: 'large',
  temperament: ['friendly', 'energetic'],
  age_years: 3,
  photo_url: null,
  notes: null,
  color: 'Golden',
  weight_lbs: 65,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('DogCard', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<DogCard dog={makeDog()} />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the dog name and breed', () => {
    const { getByText } = render(<DogCard dog={makeDog()} />);
    expect(getByText('Buddy')).toBeTruthy();
    expect(getByText('Golden Retriever')).toBeTruthy();
  });

  it('displays temperament labels', () => {
    const { getByText } = render(<DogCard dog={makeDog()} />);
    expect(getByText('Friendly, Energetic')).toBeTruthy();
  });

  it('shows placeholder initial when no photo', () => {
    const { getByText } = render(<DogCard dog={makeDog({ photo_url: null })} />);
    expect(getByText('B')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<DogCard dog={makeDog()} onPress={onPress} />);
    fireEvent.press(getByText('Buddy'));
    expect(onPress).toHaveBeenCalled();
  });
});

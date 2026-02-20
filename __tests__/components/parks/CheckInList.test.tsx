jest.mock('../../../src/lib/supabase');

import React from 'react';
import { render } from '@testing-library/react-native';
import { CheckInList } from '../../../src/components/parks/CheckInList';
import type { CheckIn } from '../../../src/types/database';

const makeCheckIn = (id: string, displayName: string, dogNames: string[]): CheckIn => ({
  id,
  user_id: `user-${id}`,
  park_id: 'park-1',
  checked_in_at: new Date().toISOString(),
  checked_out_at: null,
  profile: { id: `user-${id}`, email: '', display_name: displayName, avatar_url: null, created_at: '', updated_at: '' },
  dogs: dogNames.map((name, i) => ({
    id: `dog-${id}-${i}`,
    owner_id: `user-${id}`,
    name,
    breed: null,
    size: 'medium' as const,
    temperament: ['friendly' as const],
    age_years: null,
    photo_url: null,
    notes: null,
    color: null,
    weight_lbs: null,
    is_active: true,
    created_at: '',
    updated_at: '',
  })),
});

describe('CheckInList', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<CheckInList activeCheckIns={[]} />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows empty state when no check-ins', () => {
    const { getByText } = render(<CheckInList activeCheckIns={[]} />);
    expect(getByText('No one is here right now')).toBeTruthy();
    expect(getByText('0 dogs at this park')).toBeTruthy();
  });

  it('displays check-in items with dog counts', () => {
    const checkIns = [
      makeCheckIn('1', 'Alice', ['Rex', 'Spot']),
      makeCheckIn('2', 'Bob', ['Luna']),
    ];
    const { getByText } = render(<CheckInList activeCheckIns={checkIns} />);
    expect(getByText('3 dogs at this park')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
    expect(getByText('Rex')).toBeTruthy();
    expect(getByText('Luna')).toBeTruthy();
  });
});

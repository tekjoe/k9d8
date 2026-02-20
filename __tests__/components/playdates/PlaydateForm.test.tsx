jest.mock('../../../src/lib/supabase');
jest.mock('react-native-modal-datetime-picker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => (props.isVisible ? React.createElement('DateTimePicker') : null),
  };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});

import React from 'react';
import { render } from '@testing-library/react-native';
import { PlaydateForm } from '../../../src/components/playdates/PlaydateForm';
import type { Park } from '../../../src/types/database';

const makeParks = (): Park[] => [
  {
    id: 'p1', name: 'Central Park', description: null, latitude: 0, longitude: 0,
    address: '123 Main St', city: null, state: null, image_url: null, amenities: [],
    is_fenced: false, has_water: false, has_shade: false, created_at: '',
  },
  {
    id: 'p2', name: 'Riverside Park', description: null, latitude: 0, longitude: 0,
    address: null, city: null, state: null, image_url: null, amenities: [],
    is_fenced: false, has_water: false, has_shade: false, created_at: '',
  },
];

describe('PlaydateForm', () => {
  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

  it('renders without crashing', () => {
    const { toJSON } = render(
      <PlaydateForm parks={makeParks()} onSubmit={mockOnSubmit} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('displays all form fields', () => {
    const { getByText } = render(
      <PlaydateForm parks={makeParks()} onSubmit={mockOnSubmit} />
    );
    expect(getByText('Title *')).toBeTruthy();
    expect(getByText('Description')).toBeTruthy();
    expect(getByText('Park *')).toBeTruthy();
    expect(getByText('Starts At *')).toBeTruthy();
    expect(getByText('Ends At *')).toBeTruthy();
    expect(getByText('Max Dogs (optional)')).toBeTruthy();
  });

  it('displays custom submit label', () => {
    const { getByText } = render(
      <PlaydateForm parks={makeParks()} onSubmit={mockOnSubmit} submitLabel="Update Play Date" />
    );
    expect(getByText('Update Play Date')).toBeTruthy();
  });

  it('shows default submit label', () => {
    const { getByText } = render(
      <PlaydateForm parks={makeParks()} onSubmit={mockOnSubmit} />
    );
    expect(getByText('Create Play Date')).toBeTruthy();
  });
});

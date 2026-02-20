jest.mock('../../../src/lib/supabase');
jest.mock('../../../src/components/ImagePickerWithModeration', () => ({
  ImagePickerWithModeration: (props: any) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(View, { testID: 'image-picker' },
      React.createElement(Text, null, props.placeholder || 'Image Picker')
    );
  },
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DogForm } from '../../../src/components/dogs/DogForm';

describe('DogForm', () => {
  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<DogForm onSubmit={mockOnSubmit} />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays all form fields', () => {
    const { getByText } = render(<DogForm onSubmit={mockOnSubmit} />);
    expect(getByText('Name *')).toBeTruthy();
    expect(getByText('Breed')).toBeTruthy();
    expect(getByText('Age (years)')).toBeTruthy();
    expect(getByText('Size')).toBeTruthy();
    expect(getByText('Temperament (select all that apply)')).toBeTruthy();
    expect(getByText('Color')).toBeTruthy();
    expect(getByText('Weight (lbs)')).toBeTruthy();
    expect(getByText('Notes')).toBeTruthy();
  });

  it('displays custom submit label', () => {
    const { getByText } = render(
      <DogForm onSubmit={mockOnSubmit} submitLabel="Add Dog" />
    );
    expect(getByText('Add Dog')).toBeTruthy();
  });

  it('shows error when submitting without name', async () => {
    const { getByText } = render(<DogForm onSubmit={mockOnSubmit} />);
    fireEvent.press(getByText('Save'));
    await waitFor(() => {
      expect(getByText('Name is required')).toBeTruthy();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('renders size options', () => {
    const { getByText } = render(<DogForm onSubmit={mockOnSubmit} />);
    expect(getByText('Small')).toBeTruthy();
    expect(getByText('Medium')).toBeTruthy();
    expect(getByText('Large')).toBeTruthy();
    expect(getByText('XL')).toBeTruthy();
  });
});

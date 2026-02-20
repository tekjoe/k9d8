jest.mock('../../../src/lib/supabase');

import React from 'react';
import { render } from '@testing-library/react-native';
import { DogSizeTag } from '../../../src/components/dogs/DogSizeTag';

describe('DogSizeTag', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<DogSizeTag size="medium" />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the correct label for each size', () => {
    const cases: Array<{ size: 'small' | 'medium' | 'large' | 'extra_large'; label: string }> = [
      { size: 'small', label: 'S' },
      { size: 'medium', label: 'M' },
      { size: 'large', label: 'L' },
      { size: 'extra_large', label: 'XL' },
    ];

    for (const { size, label } of cases) {
      const { getByText, unmount } = render(<DogSizeTag size={size} />);
      expect(getByText(label)).toBeTruthy();
      unmount();
    }
  });
});

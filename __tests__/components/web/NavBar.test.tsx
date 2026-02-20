jest.mock('../../../src/lib/supabase');
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});

import React from 'react';
import { render } from '@testing-library/react-native';
import NavBar from '../../../src/components/web/NavBar';

describe('NavBar', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<NavBar />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the brand name', () => {
    const { getByText } = render(<NavBar />);
    expect(getByText('k9d8')).toBeTruthy();
  });
});

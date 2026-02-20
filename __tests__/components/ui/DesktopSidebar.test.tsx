jest.mock('../../../src/lib/supabase');
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import DesktopSidebar from '../../../src/components/ui/DesktopSidebar';

describe('DesktopSidebar', () => {
  it('renders null on non-web platforms', () => {
    const originalOS = Platform.OS;
    (Platform as any).OS = 'ios';
    const { toJSON } = render(<DesktopSidebar />);
    expect(toJSON()).toBeNull();
    (Platform as any).OS = originalOS;
  });

  it('renders on web platform', () => {
    const originalOS = Platform.OS;
    (Platform as any).OS = 'web';
    const { toJSON } = render(<DesktopSidebar />);
    // On web it should render something
    expect(toJSON()).toBeTruthy();
    (Platform as any).OS = originalOS;
  });
});

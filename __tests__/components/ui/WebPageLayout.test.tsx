jest.mock('../../../src/lib/supabase');
jest.mock('../../../src/hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => ({
    isMobile: false,
    isTablet: false,
    showSidebar: false,
  }),
}));
jest.mock('../../../src/components/ui/DesktopSidebar', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('DesktopSidebar'),
  };
});

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import WebPageLayout from '../../../src/components/ui/WebPageLayout';

describe('WebPageLayout', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(
      <WebPageLayout>
        <Text>Content</Text>
      </WebPageLayout>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders children', () => {
    const { getByText } = render(
      <WebPageLayout>
        <Text>Page Content</Text>
      </WebPageLayout>
    );
    expect(getByText('Page Content')).toBeTruthy();
  });

  it('renders header when provided', () => {
    const { getByText } = render(
      <WebPageLayout header={<Text>Header</Text>}>
        <Text>Content</Text>
      </WebPageLayout>
    );
    expect(getByText('Header')).toBeTruthy();
  });
});

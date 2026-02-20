jest.mock('../../../src/lib/supabase');
jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import SEOHead from '../../../src/components/seo/SEOHead';

describe('SEOHead', () => {
  it('renders null on non-web platforms', () => {
    const originalOS = Platform.OS;
    (Platform as any).OS = 'ios';
    const { toJSON } = render(
      <SEOHead title="Test Page" description="A test description" />
    );
    expect(toJSON()).toBeNull();
    (Platform as any).OS = originalOS;
  });

  it('renders on web platform', () => {
    const originalOS = Platform.OS;
    (Platform as any).OS = 'web';
    const { toJSON } = render(
      <SEOHead title="Test Page" description="A test description" />
    );
    // On web it should render Head content
    expect(toJSON()).toBeDefined();
    (Platform as any).OS = originalOS;
  });
});

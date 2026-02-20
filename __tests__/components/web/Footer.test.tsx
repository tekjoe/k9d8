jest.mock('../../../src/lib/supabase');

import React from 'react';
import { render } from '@testing-library/react-native';
import Footer from '../../../src/components/web/Footer';

describe('Footer', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<Footer />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the brand name', () => {
    const { getByText } = render(<Footer />);
    expect(getByText('k9d8')).toBeTruthy();
  });

  it('displays copyright text', () => {
    const { getByText } = render(<Footer />);
    expect(getByText(/2026 k9d8/)).toBeTruthy();
  });

  it('displays section headers', () => {
    const { getByText } = render(<Footer />);
    expect(getByText('Product')).toBeTruthy();
    expect(getByText('Explore')).toBeTruthy();
    expect(getByText('Legal')).toBeTruthy();
  });

  it('displays footer links', () => {
    const { getByText } = render(<Footer />);
    expect(getByText('Features')).toBeTruthy();
    expect(getByText('Download')).toBeTruthy();
    expect(getByText('Dog Parks')).toBeTruthy();
    expect(getByText('Blog')).toBeTruthy();
    expect(getByText('Privacy Policy')).toBeTruthy();
    expect(getByText('Terms of Service')).toBeTruthy();
  });
});

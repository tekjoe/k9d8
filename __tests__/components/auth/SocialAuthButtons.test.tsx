jest.mock('../../../src/lib/supabase');
jest.mock('../../../src/services/auth', () => ({
  signInWithGoogle: jest.fn().mockResolvedValue(undefined),
  signInWithApple: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SocialAuthButtons } from '../../../src/components/auth/SocialAuthButtons';
import { signInWithGoogle } from '../../../src/services/auth';

describe('SocialAuthButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<SocialAuthButtons mode="sign-in" />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows "Sign in with Google" for sign-in mode', () => {
    const { getByText } = render(<SocialAuthButtons mode="sign-in" />);
    expect(getByText('Sign in with Google')).toBeTruthy();
  });

  it('shows "Sign up with Google" for sign-up mode', () => {
    const { getByText } = render(<SocialAuthButtons mode="sign-up" />);
    expect(getByText('Sign up with Google')).toBeTruthy();
  });

  it('shows "or" divider', () => {
    const { getByText } = render(<SocialAuthButtons mode="sign-in" />);
    expect(getByText('or')).toBeTruthy();
  });

  it('calls signInWithGoogle when Google button is pressed', async () => {
    const { getByText } = render(<SocialAuthButtons mode="sign-in" />);
    fireEvent.press(getByText('Sign in with Google'));
    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalled();
    });
  });
});

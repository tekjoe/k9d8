import React from 'react';
import { renderHook, type RenderHookOptions } from '@testing-library/react-native';
import { AuthContext } from '../../src/providers/AuthProvider';
import type { Session } from '@supabase/supabase-js';

interface AuthOverrides {
  session?: Session | null;
  isLoading?: boolean;
  refreshSession?: () => Promise<void>;
}

export function createWrapper(authOverrides: AuthOverrides = {}) {
  const value = {
    session: 'session' in authOverrides
      ? authOverrides.session!
      : {
          user: { id: 'test-user-id', email: 'test@test.com' },
          access_token: 'test-token',
        } as unknown as Session,
    isLoading: authOverrides.isLoading ?? false,
    refreshSession: authOverrides.refreshSession ?? jest.fn(),
  };

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  };
}

export function renderHookWithAuth<T>(
  hook: () => T,
  authOverrides: AuthOverrides = {},
  options?: Omit<RenderHookOptions<any>, 'wrapper'>,
) {
  return renderHook(hook, {
    ...options,
    wrapper: createWrapper(authOverrides),
  });
}

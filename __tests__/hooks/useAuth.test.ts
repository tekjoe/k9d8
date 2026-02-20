jest.mock('../../src/lib/supabase');

import { renderHook } from '@testing-library/react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { createWrapper } from '../helpers/renderWithProviders';

describe('useAuth', () => {
  it('returns session from AuthContext', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    expect(result.current.session).not.toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('returns null session when not authenticated', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper({ session: null }),
    });
    expect(result.current.session).toBeNull();
  });

  it('returns default context values when no provider wraps it', () => {
    // AuthContext has default values, so useAuth returns them without throwing
    const { result } = renderHook(() => useAuth());
    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });
});

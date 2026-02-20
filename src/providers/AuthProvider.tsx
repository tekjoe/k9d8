import {
  createContext,
  useCallback,
  useEffect,
  useState,
  useRef,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Analytics } from '../lib/analytics';

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  refreshSession: async () => {},
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevSessionRef = useRef<Session | null>(null);

  const refreshSession = useCallback(async () => {
    const { data } = await supabase.auth.refreshSession();
    setSession(data.session);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
      prevSessionRef.current = session;
      
      if (session?.user) {
        Analytics.setUserId(session.user.id);
        Analytics.logAppOpen();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const previousSession = prevSessionRef.current;
      
      if (previousSession === null && session !== null) {
        Analytics.logLogin('email');
      }
      
      setSession(session);
      prevSessionRef.current = session;
      
      if (session?.user) {
        Analytics.setUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Clean up OAuth tokens from URL hash on web
  useEffect(() => {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      session &&
      window.location.hash.includes('access_token')
    ) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, isLoading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

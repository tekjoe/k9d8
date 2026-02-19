import React, { createContext, useContext } from 'react';
import { isModerationModelLoaded } from '@/src/services/moderation';

interface ModerationContextType {
  isReady: boolean;
  isLoading: boolean;
  isAvailable: boolean;
  error: Error | null;
}

const ModerationContext = createContext<ModerationContextType>({
  isReady: false,
  isLoading: false,
  isAvailable: true,
  error: null,
});

/**
 * Provider for moderation context. The model is loaded lazily
 * when the user actually picks an image (via useModeration hook
 * or ImagePickerWithModeration), not on app startup.
 */
export function ModerationProvider({ children }: { children: React.ReactNode }) {
  return (
    <ModerationContext.Provider
      value={{
        isReady: isModerationModelLoaded(),
        isLoading: false,
        isAvailable: true,
        error: null,
      }}
    >
      {children}
    </ModerationContext.Provider>
  );
}

/**
 * Hook to check moderation model status
 */
export function useModerationStatus() {
  return useContext(ModerationContext);
}

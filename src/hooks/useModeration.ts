import { useEffect, useRef, useCallback, useState } from 'react';
import {
  moderateImage,
  isImageSafe,
  initializeModerationModel,
  isModerationModelLoaded,
  ModerationResult,
} from '@/src/services/moderation';

interface UseModerationOptions {
  preloadOnMount?: boolean;
}

interface UseModerationReturn {
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  checkImage: (uri: string) => Promise<ModerationResult>;
  isSafe: (uri: string) => Promise<boolean>;
  retry: () => Promise<void>;
}

/**
 * Hook for using the NSFW content moderation system
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isReady, checkImage, isSafe } = useModeration({ preloadOnMount: true });
 *   
 *   const handleImageSelect = async (uri: string) => {
 *     if (!isReady) return;
 *     
 *     const result = await checkImage(uri);
 *     if (!result.isSafe) {
 *       Alert.alert('Image not allowed', getModerationMessage(result));
 *       return;
 *     }
 *     // Proceed with upload
 *   };
 * }
 * ```
 */
export function useModeration(options: UseModerationOptions = {}): UseModerationReturn {
  const { preloadOnMount = false } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(isModerationModelLoaded());
  const [error, setError] = useState<Error | null>(null);
  const loadAttempted = useRef(false);

  const loadModel = useCallback(async () => {
    if (isReady || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await initializeModerationModel();
      setIsReady(success);
      if (!success) {
        setError(new Error('Failed to load moderation model'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsReady(false);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, isLoading]);

  // Preload model on mount if requested
  useEffect(() => {
    if (preloadOnMount && !loadAttempted.current) {
      loadAttempted.current = true;
      loadModel();
    }
  }, [preloadOnMount, loadModel]);

  const checkImage = useCallback(async (uri: string): Promise<ModerationResult> => {
    if (!isReady) {
      // Try to load first
      await loadModel();
    }
    return moderateImage(uri);
  }, [isReady, loadModel]);

  const isSafe = useCallback(async (uri: string): Promise<boolean> => {
    if (!isReady) {
      await loadModel();
    }
    return isImageSafe(uri);
  }, [isReady, loadModel]);

  const retry = useCallback(async () => {
    await loadModel();
  }, [loadModel]);

  return {
    isLoading,
    isReady,
    error,
    checkImage,
    isSafe,
    retry,
  };
}

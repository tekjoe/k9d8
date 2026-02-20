jest.mock('../../src/lib/supabase');
jest.mock('../../src/services/moderation');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useModeration } from '../../src/hooks/useModeration';
import * as modService from '../../src/services/moderation';

const mockInit = modService.initializeModerationModel as jest.Mock;
const mockIsLoaded = modService.isModerationModelLoaded as jest.Mock;
const mockModerateImage = modService.moderateImage as jest.Mock;
const mockIsImageSafe = modService.isImageSafe as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockIsLoaded.mockReturnValue(false);
});

describe('useModeration', () => {
  it('starts not ready when model is not loaded', () => {
    const { result } = renderHook(() => useModeration());
    expect(result.current.isReady).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('starts ready when model is already loaded', () => {
    mockIsLoaded.mockReturnValue(true);
    const { result } = renderHook(() => useModeration());
    expect(result.current.isReady).toBe(true);
  });

  it('preloads model on mount when requested', async () => {
    mockInit.mockResolvedValue(true);

    const { result } = renderHook(() => useModeration({ preloadOnMount: true }));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
    expect(mockInit).toHaveBeenCalled();
  });

  it('checkImage delegates to moderateImage', async () => {
    mockIsLoaded.mockReturnValue(true);
    const mockResult = { isSafe: true, scores: {} };
    mockModerateImage.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useModeration());

    let moderationResult: any;
    await act(async () => {
      moderationResult = await result.current.checkImage('file:///photo.jpg');
    });
    expect(moderationResult).toEqual(mockResult);
  });

  it('isSafe delegates to isImageSafe', async () => {
    mockIsLoaded.mockReturnValue(true);
    mockIsImageSafe.mockResolvedValue(true);

    const { result } = renderHook(() => useModeration());

    let safe: boolean = false;
    await act(async () => {
      safe = await result.current.isSafe('file:///photo.jpg');
    });
    expect(safe).toBe(true);
  });

  it('sets error when model fails to load', async () => {
    mockInit.mockResolvedValue(false);

    const { result } = renderHook(() => useModeration({ preloadOnMount: true }));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.error?.message).toBe('Failed to load moderation model');
  });
});

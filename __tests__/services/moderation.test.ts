import {
  initializeModerationModel,
  isModerationModelLoaded,
  isModerationModelLoading,
  getModerationLoadError,
  isModerationAvailable,
  moderateImage,
  isImageSafe,
  getModerationMessage,
  showModerationAlert,
  preloadModerationModel,
} from '../../src/services/moderation';

describe('moderation service (native stubs)', () => {
  it('initializeModerationModel returns true', async () => {
    expect(await initializeModerationModel()).toBe(true);
  });

  it('isModerationModelLoaded returns true', () => {
    expect(isModerationModelLoaded()).toBe(true);
  });

  it('isModerationModelLoading returns false', () => {
    expect(isModerationModelLoading()).toBe(false);
  });

  it('getModerationLoadError returns null', () => {
    expect(getModerationLoadError()).toBeNull();
  });

  it('isModerationAvailable returns false on native', () => {
    expect(isModerationAvailable()).toBe(false);
  });

  it('moderateImage returns safe result', async () => {
    const result = await moderateImage('test.jpg');
    expect(result.isSafe).toBe(true);
    expect(result.predictions).toEqual([]);
    expect(result.highestRisk).toBeNull();
  });

  it('isImageSafe returns true', async () => {
    expect(await isImageSafe('test.jpg')).toBe(true);
  });

  it('getModerationMessage returns safe message for safe result', () => {
    const msg = getModerationMessage({ isSafe: true, predictions: [], highestRisk: null, confidence: 0 });
    expect(msg).toBe('Image passed content moderation.');
  });

  it('getModerationMessage returns warning for unsafe result', () => {
    const msg = getModerationMessage({ isSafe: false, predictions: [], highestRisk: null, confidence: 0.9 });
    expect(msg).toContain('inappropriate content');
  });

  it('showModerationAlert and preloadModerationModel are no-ops', async () => {
    showModerationAlert({ isSafe: true, predictions: [], highestRisk: null, confidence: 0 });
    await preloadModerationModel();
    // No errors thrown
  });
});

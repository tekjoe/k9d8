/**
 * NSFW Content Moderation Service for NATIVE (iOS/Android)
 *
 * TensorFlow.js is too heavy for mobile — moderation is handled
 * server-side or on the web client only. This stub returns safe
 * results so the image picker works without blocking.
 *
 * For web, see moderation.web.ts
 */

export type NSFWClass = 'Drawing' | 'Hentai' | 'Neutral' | 'Porn' | 'Sexy';

export interface NSFWPrediction {
  className: NSFWClass;
  probability: number;
}

export interface ModerationResult {
  isSafe: boolean;
  predictions: NSFWPrediction[];
  highestRisk: NSFWPrediction | null;
  confidence: number;
}

const SAFE_RESULT: ModerationResult = {
  isSafe: true,
  predictions: [],
  highestRisk: null,
  confidence: 0,
};

export async function initializeModerationModel(): Promise<boolean> {
  return true;
}

export function isModerationModelLoaded(): boolean {
  return true;
}

export function isModerationModelLoading(): boolean {
  return false;
}

export function getModerationLoadError(): Error | null {
  return null;
}

export function isModerationAvailable(): boolean {
  return false;
}

export async function moderateImage(_imageUri: string): Promise<ModerationResult> {
  return SAFE_RESULT;
}

export async function isImageSafe(_imageUri: string): Promise<boolean> {
  return true;
}

export function getModerationMessage(result: ModerationResult): string {
  return result.isSafe
    ? 'Image passed content moderation.'
    : 'This image may contain inappropriate content. Please upload a different photo.';
}

export function showModerationAlert(_result: ModerationResult): void {
  // No-op on native
}

export async function preloadModerationModel(): Promise<void> {
  // No-op on native
}

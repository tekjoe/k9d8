/**
 * NSFW Content Moderation Service for WEB
 * 
 * This service uses nsfwjs with TensorFlow.js web backend to detect 
 * inappropriate content in the browser. No server calls needed.
 */

import * as tf from '@tensorflow/tfjs';
import { Alert } from 'react-native';

// nsfwjs class names
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

// Default thresholds for each category
const DEFAULT_THRESHOLDS: Record<NSFWClass, number> = {
  'Drawing': 1.0,    // Always allow drawings
  'Hentai': 0.3,     // Block hentai at 30%
  'Neutral': 1.0,    // Always allow neutral
  'Porn': 0.3,       // Block porn at 30%
  'Sexy': 0.7,       // Block sexy content at 70%
};

let model: any = null;
let isLoading = false;
let loadError: Error | null = null;

/**
 * Initialize the NSFW model (Web version)
 */
export async function initializeModerationModel(): Promise<boolean> {
  if (model) return true;
  if (isLoading) {
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return model !== null;
  }

  isLoading = true;
  loadError = null;

  try {
    // Dynamically import nsfwjs
    const nsfwjs = await import('nsfwjs');
    
    // Load the model
    model = await nsfwjs.load();
    
    console.log('[Moderation] Web model loaded successfully');
    return true;
  } catch (error) {
    console.error('[Moderation] Failed to load web model:', error);
    loadError = error instanceof Error ? error : new Error('Unknown error loading model');
    return false;
  } finally {
    isLoading = false;
  }
}

/**
 * Load an image from URI and convert to HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Check if the moderation model is loaded
 */
export function isModerationModelLoaded(): boolean {
  return model !== null;
}

/**
 * Check if the model is currently loading
 */
export function isModerationModelLoading(): boolean {
  return isLoading;
}

/**
 * Get the last error that occurred during model loading
 */
export function getModerationLoadError(): Error | null {
  return loadError;
}

/**
 * Check if moderation is available on this platform
 */
export function isModerationAvailable(): boolean {
  return true; // Always available on web
}

/**
 * Classify an image for NSFW content
 */
export async function moderateImage(imageUri: string): Promise<ModerationResult> {
  if (!model) {
    const initialized = await initializeModerationModel();
    if (!initialized) {
      return {
        isSafe: true,
        predictions: [],
        highestRisk: null,
        confidence: 0,
      };
    }
  }

  try {
    // Load image
    const img = await loadImage(imageUri);
    
    // Classify
    const predictions = await model.classify(img);
    
    // Process predictions
    const formattedPredictions: NSFWPrediction[] = predictions.map((p: any) => ({
      className: p.className as NSFWClass,
      probability: p.probability,
    }));
    
    // Determine if content is safe
    const unsafePredictions = formattedPredictions.filter(p => {
      const threshold = DEFAULT_THRESHOLDS[p.className];
      return p.probability > threshold;
    });
    
    const isSafe = unsafePredictions.length === 0;
    const highestRisk = unsafePredictions.length > 0
      ? unsafePredictions.reduce((max, p) => p.probability > max.probability ? p : max)
      : null;
    
    return {
      isSafe,
      predictions: formattedPredictions,
      highestRisk,
      confidence: highestRisk?.probability || 0,
    };
  } catch (error) {
    console.error('[Moderation] Image classification failed:', error);
    return {
      isSafe: true,
      predictions: [],
      highestRisk: null,
      confidence: 0,
    };
  }
}

/**
 * Quick check if an image is safe
 */
export async function isImageSafe(imageUri: string): Promise<boolean> {
  try {
    const result = await moderateImage(imageUri);
    return result.isSafe;
  } catch (error) {
    console.error('[Moderation] Safety check failed:', error);
    return true;
  }
}

/**
 * Get a human-readable moderation message
 */
export function getModerationMessage(result: ModerationResult): string {
  if (result.isSafe) {
    return 'Image passed content moderation.';
  }
  
  if (result.highestRisk) {
    const category = result.highestRisk.className;
    const confidence = Math.round(result.highestRisk.probability * 100);
    
    switch (category) {
      case 'Porn':
        return `This image appears to contain explicit content (${confidence}% confidence). Please upload an appropriate photo.`;
      case 'Hentai':
        return `This image appears to contain adult content (${confidence}% confidence). Please upload an appropriate photo.`;
      case 'Sexy':
        return `This image appears to contain suggestive content (${confidence}% confidence). Please upload a more appropriate photo.`;
      default:
        return `This image may contain inappropriate content (${confidence}% confidence). Please upload a different photo.`;
    }
  }
  
  return 'This image may contain inappropriate content. Please upload a different photo.';
}

/**
 * Show moderation alert to user
 */
export function showModerationAlert(result: ModerationResult): void {
  const message = getModerationMessage(result);
  
  Alert.alert(
    'Content Not Allowed',
    message,
    [{ text: 'OK', style: 'default' }]
  );
}

/**
 * Preload the moderation model
 */
export async function preloadModerationModel(): Promise<void> {
  try {
    await initializeModerationModel();
  } catch (error) {
    console.error('[Moderation] Preload failed:', error);
  }
}

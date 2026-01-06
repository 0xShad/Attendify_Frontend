/**
 * Liveness Tests Module
 * 
 * This module provides anti-spoofing tests for face liveness detection.
 * Each test analyzes different aspects of the image to determine if it's
 * a real face or a spoofing attempt (photo, screen, etc.)
 */

export { calculateBlur } from './blur-detection';
export { analyzeTexture } from './texture-analysis';
export { analyzeReflection } from './reflection-analysis';
export { analyzeColorSpectrum } from './color-spectrum-analysis';
export { estimateFaceDepth } from './depth-estimation';
export { detectEyesOpen } from './eye-detection';
export { detectFaces } from './eye-detection';

/**
 * Liveness test thresholds
 * These values determine the minimum scores required to pass each test
 *
 * Tuned slightly lighter to further reduce false rejects.
 */
export const LIVENESS_THRESHOLDS = {
  blur: 95,               // was 100 — allow a bit more blur
  texture: 0.17,          // was 0.18 — accept slightly less texture detail
  reflection: 0.24,       // was 0.25 — a touch more flexible lighting
  colorSpectrum: 0.33,    // was 0.35 — accept weaker skin-tone signal
  depth: 0.43,            // was 0.45 — accept a little less pronounced 3D depth
} as const;

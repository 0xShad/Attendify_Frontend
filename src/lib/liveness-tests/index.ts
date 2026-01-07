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
  blur: 90,               // was 95 — allow more blur
  texture: 0.14,          // was 0.17 — accept less texture detail
  reflection: 0.22,       // was 0.24 — more flexible lighting
  colorSpectrum: 0.30,    // was 0.33 — accept weaker skin-tone signal
  depth: 0.40,            // was 0.43 — accept less pronounced 3D depth
} as const;

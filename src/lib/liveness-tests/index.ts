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
 */
export const LIVENESS_THRESHOLDS = {
  blur: 120,              // Much stricter: real faces typically 150-300, screens/photos 50-120
  texture: 0.20,          // Stricter: require more natural texture - forces good lighting
  reflection: 0.28,       // Stricter: require better natural lighting
  colorSpectrum: 0.40,    // Much stricter: require strong skin tone presence
  depth: 0.50,            // Much stricter: require clear 3D characteristics
} as const;

// src/lib/blurDetection.ts
// Real blur detection using OpenCV.js (browser only, not Node.js)
// This file is intended for use in the browser, not in Next.js API routes.
// Usage: import { calculateBlur } from '@/lib/blurDetection';

import cv from '@techstark/opencv-js';

/**
 * Calculates blur using Laplacian variance (focus measure)
 * @param imageData Uint8ClampedArray (RGBA)
 * @param width Image width
 * @param height Image height
 * @returns Laplacian variance (higher = sharper)
 */
export function calculateBlur(imageData: Uint8ClampedArray, width: number, height: number): number {
  // Create OpenCV Mat from RGBA data
  const mat = cv.matFromArray(height, width, cv.CV_8UC4, imageData);
  // Convert to grayscale
  const gray = new cv.Mat();
  cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
  // Apply Laplacian
  const laplacian = new cv.Mat();
  cv.Laplacian(gray, laplacian, cv.CV_64F);
  // Compute variance
  const mean = new cv.Mat();
  const stddev = new cv.Mat();
  cv.meanStdDev(laplacian, mean, stddev);
  const variance = Math.pow(stddev.doubleAt(0, 0), 2);
  // Clean up
  mat.delete();
  gray.delete();
  laplacian.delete();
  mean.delete();
  stddev.delete();
  return variance;
}

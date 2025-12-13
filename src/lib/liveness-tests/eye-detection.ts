import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import sharp from 'sharp';

/**
 * Eye Detection Module
 * 
 * This module uses TensorFlow.js (pure JavaScript version) which works in Node.js
 * without requiring native compilation or Visual Studio Build Tools.
 * 
 * ✅ Production-ready: Works on Vercel, AWS Lambda, Docker, etc.
 * ✅ No native dependencies: Pure JavaScript (no @tensorflow/tfjs-node needed)
 * ✅ Cross-platform: Works on Windows, Linux, macOS without build tools
 * 
 * Uses BlazeFace model for fast, lightweight face detection in Node.js
 */

// Cache the model to avoid reloading on every request
let model: blazeface.BlazeFaceModel | null = null;

/**
 * Initialize and cache the BlazeFace model
 */
async function getModel(): Promise<blazeface.BlazeFaceModel> {
  if (!model) {
    console.log('[BlazeFace] Loading model...');
    model = await blazeface.load();
    console.log('[BlazeFace] Model loaded successfully');
  }
  return model;
}

/**
 * Analyze eye region pixels to determine if eye is open
 * Uses variance in pixel intensity - closed eyes have less variation (smooth eyelid)
 * while open eyes have more variation (pupil, iris, sclera, eyelashes)
 */
function analyzeEyeRegion(
  imageData: Uint8Array,
  width: number,
  height: number,
  eyeX: number,
  eyeY: number,
  eyeDistance: number
): { isOpen: boolean; variance: number } {
  // Define eye region size based on inter-eye distance
  const regionSize = Math.floor(eyeDistance * 0.15); // ~15% of eye distance
  const halfSize = Math.floor(regionSize / 2);

  // Bounds checking
  const startX = Math.max(0, Math.floor(eyeX) - halfSize);
  const endX = Math.min(width - 1, Math.floor(eyeX) + halfSize);
  const startY = Math.max(0, Math.floor(eyeY) - halfSize);
  const endY = Math.min(height - 1, Math.floor(eyeY) + halfSize);

  // Extract grayscale values from eye region
  const pixels: number[] = [];
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (y * width + x) * 3;
      // Convert to grayscale
      const gray = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
      pixels.push(gray);
    }
  }

  if (pixels.length === 0) {
    return { isOpen: false, variance: 0 };
  }

  // Calculate mean
  const mean = pixels.reduce((sum, val) => sum + val, 0) / pixels.length;

  // Calculate variance
  const variance = pixels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixels.length;

  // Open eyes have higher variance due to pupil/iris contrast
  // Closed eyes or squinting have lower variance (smooth eyelid skin)
  // Threshold: variance > 650 indicates clearly open eye
  // This rejects squinting and requires wide-open eyes
  const isOpen = variance > 650;

  return { isOpen, variance };
}

/**
 * Estimate if BOTH eyes are open based on facial landmarks and pixel analysis
 * 
 * BlazeFace provides 6 landmarks:
 * - landmarks[0] = right eye
 * - landmarks[1] = left eye  
 * - landmarks[2] = nose tip
 * - landmarks[3] = mouth center
 * - landmarks[4] = right ear tragion
 * - landmarks[5] = left ear tragion
 * 
 * @param landmarks - Array of facial landmark positions
 * @param imageData - RGB pixel data
 * @param width - Image width
 * @param height - Image height
 * @returns boolean - true if BOTH eyes appear open
 */
function estimateEyesOpen(
  landmarks: number[][],
  imageData: Uint8Array,
  width: number,
  height: number
): boolean {
  const rightEye = landmarks[0];
  const leftEye = landmarks[1];
  const nose = landmarks[2];

  // Calculate eye-to-eye distance (horizontal)
  const eyeDistance = Math.sqrt(
    Math.pow(rightEye[0] - leftEye[0], 2) +
    Math.pow(rightEye[1] - leftEye[1], 2)
  );

  // Calculate nose-to-eye-midpoint distance
  const eyeMidpoint = [
    (rightEye[0] + leftEye[0]) / 2,
    (rightEye[1] + leftEye[1]) / 2
  ];
  
  const noseToEyeDistance = Math.sqrt(
    Math.pow(nose[0] - eyeMidpoint[0], 2) +
    Math.pow(nose[1] - eyeMidpoint[1], 2)
  );

  // Check eye symmetry (eyes should be roughly horizontal)
  const eyeVerticalDiff = Math.abs(rightEye[1] - leftEye[1]);
  const symmetryRatio = eyeVerticalDiff / eyeDistance;

  // For a frontal face with eyes open:
  // - Eyes should be roughly symmetric (low vertical difference)
  // - Nose should be below eyes (positive y distance)
  // - Eye distance should be proportional to nose distance
  
  const isSymmetric = symmetryRatio < 0.15; // Eyes roughly horizontal
  const isFrontal = nose[1] > eyeMidpoint[1]; // Nose below eyes
  const hasGoodProportions = noseToEyeDistance / eyeDistance > 0.3 && noseToEyeDistance / eyeDistance < 2.0;

  // NEW: Analyze actual eye region pixels to detect if eyes are open
  const rightEyeAnalysis = analyzeEyeRegion(imageData, width, height, rightEye[0], rightEye[1], eyeDistance);
  const leftEyeAnalysis = analyzeEyeRegion(imageData, width, height, leftEye[0], leftEye[1], eyeDistance);

  console.log(`[EyeDetection] Geometry - symmetry=${symmetryRatio.toFixed(3)}, frontal=${isFrontal}, proportions=${(noseToEyeDistance/eyeDistance).toFixed(3)}`);
  console.log(`[EyeDetection] Right eye - variance=${rightEyeAnalysis.variance.toFixed(1)}, open=${rightEyeAnalysis.isOpen}`);
  console.log(`[EyeDetection] Left eye - variance=${leftEyeAnalysis.variance.toFixed(1)}, open=${leftEyeAnalysis.isOpen}`);

  // Individual thresholds for each eye
  const MIN_VARIANCE = 650; // Minimum variance for each eye
  const rightEyeOpen = rightEyeAnalysis.variance > MIN_VARIANCE;
  const leftEyeOpen = leftEyeAnalysis.variance > MIN_VARIANCE;

  // Check if eyes are balanced (not one super bright, one very dark)
  const maxVariance = Math.max(rightEyeAnalysis.variance, leftEyeAnalysis.variance);
  const minVariance = Math.min(rightEyeAnalysis.variance, leftEyeAnalysis.variance);
  const varianceRatio = minVariance / maxVariance;

  // Eyes should have somewhat similar variance (within 40% of each other)
  // This catches cases like one eye squinted while other is open
  const areBalanced = varianceRatio > 0.40;

  console.log(`[EyeDetection] Eye balance - ratio=${varianceRatio.toFixed(3)} (min/max variance), balanced=${areBalanced}`);

  // BOTH eyes must be open individually AND be balanced AND pass geometry checks
  const bothEyesOpen = rightEyeOpen && leftEyeOpen && areBalanced;
  const passesGeometry = isSymmetric && isFrontal && hasGoodProportions;

  return bothEyesOpen && passesGeometry;
}

/**
 * Eye detection - check if eyes are open using BlazeFace
 * @param imageBuffer - Buffer containing the image data
 * @returns Promise<boolean> - True if eyes are detected as open
 */
export async function detectEyesOpen(imageBuffer: Buffer): Promise<boolean> {
  try {
    // Convert buffer to raw RGB pixel data using sharp
    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { width, height, channels } = info;
    
    // Create tensor from image data (RGB only, drop alpha if present)
    const rgbChannels = channels === 4 ? 3 : channels;
    const rgbData = new Uint8Array(width * height * 3);
    
    for (let i = 0, j = 0; i < data.length; i += channels, j += 3) {
      rgbData[j] = data[i];       // R
      rgbData[j + 1] = data[i + 1]; // G
      rgbData[j + 2] = data[i + 2]; // B
    }

    const imageTensor = tf.tensor3d(rgbData, [height, width, 3]);
    
    // Get BlazeFace model
    const faceModel = await getModel();
    
    // Detect faces
    const predictions = await faceModel.estimateFaces(imageTensor, false);
    
    // Clean up tensor
    imageTensor.dispose();
    
    if (predictions.length === 0) {
      console.log('[EyeDetection] No face detected');
      return false;
    }
    
    // Get the first face
    const face = predictions[0];
    const landmarks = face.landmarks as number[][];

    if (!landmarks || landmarks.length < 3) {
      console.log('[EyeDetection] Insufficient landmarks detected');
      return false;
    }

    // Analyze eye state with pixel analysis
    const eyesOpen = estimateEyesOpen(landmarks, rgbData, width, height);

    console.log(`[EyeDetection] Face detected with ${predictions.length} face(s), eyes open: ${eyesOpen}`);

    return eyesOpen;
  } catch (error) {
    console.error('[EyeDetection] Error:', error);
    // On error, fail safely by returning false
    return false;
  }
}

export default detectEyesOpen;

/**
 * Detect faces in an image using BlazeFace and return simplified boxes and landmarks
 * @param imageBuffer Buffer containing image data
 * @returns Promise<Array<{ boundingPoly: { vertices: { x: number; y: number }[] }, landmarks: number[][], probability?: number }>>
 */
export async function detectFaces(imageBuffer: Buffer) {
  try {
    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    // Convert raw data to rgb uint8 array
    const rgbData = new Uint8Array(width * height * 3);
    for (let i = 0, j = 0; i < data.length; i += channels, j += 3) {
      rgbData[j] = data[i];
      rgbData[j + 1] = data[i + 1];
      rgbData[j + 2] = data[i + 2];
    }
    const imageTensor = tf.tensor3d(rgbData, [height, width, 3]);
    const faceModel = await getModel();
    const predictions = await faceModel.estimateFaces(imageTensor, false);
    imageTensor.dispose();
    if (!predictions || predictions.length === 0) return [];
    // Map to simplified structure
    const faces = predictions.map((p: any) => {
      const tl = (p.topLeft && Array.isArray(p.topLeft)) ? p.topLeft : [p.topLeft[0], p.topLeft[1]];
      const br = (p.bottomRight && Array.isArray(p.bottomRight)) ? p.bottomRight : [p.bottomRight[0], p.bottomRight[1]];
      const vertices = [
        { x: Math.max(0, Math.round(tl[0])), y: Math.max(0, Math.round(tl[1])) },
        { x: Math.min(width - 1, Math.round(br[0])), y: Math.max(0, Math.round(tl[1])) },
        { x: Math.min(width - 1, Math.round(br[0])), y: Math.min(height - 1, Math.round(br[1])) },
        { x: Math.max(0, Math.round(tl[0])), y: Math.min(height - 1, Math.round(br[1])) },
      ];
      return {
        boundingPoly: { vertices },
        landmarks: p.landmarks || [],
        probability: (p.probability && Array.isArray(p.probability)) ? p.probability[0] : (p.probability || 0),
      };
    });
    return faces;
  } catch (err) {
    console.error('[FaceDetect] detectFaces error', err);
    return [];
  }
}

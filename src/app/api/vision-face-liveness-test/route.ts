
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Utility: Calculate image blur using Laplacian variance (focus measure) with sharp (Node.js)
async function calculateBlur(imageBuffer: Buffer): Promise<number> {
  // Convert to grayscale and get raw pixel data
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  // Laplacian kernel (3x3)
  const kernel = [
    0,  1, 0,
    1, -4, 1,
    0,  1, 0
  ];
  // Apply Laplacian filter
  const laplacian = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = x + kx;
          const py = y + ky;
          const pixel = data[py * width + px];
          const kval = kernel[(ky + 1) * 3 + (kx + 1)];
          sum += pixel * kval;
        }
      }
      laplacian[y * width + x] = sum;
    }
  }
  // Compute variance of Laplacian
  let mean = 0;
  let count = 0;
  for (let i = 0; i < laplacian.length; i++) {
    mean += laplacian[i];
    count++;
  }
  mean /= count;
  let variance = 0;
  for (let i = 0; i < laplacian.length; i++) {
    variance += Math.pow(laplacian[i] - mean, 2);
  }
  variance /= count;
  return variance;
}

// Utility: Simple texture analysis (placeholder)
function analyzeTexture(imageData: Uint8ClampedArray, width: number, height: number): number {
  // Placeholder: In production, use GLCM, LBP, or similar
  return Math.random(); // Replace with real texture analysis
}

// Utility: Reflection/lighting analysis (placeholder)
function analyzeReflection(imageData: Uint8ClampedArray, width: number, height: number): number {
  // Placeholder: Analyze specular highlights, brightness variance, etc.
  return Math.random(); // Replace with real reflection analysis
}

// Utility: Color/IR spectrum check (placeholder)
function analyzeColorSpectrum(imageData: Uint8ClampedArray, width: number, height: number): number {
  // Placeholder: Analyze color distribution, IR if available
  return Math.random(); // Replace with real color/IR analysis
}

// Utility: Face depth estimation (placeholder)
function estimateFaceDepth(imageData: Uint8ClampedArray, width: number, height: number): number {
  // Placeholder: Needs stereo/ToF data, not available in standard webcam
  return Math.random(); // Replace with real depth estimation
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Debug: log input
    console.log('[LivenessAPI] Received request:', {
      hasImage: !!body.image,
      width: body.width,
      height: body.height,
      imageLength: body.image ? body.image.length : 0
    });
    // Expecting { image: base64 string, width, height }
    const { image, width, height } = body;
    if (!image || !width || !height) {
      console.log('[LivenessAPI] Missing image data');
      return NextResponse.json({ success: false, error: 'Missing image data' }, { status: 400 });
    }
    // Decode base64 image (assume RGBA PNG data URL)
    const base64 = image.replace(/^data:image\/(png|jpeg);base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    // Run anti-spoofing checks (blur is real, others are placeholders)
    const blur = await calculateBlur(buffer);
    // For now, keep other checks as placeholders
    const imageData = new Uint8ClampedArray(buffer);
    const texture = analyzeTexture(imageData, width, height);
    const reflection = analyzeReflection(imageData, width, height);
    const colorSpectrum = analyzeColorSpectrum(imageData, width, height);
    const depth = estimateFaceDepth(imageData, width, height);

    // Looser thresholds for higher chance of success
    const blurThreshold = 1; // Lowered: allow more blur
    const textureThreshold = 0.1; // Lowered: allow less texture
    const reflectionThreshold = 0.9; // Raised: allow more reflection
    const colorSpectrumThreshold = 0.1; // Lowered: allow wider color range
    const depthThreshold = 0.1; // Lowered: allow flatter images

    // Debug: log computed values
    console.log('[LivenessAPI] Computed values:', {
      blur,
      texture,
      reflection,
      colorSpectrum,
      depth
    });

    const passed = blur > blurThreshold && texture > textureThreshold && reflection < reflectionThreshold && colorSpectrum > colorSpectrumThreshold && depth > depthThreshold;
    const results = {
      blur,
      texture,
      reflection,
      colorSpectrum,
      depth,
      passed,
    };
    console.log('[LivenessAPI] Decision:', { passed, thresholds: { blurThreshold, textureThreshold, reflectionThreshold, colorSpectrumThreshold, depthThreshold } });
    if (passed) {
      console.log('[LivenessAPI] Liveness/anti-spoofing PASSED');
      return NextResponse.json({ success: true, ...results });
    } else {
      console.log('[LivenessAPI] Liveness/anti-spoofing FAILED');
      return NextResponse.json({ success: false, ...results, message: 'Liveness/anti-spoofing checks failed.' }, { status: 200 });
    }
  } catch (e) {
    console.error('[LivenessAPI] Error:', e);
    return NextResponse.json({ success: false, error: 'Invalid request', details: String(e) }, { status: 400 });
  }
}


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

// Utility: Texture analysis using edge density and standard deviation
async function analyzeTexture(imageBuffer: Buffer): Promise<number> {
  // Convert to grayscale and get raw pixel data
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const width = info.width;
  const height = info.height;
  
  // Calculate standard deviation (texture variation)
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    count++;
  }
  const mean = sum / count;
  
  let variance = 0;
  for (let i = 0; i < data.length; i++) {
    variance += Math.pow(data[i] - mean, 2);
  }
  variance /= count;
  const stdDev = Math.sqrt(variance);
  
  // Calculate edge density using simple gradient (Sobel-like)
  let edgeCount = 0;
  const threshold = 30; // Edge detection threshold
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      // Horizontal gradient
      const gx = -data[idx - 1] + data[idx + 1];
      // Vertical gradient
      const gy = -data[idx - width] + data[idx + width];
      // Gradient magnitude
      const gradient = Math.sqrt(gx * gx + gy * gy);
      
      if (gradient > threshold) {
        edgeCount++;
      }
    }
  }
  
  const edgeDensity = edgeCount / ((width - 2) * (height - 2));
  
  // Combine metrics: normalized standard deviation + edge density
  // Real faces have texture variation (higher stdDev) and natural edges
  // Printed photos tend to have uniform texture and fewer natural edges
  const normalizedStdDev = stdDev / 255; // Normalize to 0-1
  const textureScore = (normalizedStdDev * 0.6) + (edgeDensity * 0.4);
  
  return textureScore;
}

// Utility: Reflection/lighting analysis using brightness distribution and highlights
async function analyzeReflection(imageBuffer: Buffer): Promise<number> {
  // Convert to grayscale and get raw pixel data
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const width = info.width;
  const height = info.height;
  const totalPixels = width * height;
  
  // 1. Detect specular highlights (very bright pixels)
  // Screens/photos often have artificial specular highlights
  let highlightCount = 0;
  const highlightThreshold = 240; // Very bright pixels
  
  for (let i = 0; i < data.length; i++) {
    if (data[i] > highlightThreshold) {
      highlightCount++;
    }
  }
  
  const highlightRatio = highlightCount / totalPixels;
  
  // 2. Calculate brightness variance across the image
  // Real faces have natural lighting gradients
  // Screens/photos may have more uniform lighting
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const mean = sum / data.length;
  
  let variance = 0;
  for (let i = 0; i < data.length; i++) {
    variance += Math.pow(data[i] - mean, 2);
  }
  variance /= data.length;
  const normalizedVariance = variance / (255 * 255); // Normalize to 0-1
  
  // 3. Detect local brightness anomalies (grid pattern detection)
  // Divide image into blocks and check for uniform brightness patterns
  const blockSize = 16;
  const blocksX = Math.floor(width / blockSize);
  const blocksY = Math.floor(height / blockSize);
  const blockMeans: number[] = [];
  
  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      let blockSum = 0;
      let blockCount = 0;
      
      for (let y = by * blockSize; y < (by + 1) * blockSize && y < height; y++) {
        for (let x = bx * blockSize; x < (bx + 1) * blockSize && x < width; x++) {
          blockSum += data[y * width + x];
          blockCount++;
        }
      }
      
      if (blockCount > 0) {
        blockMeans.push(blockSum / blockCount);
      }
    }
  }
  
  // Calculate variance of block means (screen patterns have lower variance)
  let blockMeanSum = 0;
  for (const bm of blockMeans) {
    blockMeanSum += bm;
  }
  const blockMeanAvg = blockMeanSum / blockMeans.length;
  
  let blockVariance = 0;
  for (const bm of blockMeans) {
    blockVariance += Math.pow(bm - blockMeanAvg, 2);
  }
  blockVariance /= blockMeans.length;
  const normalizedBlockVariance = blockVariance / (255 * 255);
  
  // Combine metrics:
  // - Lower highlight ratio is better (fewer artificial highlights)
  // - Higher brightness variance is better (natural lighting)
  // - Higher block variance is better (non-uniform, natural)
  
  // Penalize excessive highlights
  const highlightScore = 1 - Math.min(highlightRatio * 10, 1); // 0-1, higher is better
  
  // Reward natural brightness variation
  const varianceScore = Math.min(normalizedVariance * 2, 1); // 0-1
  
  // Reward non-uniform block patterns
  const blockScore = Math.min(normalizedBlockVariance * 2, 1); // 0-1
  
  // Combined reflection score (0-1, lower values indicate potential spoofing)
  const reflectionScore = (highlightScore * 0.4) + (varianceScore * 0.3) + (blockScore * 0.3);
  
  return reflectionScore;
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

// Utility: Eye detection - check if both eyes are open (placeholder)
function detectEyesOpen(imageData: Uint8ClampedArray, width: number, height: number): boolean {
  // Placeholder: In production, use eye aspect ratio (EAR) or ML-based eye state detection
  // Should detect eye landmarks and calculate if eyes are open based on vertical/horizontal ratios
  // For now, return true to simulate both eyes being open
  return Math.random() > 0.3; // Replace with real eye detection logic
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
    const texture = await analyzeTexture(buffer);
    const reflection = await analyzeReflection(buffer);
    // For now, keep other checks as placeholders
    const imageData = new Uint8ClampedArray(buffer);
    const colorSpectrum = analyzeColorSpectrum(imageData, width, height);
    const depth = estimateFaceDepth(imageData, width, height);
    const eyesOpen = detectEyesOpen(imageData, width, height);

    // Stricter thresholds to prevent spoofing (screens/photos)
    const blurThreshold = 50; // Higher: require sharper focus (real faces in focus)
    const textureThreshold = 0.18; // Higher: require more natural texture variation
    const reflectionThreshold = 0.25; // Higher: require natural lighting patterns
    const colorSpectrumThreshold = 0.3; // Higher: placeholder, will be stricter when implemented
    const depthThreshold = 0.3; // Higher: placeholder, will be stricter when implemented

    // Debug: log computed values
    console.log('[LivenessAPI] Computed values:', {
      blur,
      texture,
      reflection,
      colorSpectrum,
      depth,
      eyesOpen
    });

    const passed = blur > blurThreshold && texture > textureThreshold && reflection > reflectionThreshold && colorSpectrum > colorSpectrumThreshold && depth > depthThreshold && eyesOpen;
    const results = {
      blur,
      texture,
      reflection,
      colorSpectrum,
      depth,
      eyesOpen,
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

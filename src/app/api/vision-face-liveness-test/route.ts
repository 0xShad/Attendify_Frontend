
import { NextRequest, NextResponse } from 'next/server';

// Utility: Calculate image blur using Laplacian variance (simple focus measure)
function calculateBlur(imageData: Uint8ClampedArray, width: number, height: number): number {
  // Placeholder: In production, use OpenCV.js or a WASM library for Laplacian
  // Here, just return a dummy value
  return Math.random() * 100; // Replace with real blur detection
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
    // In real code, decode to pixel data (e.g., using sharp, jimp, or canvas)
    // Here, just create a dummy Uint8ClampedArray
    const imageData = new Uint8ClampedArray(buffer);

    // Run anti-spoofing checks (placeholders)
    const blur = calculateBlur(imageData, width, height);
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


import { NextRequest, NextResponse } from 'next/server';
import {
  calculateBlur,
  analyzeTexture,
  analyzeReflection,
  analyzeColorSpectrum,
  estimateFaceDepth,
  detectEyesOpen,
  LIVENESS_THRESHOLDS,
} from '@/lib/liveness-tests';

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

    // Run anti-spoofing checks
    const blur = await calculateBlur(buffer);
    const texture = await analyzeTexture(buffer);
    const reflection = await analyzeReflection(buffer);
    const colorSpectrum = await analyzeColorSpectrum(buffer);
    const depth = await estimateFaceDepth(buffer);
    // Eye detection using TensorFlow.js
    const eyesOpen = await detectEyesOpen(buffer);

    // Debug: log computed values
    console.log('[LivenessAPI] Computed values:', {
      blur,
      texture,
      reflection,
      colorSpectrum,
      depth,
      eyesOpen
    });

    // Individual test results
    const blurPassed = blur > LIVENESS_THRESHOLDS.blur;
    const texturePassed = texture > LIVENESS_THRESHOLDS.texture;
    const reflectionPassed = reflection > LIVENESS_THRESHOLDS.reflection;
    const colorSpectrumPassed = colorSpectrum > LIVENESS_THRESHOLDS.colorSpectrum;
    const depthPassed = depth > LIVENESS_THRESHOLDS.depth;
    const eyesOpenPassed = eyesOpen;

    console.log('[LivenessAPI] Individual test results:');
    console.log(`  ✓ Blur: ${blur.toFixed(2)} > ${LIVENESS_THRESHOLDS.blur} = ${blurPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ✓ Texture: ${texture.toFixed(2)} > ${LIVENESS_THRESHOLDS.texture} = ${texturePassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ✓ Reflection: ${reflection.toFixed(2)} > ${LIVENESS_THRESHOLDS.reflection} = ${reflectionPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ✓ Color Spectrum: ${colorSpectrum.toFixed(2)} > ${LIVENESS_THRESHOLDS.colorSpectrum} = ${colorSpectrumPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ✓ Depth: ${depth.toFixed(2)} > ${LIVENESS_THRESHOLDS.depth} = ${depthPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ✓ Eyes Open: ${eyesOpen} = ${eyesOpenPassed ? '✅ PASS' : '❌ FAIL'}`);

    const passed = blurPassed && texturePassed && reflectionPassed && colorSpectrumPassed && depthPassed && eyesOpenPassed;
    const results = {
      blur,
      texture,
      reflection,
      colorSpectrum,
      depth,
      eyesOpen,
      passed,
    };
    console.log(`[LivenessAPI] Overall Decision: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
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

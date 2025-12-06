
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
    // Conservative handling for eyeglasses: some glasses (not sunglasses)
    // cause reflections/occlusion that break eye-open detectors. We allow
    // a fallback where eyesOpen is false but other strong liveness signals
    // indicate a real face and likely eyeglasses (not dark sunglasses).
    let eyesOpenPassed = eyesOpen;
    let glassesSuspected = false;
    if (!eyesOpen) {
      // Heuristic checks — require other signals to be comfortably above
      // their thresholds before treating this as glasses (not sunglasses).
      const colorStrong = colorSpectrum > LIVENESS_THRESHOLDS.colorSpectrum * 0.8;
      const textureStrong = texture > LIVENESS_THRESHOLDS.texture * 0.8;
      const depthStrong = depth > LIVENESS_THRESHOLDS.depth * 0.8;
      const blurStrong = blur > LIVENESS_THRESHOLDS.blur * 0.8;

      // If the image shows good color/texture/depth/blur, it's likely a
      // real face with eyeglasses (which may confuse eye detectors).
      // If colorSpectrum is very low, treat as possible sunglasses and do
      // not attempt the glasses fallback.
      const colorTooLow = colorSpectrum < LIVENESS_THRESHOLDS.colorSpectrum * 0.35;

      if (!colorTooLow && colorStrong && textureStrong && depthStrong && blurStrong) {
        glassesSuspected = true;
        eyesOpenPassed = true;
      }
    }

    console.log('[LivenessAPI] Individual test results:');
    console.log(`  ✓ Blur: ${blur.toFixed(2)} > ${LIVENESS_THRESHOLDS.blur} = ${blurPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ✓ Texture: ${texture.toFixed(2)} > ${LIVENESS_THRESHOLDS.texture} = ${texturePassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ✓ Reflection: ${reflection.toFixed(2)} > ${LIVENESS_THRESHOLDS.reflection} = ${reflectionPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ✓ Color Spectrum: ${colorSpectrum.toFixed(2)} > ${LIVENESS_THRESHOLDS.colorSpectrum} = ${colorSpectrumPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ✓ Depth: ${depth.toFixed(2)} > ${LIVENESS_THRESHOLDS.depth} = ${depthPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ✓ Eyes Open: ${eyesOpen} = ${eyesOpenPassed ? '✅ PASS' : '❌ FAIL'}${glassesSuspected ? ' (glasses suspected - fallback accepted)' : ''}`);

    const passed = blurPassed && texturePassed && reflectionPassed && colorSpectrumPassed && depthPassed && eyesOpenPassed;
    const results = {
      blur,
      texture,
      reflection,
      colorSpectrum,
      depth,
      eyesOpen,
      glassesSuspected,
      passed,
    };
    console.log(`[LivenessAPI] Overall Decision: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (passed) {
      console.log('[LivenessAPI] Liveness/anti-spoofing PASSED', { glassesSuspected });
      return NextResponse.json({ success: true, ...results });
    } else {
      console.log('[LivenessAPI] Liveness/anti-spoofing FAILED', { glassesSuspected });
      return NextResponse.json({ success: false, ...results, message: 'Liveness/anti-spoofing checks failed.' }, { status: 200 });
    }
  } catch (e) {
    console.error('[LivenessAPI] Error:', e);
    return NextResponse.json({ success: false, error: 'Invalid request', details: String(e) }, { status: 400 });
  }
}

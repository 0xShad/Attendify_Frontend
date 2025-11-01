# Liveness Detection Tests

This module provides comprehensive anti-spoofing tests for face liveness detection using computer vision and machine learning techniques.

## Quick Reference

| Test | Purpose | Threshold | What It Detects | Pass Criteria |
|------|---------|-----------|-----------------|---------------|
| **Blur Detection** | Image sharpness | `120` | Photos of photos, blurry images | Laplacian variance > 120 |
| **Texture Analysis** | Skin texture | `0.20` | Flat printed photos vs real skin | Texture score > 0.20 |
| **Reflection Analysis** | Lighting patterns | `0.28` | Screen glare, artificial highlights | Natural lighting score > 0.28 |
| **Color Spectrum** | Skin tones | `0.40` | Unnatural colors, screen artifacts | Skin tone presence > 0.40 |
| **Depth Estimation** | 3D structure | `0.50` | Flat 2D images vs 3D faces | Depth cues score > 0.50 |
| **Eye Detection** | Eyes open & frontal | Min: `600`<br>Balance: `0.35` | Closed/squinted eyes, wrong pose | Both eyes variance > 600<br>Eyes balanced > 0.35<br>Frontal geometry ✓ |

**Performance Summary**:
- **First call**: ~3 seconds (model loading)
- **Subsequent calls**: ~300-400ms (all tests combined)
- **Memory usage**: ~100MB (with cached BlazeFace model)

---

## Overview

The liveness detection system uses **6 independent tests** to verify that a face is real and not a photo, screen, or other spoofing attempt. Each test analyzes different physical characteristics that distinguish real 3D faces from 2D reproductions.

## Tests Included

### 1. **Blur Detection** (`blur-detection.ts`)

**Purpose**: Detect blurry or out-of-focus images that might indicate photos of photos or low-quality spoofing attempts.

**Algorithm**: 
- Uses **Laplacian variance** (focus measure) to quantify image sharpness
- Applies 3×3 Laplacian kernel to detect edges and high-frequency details
- Calculates variance of Laplacian response across the entire image
- Higher variance = sharper image with more detail

**Threshold**: `120` (Laplacian variance)
- Real faces (good lighting): 150-600
- Photos/screens: 50-120
- Blurry photos: < 50

**Implementation**:
```typescript
const blur = await calculateBlur(imageBuffer);
const passes = blur > 120;
```

---

### 2. **Texture Analysis** (`texture-analysis.ts`)

**Purpose**: Distinguish real skin texture from flat printed photos or screens.

**Algorithm**:
- Calculates **standard deviation** of pixel intensities (texture variation)
- Computes **edge density** using gradient-based edge detection
- Real skin has natural pores, wrinkles, and micro-textures
- Printed photos have uniform, flat texture with less natural variation

**Metrics**:
- Standard deviation (normalized 0-1): Measures pixel intensity variation
- Edge density: Percentage of pixels with significant gradients
- Combined score: `(stdDev × 0.6) + (edgeDensity × 0.4)`

**Threshold**: `0.20` (0-1 scale)

**Implementation**:
```typescript
const texture = await analyzeTexture(imageBuffer);
const passes = texture > 0.20;
```

---

### 3. **Reflection Analysis** (`reflection-analysis.ts`)

**Purpose**: Detect artificial lighting patterns and specular highlights from screens or photos.

**Algorithm**:
- Detects **specular highlights** (very bright pixels > 240)
- Calculates **brightness variance** across the image
- Analyzes **local brightness patterns** using 16×16 block grid
- Real faces: Natural lighting gradients and organic highlights
- Screens/photos: Uniform lighting or artificial highlight patterns

**Metrics**:
- Highlight ratio: Percentage of very bright pixels
- Brightness variance: Overall lighting variation
- Block variance: Non-uniformity of local brightness regions
- Combined score: `(highlightScore × 0.4) + (varianceScore × 0.3) + (blockScore × 0.3)`

**Threshold**: `0.28` (0-1 scale)

**Implementation**:
```typescript
const reflection = await analyzeReflection(imageBuffer);
const passes = reflection > 0.28;
```

---

### 4. **Color Spectrum Analysis** (`color-spectrum-analysis.ts`)

**Purpose**: Verify natural skin tones and color distribution.

**Algorithm**:
- **Color variance**: RGB channel variation (real skin has natural color variation)
- **Saturation analysis**: HSV model to detect artificial saturation levels
- **Skin tone detection**: Validates presence of realistic skin color ranges
- **Channel correlation**: Analyzes R-G-B relationships (screens have artificial correlations)

**Skin Tone Detection Rules**:
```typescript
R > 95 && G > 40 && B > 20 &&
R > G && R > B &&
|R - G| > 15 &&
max(R,G,B) - min(R,G,B) > 15
```

**Metrics**:
- Color variance score (30% weight)
- Saturation naturalness (20% weight)
- Skin tone presence (40% weight)
- Channel correlation (10% weight)

**Threshold**: `0.40` (0-1 scale)

**Implementation**:
```typescript
const colorSpectrum = await analyzeColorSpectrum(imageBuffer);
const passes = colorSpectrum > 0.40;
```

---

### 5. **Depth Estimation** (`depth-estimation.ts`)

**Purpose**: Distinguish 3D real faces from flat 2D images.

**Algorithm**:
- **Gradient magnitude mapping**: Uses Sobel operator to detect edge sharpness
- **Region-based analysis**: Compares center (nose) vs edges (ears, background)
- **Gradient ratio**: Real 3D faces have sharper center, softer edges
- **Edge coherence**: Detects natural facial contours vs artificial patterns

**Physical Principle**:
- Real 3D faces: Varying depth causes varying focus (nose sharper than ears)
- Flat photos/screens: Uniform focus across entire image

**Metrics**:
- Center-to-edge gradient ratio (40% weight): Expect 1.2-1.8 for real faces
- Gradient variance (40% weight): 3D structure variation
- Edge coherence (20% weight): Natural contour patterns

**Threshold**: `0.50` (0-1 scale)

**Implementation**:
```typescript
const depth = await estimateFaceDepth(imageBuffer);
const passes = depth > 0.50;
```

---

### 6. **Eye Detection** (`eye-detection.ts`) 🆕

**Purpose**: Verify both eyes are open and face is frontal using ML-based face detection with pixel-level eye analysis.

**Technology Stack**:
- **BlazeFace**: Lightweight TensorFlow.js face detection model (~200KB)
- **Pure JavaScript**: `@tensorflow/tfjs` (no native compilation required)
- **Node.js Compatible**: Works server-side without browser dependencies
- **Production-Ready**: Compatible with Vercel, AWS Lambda, Docker

**Algorithm - Three-Layer Validation**:

#### Layer 1: Facial Geometry
```typescript
// Eyes must be roughly horizontal (frontal face)
symmetryRatio = |rightEye.y - leftEye.y| / eyeDistance
isSymmetric = symmetryRatio < 0.15

// Nose must be below eyes (not upside down)
isFrontal = nose.y > eyeMidpoint.y

// Natural facial proportions
proportionRatio = noseToEyeDistance / eyeDistance
hasGoodProportions = 0.3 < proportionRatio < 2.0
```

#### Layer 2: Individual Eye Analysis (Pixel Variance)
```typescript
// Extract 15% region around each eye landmark
// Calculate pixel intensity variance in eye region

// Open eyes: High variance (pupil/iris/sclera contrast)
// Closed/squinted eyes: Low variance (smooth eyelid)

MIN_VARIANCE = 600
rightEyeOpen = rightEyeVariance > 600
leftEyeOpen = leftEyeVariance > 600
```

#### Layer 3: Eye Balance Check
```typescript
// Prevent one eye open, one eye closed/squinted
varianceRatio = min(variance) / max(variance)

// Eyes must be within 35% similarity
areBalanced = varianceRatio > 0.35
```

**Pass Condition**:
```typescript
PASS = rightEyeOpen && leftEyeOpen && areBalanced && 
       isSymmetric && isFrontal && hasGoodProportions
```

**Example Variance Values**:
- Closed eye: 150-400 ❌
- Squinted eye: 400-600 ❌
- Partially open: 600-800 ⚠️
- Wide open: 800-1500 ✅

**Model Caching**: BlazeFace model loads once (~2-3s) and caches for subsequent requests (~100-200ms)

**Implementation**:
```typescript
const eyesOpen = await detectEyesOpen(imageBuffer);
const passes = eyesOpen === true;
```

**Why BlazeFace over MediaPipe?**
| Feature | BlazeFace ✅ | MediaPipe ❌ |
|---------|-------------|--------------|
| Node.js Server-Side | Yes | Browser-only |
| Native Dependencies | None | Requires browser assets |
| Model Size | ~200KB | ~10MB |
| Landmarks | 6 key points | 468 points |
| Speed | Fast (~100ms) | Slower (~300ms) |
| Production Ready | Vercel/Lambda/Docker | Client-side only |

---

## Production Deployment

### Dependencies

```json
{
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow-models/blazeface": "^0.0.7",
  "sharp": "^0.33.x"
}
```

### Why `@tensorflow/tfjs` instead of `@tensorflow/tfjs-node`?

✅ **No Build Tools Required**: Pure JavaScript, no C++ compilation  
✅ **Cross-Platform**: Works on Windows, Linux, macOS without Visual Studio Build Tools  
✅ **Deployment-Friendly**: Compatible with Vercel, AWS Lambda, Docker, Cloud Run  
✅ **No Native Dependencies**: Runs in standard Node.js environment  
✅ **Smaller Installation**: Faster npm install, smaller node_modules

**Trade-off**: Slightly slower inference (~20-30% slower than native), but still fast enough for real-time detection.

---

## Usage

### Basic Usage

```typescript
import {
  calculateBlur,
  analyzeTexture,
  analyzeReflection,
  analyzeColorSpectrum,
  estimateFaceDepth,
  detectEyesOpen,
  LIVENESS_THRESHOLDS,
} from '@/lib/liveness-tests';

// Convert base64 image to buffer
const buffer = Buffer.from(base64Image, 'base64');

// Run all tests
const [blur, texture, reflection, colorSpectrum, depth, eyesOpen] = await Promise.all([
  calculateBlur(buffer),
  analyzeTexture(buffer),
  analyzeReflection(buffer),
  analyzeColorSpectrum(buffer),
  estimateFaceDepth(buffer),
  detectEyesOpen(buffer),
]);

// Check against thresholds
const results = {
  blur: { value: blur, passes: blur > LIVENESS_THRESHOLDS.blur },
  texture: { value: texture, passes: texture > LIVENESS_THRESHOLDS.texture },
  reflection: { value: reflection, passes: reflection > LIVENESS_THRESHOLDS.reflection },
  colorSpectrum: { value: colorSpectrum, passes: colorSpectrum > LIVENESS_THRESHOLDS.colorSpectrum },
  depth: { value: depth, passes: depth > LIVENESS_THRESHOLDS.depth },
  eyesOpen: { value: eyesOpen, passes: eyesOpen },
};

// Overall pass/fail
const allPassed = Object.values(results).every(r => r.passes);
```

### Sequential Testing (Early Exit)

```typescript
// Stop testing early if a critical test fails
const buffer = Buffer.from(base64Image, 'base64');

// 1. Fast tests first
const blur = await calculateBlur(buffer);
if (blur <= LIVENESS_THRESHOLDS.blur) {
  return { passed: false, reason: 'Image too blurry' };
}

const texture = await analyzeTexture(buffer);
if (texture <= LIVENESS_THRESHOLDS.texture) {
  return { passed: false, reason: 'Insufficient texture detail' };
}

// 2. ML-based eye detection (slower)
const eyesOpen = await detectEyesOpen(buffer);
if (!eyesOpen) {
  return { passed: false, reason: 'Eyes not detected or not open' };
}

// 3. Continue with remaining tests...
```

---

## Adjusting Thresholds

Thresholds are defined in `index.ts`:

```typescript
export const LIVENESS_THRESHOLDS = {
  blur: 120,           // Increase to require sharper images
  texture: 0.20,       // Increase to require more texture detail
  reflection: 0.28,    // Increase to require more natural lighting
  colorSpectrum: 0.40, // Increase to require stronger skin tones
  depth: 0.50,         // Increase to require clearer 3D characteristics
} as const;
```

### Tuning Guidelines

**More Strict (Fewer False Accepts)**:
```typescript
{
  blur: 150,         // Require very sharp images
  texture: 0.25,     // Require more skin texture
  reflection: 0.32,  // Stricter lighting requirements
  colorSpectrum: 0.45, // Stronger skin tone presence
  depth: 0.55,       // More pronounced 3D depth
}
```

**More Lenient (Fewer False Rejects)**:
```typescript
{
  blur: 100,         // Allow slightly blurry images
  texture: 0.18,     // Less texture required
  reflection: 0.25,  // More flexible lighting
  colorSpectrum: 0.35, // Weaker skin tone requirements
  depth: 0.45,       // Less strict 3D requirements
}
```

---

## Performance Characteristics

### Timing Benchmarks

| Test | First Call | Cached (Subsequent) | Notes |
|------|-----------|-------------------|-------|
| Blur Detection | ~30ms | ~30ms | CPU-bound |
| Texture Analysis | ~40ms | ~40ms | CPU-bound |
| Reflection Analysis | ~35ms | ~35ms | CPU-bound |
| Color Spectrum | ~50ms | ~50ms | More complex calculations |
| Depth Estimation | ~60ms | ~60ms | Gradient computations |
| **Eye Detection** | **2-3 seconds** | **100-200ms** | Model loading vs inference |

**Total Time**:
- First request: ~3 seconds (model loading)
- Subsequent requests: ~300-400ms (all tests combined)

### Memory Usage

- **Base sharp library**: ~20MB
- **TensorFlow.js runtime**: ~30MB
- **BlazeFace model**: ~50MB (cached after first load)
- **Total**: ~100MB per Node.js process

### Optimization Tips

1. **Parallel Execution**: Run non-dependent tests in parallel using `Promise.all()`
2. **Early Exit**: Stop testing if critical tests fail (blur, texture)
3. **Image Resizing**: Resize large images before processing (320x240 is sufficient)
4. **Model Pre-warming**: Load BlazeFace model on server startup
5. **Connection Pooling**: Reuse Sharp instances when possible

---

## Error Handling

All functions handle errors gracefully:

```typescript
try {
  const eyesOpen = await detectEyesOpen(buffer);
  // eyesOpen === false if detection fails
} catch (error) {
  // Errors are logged internally
  // Function returns false (fail-safe)
}
```

**Fail-Safe Behavior**:
- Invalid image buffer → Returns `false` or lowest score
- Model loading failure → Returns `false`
- Insufficient landmarks → Returns `false`
- Out of memory → Logs error, returns `false`

---

## Debugging

Enable detailed logging by checking console output:

```typescript
// Eye detection logs
[BlazeFace] Loading model...
[BlazeFace] Model loaded successfully
[EyeDetection] Geometry - symmetry=0.046, frontal=true, proportions=0.458
[EyeDetection] Right eye - variance=877.8, open=true
[EyeDetection] Left eye - variance=1297.8, open=true
[EyeDetection] Eye balance - ratio=0.676 (min/max variance), balanced=true
[EyeDetection] Face detected with 1 face(s), eyes open: true
```

---

## Architecture

```
src/lib/liveness-tests/
├── index.ts                    # Main exports & thresholds
├── README.md                   # This file
├── blur-detection.ts           # Laplacian variance
├── texture-analysis.ts         # Standard deviation + edge density
├── reflection-analysis.ts      # Brightness patterns + highlights
├── color-spectrum-analysis.ts  # RGB/HSV + skin tone detection
├── depth-estimation.ts         # Gradient analysis + 3D cues
└── eye-detection.ts            # BlazeFace + pixel variance analysis
```

---

## Security Considerations

**This is defense-in-depth anti-spoofing**:
- No single test is foolproof
- Multiple independent tests increase difficulty of spoofing
- Thresholds tuned to balance security vs usability
- Should be combined with other security measures (challenges, passive liveness, etc.)

**Known Limitations**:
- High-quality 3D masks may bypass some tests
- Video replay attacks require additional temporal analysis
- Extremely good lighting/makeup can affect texture/color scores

**Recommended Additional Measures**:
- Random challenge-response (blink detection, head movement)
- Temporal consistency checks (multiple frames)
- Device fingerprinting
- Behavioral biometrics

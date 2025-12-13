// Extend the face annotation type to include eye open likelihoods
interface FaceAnnotationWithLikelihood {
  detectionConfidence?: number;
  leftEyeOpenLikelihood?: string;
  rightEyeOpenLikelihood?: string;
  [key: string]: any;
}
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Allow disabling Google Cloud Vision to avoid charges
// Set `GOOGLE_VISION_ENABLED=false` or `USE_GOOGLE_VISION=0` to disable (default: enabled)
const ENABLE_GOOGLE_VISION = (() => {
  const env = process.env.GOOGLE_VISION_ENABLED ?? process.env.USE_GOOGLE_VISION ?? "true";
  return !(env === "0" || env.toLowerCase() === "false");
})();

if (!ENABLE_GOOGLE_VISION) {
  console.warn('[vision-face-detect] Google Cloud Vision integration disabled via environment variable.');
}

let client: any = null;
let clientInitAttempted = false;
let clientInitError: string | null = null;

async function getVisionClient() {
  if (!ENABLE_GOOGLE_VISION) return null;
  if (client) return client;
  if (clientInitAttempted && clientInitError) return null;

  clientInitAttempted = true;
  try {
    const mod = await import('@google-cloud/vision');
    const visionLib = (mod && (mod as any).default) ? (mod as any).default : mod;
    // Build config for the Vision client depending on available credential sources
    let clientConfig: any = {};
    // 1) Credentials JSON in env var (used for Cloud Run / CI)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        clientConfig.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      } catch (err) {
        console.warn('[vision-face-detect] Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON; falling back to other credential sources', err);
      }
    }
    // 2) Explicit path in env var (e.g. local dev or mounted file)
    if (!clientConfig.credentials && process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH) {
      const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH;
      const filename = path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
      if (fs.existsSync(filename)) {
        clientConfig.keyFilename = filename;
      }
    }
    // 3) Local repo key file (development only) - only if no other credentials found
    if (!clientConfig.credentials && !clientConfig.keyFilename) {
      const filename = path.join(process.cwd(), "keys/google_api.json");
      if (fs.existsSync(filename)) {
        clientConfig.keyFilename = filename;
      }
    }
    client = new visionLib.ImageAnnotatorClient(clientConfig);
    clientInitError = null;
    return client;
  } catch (err) {
    clientInitError = String(err);
    console.warn('[vision-face-detect] Could not initialize Google Cloud Vision client; disabling Vision endpoint', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { imageBase64 } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  try {
    if (!ENABLE_GOOGLE_VISION) {
      return NextResponse.json({ error: 'Google Cloud Vision integration disabled on this server', enabled: false }, { status: 503 });
    }
    const visionClient = await getVisionClient();
    if (!visionClient) {
      return NextResponse.json({ error: 'Google Cloud Vision client unavailable or failed to initialize', details: clientInitError, enabled: false }, { status: 503 });
    }
    const [result] = await visionClient.faceDetection({
      image: { content: imageBase64 },
    });
    const faces = result.faceAnnotations || [];

    // Strict checks:
    // 1. Exactly one face
    if (faces.length !== 1) {
      return NextResponse.json({ error: faces.length === 0 ? "No face detected" : "Multiple faces detected" }, { status: 400 });
    }
    const face = faces[0] as FaceAnnotationWithLikelihood;
    
    // Log summarized face annotation for debugging
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📸 Google Vision Face Detection Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✓ Detection Confidence: ${((face.detectionConfidence || 0) * 100).toFixed(1)}%`);
    console.log(`✓ Landmarking Confidence: ${((face.landmarkingConfidence || 0) * 100).toFixed(1)}%`);
    console.log(`✓ Face Pose:`);
    console.log(`  - Roll Angle: ${(face.rollAngle || 0).toFixed(1)}°`);
    console.log(`  - Pan Angle: ${(face.panAngle || 0).toFixed(1)}°`);
    console.log(`  - Tilt Angle: ${(face.tiltAngle || 0).toFixed(1)}°`);
    console.log(`✓ Facial Features Detected: ${(face.landmarks || []).length} landmarks`);
    console.log(`✓ Quality Checks:`);
    console.log(`  - Blurred: ${face.blurredLikelihood || 'UNKNOWN'}`);
    console.log(`  - Under Exposed: ${face.underExposedLikelihood || 'UNKNOWN'}`);
    console.log(`  - Headwear: ${face.headwearLikelihood || 'UNKNOWN'}`);
    console.log(`✓ Expressions:`);
    console.log(`  - Joy: ${face.joyLikelihood || 'UNKNOWN'}`);
    console.log(`  - Sorrow: ${face.sorrowLikelihood || 'UNKNOWN'}`);
    console.log(`  - Anger: ${face.angerLikelihood || 'UNKNOWN'}`);
    console.log(`  - Surprise: ${face.surpriseLikelihood || 'UNKNOWN'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 2. High detection confidence (e.g., > 0.8)
    if (face.detectionConfidence === undefined || face.detectionConfidence < 0.9) {
      return NextResponse.json({ error: "Face detection confidence too low", confidence: face.detectionConfidence }, { status: 400 });
    }
    // Eye check removed as per user request

    // If all strict checks pass, return face data
    return NextResponse.json({ faces });
  } catch (error) {
    console.error('[vision-face-detect] Vision API error', error);
    return NextResponse.json({ error: "Vision API error", details: String(error) }, { status: 500 });
  }
}

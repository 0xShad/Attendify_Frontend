// Extend the face annotation type to include eye open likelihoods
interface FaceAnnotationWithLikelihood {
  detectionConfidence?: number;
  leftEyeOpenLikelihood?: string;
  rightEyeOpenLikelihood?: string;
  [key: string]: any;
}
import { NextRequest, NextResponse } from "next/server";
import vision from "@google-cloud/vision";
import fs from "fs";
import path from "path";

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
  const filename = path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH);
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

const client = new vision.ImageAnnotatorClient(clientConfig);

export async function POST(req: NextRequest) {
  const { imageBase64 } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  try {
    const [result] = await client.faceDetection({
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
    return NextResponse.json({ error: "Vision API error" }, { status: 500 });
  }
}

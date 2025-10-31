// Extend the face annotation type to include eye open likelihoods
interface FaceAnnotationWithLikelihood {
  detectionConfidence?: number;
  leftEyeOpenLikelihood?: string;
  rightEyeOpenLikelihood?: string;
  [key: string]: any;
}
import { NextRequest, NextResponse } from "next/server";
import vision from "@google-cloud/vision";
import path from "path";

const keyPath = path.join(process.cwd(), "keys/google_api.json");

const client = new vision.ImageAnnotatorClient({
  keyFilename: keyPath,
});

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
    // Log the full face annotation for debugging
    console.log('Google Vision face annotation:', JSON.stringify(face, null, 2));
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

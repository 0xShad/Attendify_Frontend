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
    return NextResponse.json({ faces });
  } catch (error) {
    return NextResponse.json({ error: "Vision API error" }, { status: 500 });
  }
}

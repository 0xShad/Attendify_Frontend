import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VALIDATION_CONFIG } from "@/config/auth";

/**
 * GET /api/session/profile/onboarded
 * POST /api/session/profile/onboard
 * 
 * Proxy endpoints for middleware to check and manage onboarding status.
 * These endpoints forward requests to the backend profile endpoints.
 */

export async function GET(req: NextRequest) {
  try {
    const ck = await cookies();
    const token = ck.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "no_token" }, { status: 401 });
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/profiles/onboarded`;

    if (!backendUrl || backendUrl.includes("undefined")) {
      console.error("NEXT_PUBLIC_BACKEND_API_URL not configured:", backendUrl);
      return NextResponse.json(
        { error: "backend_not_configured" },
        { status: 500 }
      );
    }

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": contentType },
    });
  } catch (error) {
    console.error("Error in GET /api/session/profile/onboarded:", error);
    return NextResponse.json(
      { error: "internal_error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ck = await cookies();
    const token = ck.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "no_token" }, { status: 401 });
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/profiles/onboard`;

    if (!backendUrl || backendUrl.includes("undefined")) {
      console.error("NEXT_PUBLIC_BACKEND_API_URL not configured:", backendUrl);
      return NextResponse.json(
        { error: "backend_not_configured" },
        { status: 500 }
      );
    }

    const body = await req.arrayBuffer();

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body.byteLength ? Buffer.from(body) : "{}",
      signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": contentType },
    });
  } catch (error) {
    console.error("Error in POST /api/session/profile/onboarded:", error);
    return NextResponse.json(
      { error: "internal_error", details: String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VALIDATION_CONFIG } from "@/config/auth";

/**
 * GET /api/session/profile/[id]
 * 
 * Proxy endpoint for middleware to fetch user profile.
 * This endpoint forwards requests to the backend profile endpoint.
 * 
 * Returns:
 * - 200 with profile data on success
 * - 404 if profile not found
 * - 401 if not authorized
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ck = await cookies();
    const token = ck.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "no_token" }, { status: 401 });
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/profiles/${id}`;

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
    console.error("Error in /api/session/profile/[id]:", error);
    return NextResponse.json(
      { error: "internal_error", details: String(error) },
      { status: 500 }
    );
  }
}

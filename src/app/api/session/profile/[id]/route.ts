import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VALIDATION_CONFIG } from "@/config/auth";

/**
 * GET /api/session/profile/[id]
 * 
 * Proxy endpoint for middleware to fetch user profile.
 * This endpoint forwards requests to the backend profile endpoint.
 * Supports both profile_id and user_id.
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

    // Try to fetch from backend - support both /id/{profile_id} and /user/{user_id} paths
    const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    
    if (!backendBaseUrl || backendBaseUrl.includes("undefined")) {
      console.error("NEXT_PUBLIC_BACKEND_API_URL not configured:", backendBaseUrl);
      return NextResponse.json(
        { error: "backend_not_configured" },
        { status: 500 }
      );
    }

    // First try: assume id is a profile_id
    let backendUrl = `${backendBaseUrl}/v1/profiles/id/${id}`;
    console.log(`[PROFILE PROXY] Trying profile_id endpoint: ${backendUrl}`);
    
    let res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
    });

    console.log(`[PROFILE PROXY] Profile ID response: ${res.status}`);

    // If 404, try assuming id is a user_id
    if (res.status === 404) {
      backendUrl = `${backendBaseUrl}/v1/profiles/user/${id}`;
      console.log(`[PROFILE PROXY] Trying user_id endpoint: ${backendUrl}`);
      
      res = await fetch(backendUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
      });
      
      console.log(`[PROFILE PROXY] User ID response: ${res.status}`);
    }

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

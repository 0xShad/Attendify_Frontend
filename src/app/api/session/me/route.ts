import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTokenEntry, setTokenEntry } from "@/lib/server/tokenCache";
import { VALIDATION_CONFIG } from "@/config/auth";

/**
 * GET /api/session/me
 * 
 * Proxy endpoint for middleware to validate token and get user info.
 * This endpoint is called by middleware.ts to get user ID without direct
 * access to backend URLs from the server-side code.
 * 
 * Returns:
 * - 401 if not authenticated
 * - 200 with { id, user_id, ... } on success
 */
export async function GET(req: NextRequest) {
  try {
    const ck = await cookies();
    const token = ck.get("access_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "no_token" }, { status: 401 });
    }

    // Quick cache check first
    const cached = getTokenEntry(token);
    if (cached && cached.isValid && cached.userId) {
      return NextResponse.json({
        id: cached.userId,
        user_id: cached.userId,
      });
    }

    // Cache miss or invalid - call backend to validate
    const backendUserUrl = `${process.env.NEXT_PUBLIC_USER_API_URL}/me`;
    
    if (!backendUserUrl || backendUserUrl.includes("undefined")) {
      console.error("NEXT_PUBLIC_USER_API_URL not configured:", backendUserUrl);
      return NextResponse.json(
        { error: "backend_not_configured" },
        { status: 500 }
      );
    }

    const userRes = await fetch(backendUserUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
    });

    if (!userRes.ok) {
      // Cache the failed validation
      if (userRes.status === 401) {
        setTokenEntry(token, {
          isValid: false,
          expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
        });
      }
      return NextResponse.json(
        { error: "unauthorized" },
        { status: userRes.status }
      );
    }

    const user = await userRes.json();
    const userId = user.id || user.user_id;

    if (!userId) {
      return NextResponse.json(
        { error: "no_user_id" },
        { status: 400 }
      );
    }

    // Cache successful validation
    try {
      setTokenEntry(token, {
        isValid: true,
        userId,
        expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
      });
    } catch (e) {
      // ignore cache errors
    }

    return NextResponse.json({
      id: userId,
      user_id: userId,
      ...user,
    });
  } catch (error) {
    console.error("Error in /api/session/me:", error);
    return NextResponse.json(
      { error: "internal_error", details: String(error) },
      { status: 500 }
    );
  }
}

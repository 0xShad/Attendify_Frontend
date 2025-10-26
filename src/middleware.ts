import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProtectedRoute, isAuthRoute } from "@/lib/middleware/utils";
import { COOKIE_CONFIG, REDIRECT_URLS, VALIDATION_CONFIG } from "@/config/auth";

/**
 * In-memory cache for token validation results
 * Key: token, Value: { isValid: boolean, expiresAt: number }
 */
const tokenCache = new Map<string, { isValid: boolean; expiresAt: number; userId?: number }>();

/**
 * Decode JWT payload without verification (client-side check only)
 * Used to quickly check expiration before making backend call
 */
function decodeJWT(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    return payload;
  } catch (error) {
    console.error("JWT decode failed:", error);
    return null;
  }
}

/**
 * Check if JWT is expired (client-side check)
 * Returns true if token is expired or invalid
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;

  // Check if token is expired (with configurable buffer)
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now + VALIDATION_CONFIG.TOKEN_EXPIRY_BUFFER_SECONDS;
}

/**
 * Verify JWT token with backend
 * Calls /api/v1/users/me to validate token and get user data
 * Includes caching to reduce backend calls
 */
/**
 * Verify JWT token with backend and return user info if valid
 * Returns { isValid, userId } or { isValid: false }
 */
async function verifyTokenAndGetUser(accessToken: string): Promise<{ isValid: boolean; userId?: number }> {
  // Check cache first
  const cached = tokenCache.get(accessToken);
  if (cached && cached.expiresAt > Date.now()) {
    return { isValid: cached.isValid, userId: cached.userId };
  }

  // Quick client-side expiration check
  if (isTokenExpired(accessToken)) {
    tokenCache.set(accessToken, {
        isValid: false,
        expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
        userId: undefined,
      });
    return { isValid: false };
  }

  // Validate with backend
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      tokenCache.set(accessToken, {
          isValid: false,
          expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
          userId: undefined,
        });
      return { isValid: false };
    }
    const user = await response.json();
    const userId = user.id || user.user_id;
    tokenCache.set(accessToken, {
      isValid: true,
      userId,
      expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
    });
      tokenCache.set(accessToken, {
        isValid: true,
        userId,
        expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
      });
    return { isValid: true, userId };
  } catch (error) {
    console.error("Token verification failed:", error);
    tokenCache.set(accessToken, {
        isValid: false,
        expiresAt: Date.now() + VALIDATION_CONFIG.FAILURE_CACHE_TTL_MS,
        userId: undefined,
      });
    return { isValid: false };
  }
}

/**
 * HTTP-based middleware for route protection
 * Validates authentication using HTTP-only cookies on the server
 *
 * Flow:
 * 1. Check if user has access_token cookie
 * 2. Quick check: Decode JWT and verify expiration (client-side)
 * 3. Cache check: Return cached validation result if available
 * 4. Backend validation: Call /api/v1/users/me to verify token
 * 5. Redirect unauthenticated users from protected routes → login
 * 6. Redirect authenticated users from auth routes → dashboard
 * 7. Allow all other requests
 *
 * Optimizations:
 * - In-memory cache (1 minute TTL) - reduces backend calls
 * - Client-side JWT expiration check - avoids backend call for expired tokens
 * - Request timeout (5s) - prevents hanging on slow backend
 * - Cache cleanup - prevents memory leaks
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // DEV BYPASS: If NEXT_PUBLIC_DEV_AUTH_BYPASS is set to "1" or "true"
  const devBypass = ["1", "true"].includes(
    String(process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS).toLowerCase()
  );
  if (devBypass) {
    return NextResponse.next();
  }

  // Get authentication status from HTTP-only cookie
  const accessToken = request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN.name)?.value;
  let isAuthenticated = false;
  let userId: number | undefined;
  let userRole: string | undefined;

  if (accessToken) {
    const result = await verifyTokenAndGetUser(accessToken);
    isAuthenticated = result.isValid;
    userId = result.userId;
    // If authenticated, fetch profile for role
    if (isAuthenticated && userId) {
      try {
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/profiles/${userId}`);
        if (profileRes.ok) {
          const profile = await profileRes.json();
          userRole = profile.role;
        } else {
          // Profile not found (404 or error)
          userRole = undefined;
        }
      } catch (err) {
        console.error("Profile fetch failed:", err);
        userRole = undefined;
      }
    }
  }


  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL(REDIRECT_URLS.LOGIN, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users with missing/invalid role to /profile/create on any protected route,
  // but allow them to access /profile/create itself
  if (
    isProtectedRoute(pathname) &&
    isAuthenticated &&
    (!userRole || !["Admin", "Faculty", "Student"].includes(userRole)) &&
    pathname !== "/profile/create"
  ) {
    return NextResponse.redirect(new URL("/profile/create", request.url));
  }

  // Redirect authenticated users from auth routes to their dashboard by role
  if (isAuthRoute(pathname) && isAuthenticated) {
    let redirectUrl: string;
    switch (userRole) {
      case "Admin":
        redirectUrl = REDIRECT_URLS.ADMIN_DASHBOARD;
        break;
      case "Faculty":
        redirectUrl = REDIRECT_URLS.FACULTY_DASHBOARD;
        break;
      case "Student":
        redirectUrl = REDIRECT_URLS.STUDENT_DASHBOARD;
        break;
      default:
        // If role is missing, null, undefined, or error, go to profile create
        redirectUrl = "/profile/create";
        break;
    }
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

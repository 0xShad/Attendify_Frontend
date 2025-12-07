import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProtectedRoute, isAuthRoute } from "@/lib/middleware/utils";
import { COOKIE_CONFIG, REDIRECT_URLS, VALIDATION_CONFIG } from "@/config/auth";
import { getTokenEntry, setTokenEntry } from "@/lib/server/tokenCache";

// Extended cache entries may include onboarding/profile fields and an `onboardAttemptedAt` timestamp (ms since epoch)
type TokenCacheEntry = {
  isValid: boolean;
  expiresAt: number;
  userId?: number;
  onboardAttemptedAt?: number;
  profileId?: number;
  email?: string | null;
  username?: string | null;
  full_name?: string | null;
  role?: string;
};

/**
 * In-memory cache for token validation results
 * Key: token, Value: TokenCacheEntry
 */
// token cache is now provided by `src/lib/server/tokenCache.ts`
// Track per-user onboarding attempt timestamps so we can reset attempts on logout/login.
const userOnboardAttempt = new Map<number, number>(); // userId -> timestamp (ms)
// Track last seen token per user to detect a new login (token changed)
const lastTokenByUser = new Map<number, string>(); // userId -> accessToken

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
async function verifyTokenAndGetUser(
  accessToken: string,
  request: NextRequest
): Promise<{ isValid: boolean; userId?: number }> {
  // Check cache first
  const cachedEntry = getTokenEntry(accessToken);
  if (cachedEntry) {
    console.log(`[MIDDLEWARE] Using cached token validation: isValid=${cachedEntry.isValid}, userId=${cachedEntry.userId}`);
    return { isValid: cachedEntry.isValid, userId: cachedEntry.userId };
  }
  
  console.log(`[MIDDLEWARE] No cache entry found, validating token...`);

  // Quick client-side expiration check
  if (isTokenExpired(accessToken)) {
    console.log(`[MIDDLEWARE] Token is expired (client-side check)`);
    setTokenEntry(accessToken, {
      isValid: false,
      expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
      userId: undefined,
    });
    return { isValid: false };
  }
  
  console.log(`[MIDDLEWARE] Token not expired, proceeding with backend validation...`);

  // Validate with backend directly (Edge middleware can't reliably fetch internal routes)
  try {
    const backendUserUrl = process.env.NEXT_PUBLIC_USER_API_URL;
    
    if (!backendUserUrl) {
      console.error(`[MIDDLEWARE] NEXT_PUBLIC_USER_API_URL not configured`);
      setTokenEntry(accessToken, {
        isValid: false,
        expiresAt: Date.now() + VALIDATION_CONFIG.FAILURE_CACHE_TTL_MS,
        userId: undefined,
      });
      return { isValid: false };
    }
    
    const apiUrl = `${backendUserUrl}/me`;
    console.log(`[MIDDLEWARE] Calling backend directly: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
    });
    
    console.log(`[MIDDLEWARE] Backend response status: ${response.status}`);
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read response');
      console.error(`[MIDDLEWARE] Backend validation failed: ${response.status}`, errorBody);
      setTokenEntry(accessToken, {
        isValid: false,
        expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
        userId: undefined,
      });
      return { isValid: false };
    }
    const user = await response.json();
    const userId = user.id || user.user_id;
    console.log(`[MIDDLEWARE] Token validated successfully, userId: ${userId}`);
    setTokenEntry(accessToken, {
      isValid: true,
      userId,
      expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
    });
    return { isValid: true, userId };
  } catch (error) {
    console.error(`[MIDDLEWARE] Token verification exception:`, error);
    console.error(`[MIDDLEWARE] Error name: ${error instanceof Error ? error.name : 'unknown'}`);
    console.error(`[MIDDLEWARE] Error message: ${error instanceof Error ? error.message : String(error)}`);
    setTokenEntry(accessToken, {
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

  console.log(`\n[MIDDLEWARE] Processing: ${pathname}`);

  // DEV BYPASS: If NEXT_PUBLIC_DEV_AUTH_BYPASS is set to "1" or "true"
  const devBypass = ["1", "true"].includes(
    String(process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS).toLowerCase()
  );
  if (devBypass) {
    console.log("[MIDDLEWARE] DEV BYPASS enabled, allowing all requests");
    return NextResponse.next();
  }

  // Get authentication status from HTTP-only cookie
  const accessToken = request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN.name)?.value;
  console.log(`[MIDDLEWARE] Access token present: ${!!accessToken}`);
  
  let isAuthenticated = false;
  let userId: number | undefined;
  let userRole: string | undefined;
  let profileFetchError = false;

  if (accessToken) {
    console.log(`[MIDDLEWARE] Starting token verification for token: ${accessToken.substring(0, 20)}...`);
    const result = await verifyTokenAndGetUser(accessToken, request);
    isAuthenticated = result.isValid;
    userId = result.userId;
    console.log(`[MIDDLEWARE] Token validation complete: isAuthenticated=${isAuthenticated}, userId=${userId}`);
    // Detect token change per-user to reset onboarding attempt state on login
    try {
      if (isAuthenticated && userId) {
        const last = lastTokenByUser.get(userId);
        if (!last || last !== accessToken) {
          // new token for this user -> treat as fresh login, clear previous onboard attempts
          userOnboardAttempt.delete(userId);
          lastTokenByUser.set(userId, accessToken);
        }
      }
    } catch (e) {
      // ignore
    }
    // If authenticated, fetch profile for role
    if (isAuthenticated && userId) {
      console.log(`[MIDDLEWARE] Fetching profile for userId=${userId}`);
      try {
        // Check cache first for role/enrichment
        const cached = getTokenEntry(accessToken);
        if (cached && cached.role) {
          userRole = cached.role;
          console.log(`[MIDDLEWARE] Found cached role: ${userRole}`);
        } else {
          console.log(`[MIDDLEWARE] No cached role, fetching from backend`);
          // Fetch profile directly from backend (Edge middleware can't reliably fetch internal routes)
          const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
          
          if (!backendBaseUrl) {
            console.error(`[MIDDLEWARE] NEXT_PUBLIC_BACKEND_API_URL not configured`);
            profileFetchError = true;
          } else {
            // Try to get profile - using correct backend endpoint structure
            // Backend endpoint: GET /api/v1/users/profiles/{user_id}
            // NEXT_PUBLIC_BACKEND_API_URL should be: https://...run.app/api
            let profileUrl = `${backendBaseUrl}/v1/users/profiles/${userId}`;
            console.log(`[MIDDLEWARE] Calling backend profile endpoint: ${profileUrl}`);
            
            try {
              const profileRes = await fetch(profileUrl, {
                headers: { 
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json"
                },
                signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
              });

              console.log(`[MIDDLEWARE] Profile fetch status: ${profileRes.status}`);

              // If 404, try alternative endpoint /profiles/{id} where id = user_id
              if (profileRes.status === 404) {
                console.log(`[MIDDLEWARE] Profile not found via /user/${userId}, trying /profiles/${userId}`);
                profileUrl = `${backendBaseUrl}/v1/profiles/${userId}`;
                
                try {
                  const altProfileRes = await fetch(profileUrl, {
                    headers: { 
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json"
                    },
                    signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
                  });
                  
                  console.log(`[MIDDLEWARE] Alternative profile fetch status: ${altProfileRes.status}`);
                  
                  if (altProfileRes.ok) {
                    const profile = await altProfileRes.json();
                    
                    // Process profile same as before
                    const roleValue = profile.role || profile.Role;
                    const isAdmin = roleValue && String(roleValue).toLowerCase() === "admin";
                    
                    if (isAdmin) {
                      userRole = "Admin";
                      console.log(`[MIDDLEWARE] Got Admin profile via alt endpoint, Role: ${userRole}, profile:`, profile);
                    } else {
                      const hasOrganization = profile.organization_id != null;
                      if (hasOrganization) {
                        userRole = profile.role || profile.Role;
                        console.log(`[MIDDLEWARE] Got profile via alt endpoint with role: ${userRole}, organization_id: ${profile.organization_id}`);
                      } else {
                        userRole = undefined;
                        console.log(`[MIDDLEWARE] Profile via alt endpoint NOT onboarded (no organization_id)`);
                      }
                    }
                    
                    // Cache the result
                    try {
                      setTokenEntry(accessToken, {
                        isValid: true,
                        userId,
                        role: userRole,
                        profileId: profile.id ?? undefined,
                        email: typeof profile.email !== 'undefined' ? profile.email : null,
                        username: typeof profile.username !== 'undefined' ? profile.username : null,
                        full_name:
                          typeof profile.full_name !== 'undefined'
                            ? profile.full_name
                            : (profile.firstname || profile.lastname) ? `${profile.firstname || ''} ${profile.lastname || ''}`.trim() : null,
                        expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
                      });
                    } catch (e) {
                      // ignore
                    }
                  } else {
                    // Still 404 or other error
                    userRole = undefined;
                    console.log(`[MIDDLEWARE] Profile not found via alternative endpoint either, userRole set to undefined`);
                  }
                } catch (err) {
                  console.error("[MIDDLEWARE] Alternative profile fetch failed:", err);
                  userRole = undefined;
                }
              } else if (profileRes.ok) {
                const profile = await profileRes.json();
                
                // Admins don't need organization_id - they can access system immediately
                // Case-insensitive check for Admin role
                const roleValue = profile.role || profile.Role;
                const isAdmin = roleValue && String(roleValue).toLowerCase() === "admin";
                
                if (isAdmin) {
                  // Admin users bypass onboarding requirements
                  userRole = "Admin"; // Normalize to "Admin"
                  console.log(`[MIDDLEWARE] Got Admin profile, bypassing onboarding check. Role: ${userRole}, profile:`, profile);
                } else {
                  // Non-admin users must have organization_id to be considered onboarded
                  const hasOrganization = profile.organization_id != null;
                  
                  if (hasOrganization) {
                    // User is fully onboarded with organization
                    userRole = profile.role || profile.Role;
                    console.log(`[MIDDLEWARE] Got profile with role: ${userRole}, organization_id: ${profile.organization_id}, onboarded: true`);
                  } else {
                    // User has profile but not onboarded (no organization)
                    userRole = undefined;
                    console.log(`[MIDDLEWARE] Profile exists but NOT onboarded (no organization_id), role: ${profile.role}, organization_id: ${profile.organization_id}`);
                  }
                }
                
                // Cache role and enrichment fields (best-effort)
                try {
                  setTokenEntry(accessToken, {
                    isValid: true,
                    userId,
                    role: userRole,
                    profileId: profile.id ?? undefined,
                    email: typeof profile.email !== 'undefined' ? profile.email : null,
                    username: typeof profile.username !== 'undefined' ? profile.username : null,
                    full_name:
                      typeof profile.full_name !== 'undefined'
                        ? profile.full_name
                        : (profile.firstname || profile.lastname) ? `${profile.firstname || ''} ${profile.lastname || ''}`.trim() : null,
                    expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
                  });
                } catch (e) {
                  // ignore cache write errors
                }
              } else {
                // Original endpoint returned non-404 error
                console.error("Profile fetch failed with status:", profileRes.status);
                profileFetchError = true;
              }
            } catch (err) {
              console.error("[MIDDLEWARE] Profile fetch request failed:", err);
              profileFetchError = true;
            }
          }
        }
      } catch (err) {
        console.error("[MIDDLEWARE] Profile/onboard request failed:", err);
        profileFetchError = true;
      }
    }
  }

  // Role-based route access restriction
  // Only allow users to access routes for their own role
  if (isAuthenticated && userRole) {
    const roleRouteMap = {
      Admin: "/admin",
      Faculty: "/faculty",
      Student: "/student",
    };
    const allowedPrefix = roleRouteMap[userRole as keyof typeof roleRouteMap];
    // If trying to access another role's route, redirect to their dashboard
    if (
      allowedPrefix &&
      ((pathname.startsWith("/admin") && userRole !== "Admin") ||
        (pathname.startsWith("/faculty") && userRole !== "Faculty") ||
        (pathname.startsWith("/student") && userRole !== "Student"))
    ) {
      // Exception: allow /profile/create for onboarding
      if (pathname === "/profile/create") {
        return NextResponse.next();
      }
      // Redirect to correct dashboard
      let redirectUrl = "/";
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
      }
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }


  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL(REDIRECT_URLS.LOGIN, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If profile fetch failed due to API error, show error page instead of redirecting
  if (isProtectedRoute(pathname) && isAuthenticated && profileFetchError) {
    // Create error response with details
    const errorUrl = new URL("/error/service-unavailable", request.url);
    errorUrl.searchParams.set("message", "Unable to connect to authentication service. Please try again later.");
    return NextResponse.redirect(errorUrl);
  }

  // Redirect authenticated users with missing/invalid role to /profile/create on any protected route,
  // but allow them to access /profile/create itself
  if (
    isProtectedRoute(pathname) &&
    isAuthenticated &&
    (!userRole || !["Admin", "Faculty", "Student"].includes(userRole)) &&
    pathname !== "/profile/create"
  ) {
    console.log(`[MIDDLEWARE] Protected route redirect: ${pathname} -> /profile/create (no role)`);
    return NextResponse.redirect(new URL("/profile/create", request.url));
  }

  // Redirect Admins away from profile/create to their dashboard
  if (pathname === "/profile/create" && isAuthenticated && userRole === "Admin") {
    console.log(`[MIDDLEWARE] Admin detected on /profile/create, redirecting to admin dashboard`);
    return NextResponse.redirect(new URL(REDIRECT_URLS.ADMIN_DASHBOARD, request.url));
  }

  // Redirect authenticated users from auth routes (including home) based on their role/profile status
  // Exception: /profile/create should be accessible for onboarding regardless of role
  if (isAuthRoute(pathname) && isAuthenticated && pathname !== "/profile/create") {
    console.log(`[MIDDLEWARE] Auth route check for ${pathname}: userRole=${userRole}, profileFetchError=${profileFetchError}`);
    
    // If profile fetch failed, don't redirect - let them stay on auth page with error
    if (profileFetchError) {
      console.log(`[MIDDLEWARE] Profile fetch error, allowing access to ${pathname}`);
      return NextResponse.next();
    }
    
    // If user hasn't completed onboarding (no role), redirect to profile/create
    if (!userRole || !["Admin", "Faculty", "Student"].includes(userRole)) {
      console.log(`[MIDDLEWARE] AUTH ROUTE REDIRECT: ${pathname} -> /profile/create (no valid role: ${userRole})`);
      return NextResponse.redirect(new URL("/profile/create", request.url));
    }
    
    // User has a valid role, redirect to their dashboard
    console.log(`[MIDDLEWARE] User has role ${userRole}, redirecting to dashboard`);
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
        // If role is missing, null, undefined (404), go to profile create
        redirectUrl = "/profile/create";
        break;
    }
    console.log(`[MIDDLEWARE] Redirecting ${pathname} -> ${redirectUrl}`);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Allow the request to proceed
  console.log(`[MIDDLEWARE] Final state for ${pathname}: isAuthenticated=${isAuthenticated}, userRole=${userRole}, allowing request to proceed`);
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

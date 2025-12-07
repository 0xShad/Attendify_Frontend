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
async function verifyTokenAndGetUser(accessToken: string): Promise<{ isValid: boolean; userId?: number }> {
  // Check cache first
  const cachedEntry = getTokenEntry(accessToken);
  if (cachedEntry) {
    return { isValid: cachedEntry.isValid, userId: cachedEntry.userId };
  }

  // Quick client-side expiration check
  if (isTokenExpired(accessToken)) {
    setTokenEntry(accessToken, {
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
      setTokenEntry(accessToken, {
        isValid: false,
        expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
        userId: undefined,
      });
      return { isValid: false };
    }
    const user = await response.json();
    const userId = user.id || user.user_id;
    setTokenEntry(accessToken, {
      isValid: true,
      userId,
      expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
    });
    return { isValid: true, userId };
  } catch (error) {
    console.error("Token verification failed:", error);
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
  let profileFetchError = false;

  if (accessToken) {
    const result = await verifyTokenAndGetUser(accessToken);
    isAuthenticated = result.isValid;
    userId = result.userId;
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
      try {
        // Check cache first for role/enrichment
        const cached = getTokenEntry(accessToken);
        if (cached && cached.role) {
          userRole = cached.role;
        } else {
          // Prefer fetching the canonical profile endpoint which returns full profile (200) or 404 if missing.
          const profileUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/profiles/${userId}`;
          const profileRes = await fetch(profileUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
          });

          if (profileRes.ok) {
            const profile = await profileRes.json();
            userRole = profile.role;

            // Cache role and enrichment fields (best-effort)
            try {
              setTokenEntry(accessToken, {
                isValid: true,
                userId,
                role: profile.role,
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
          } else if (profileRes.status === 404) {
            // No local profile — fallback to /profiles/onboarded to get reason and possibly attempt create
            const onboardUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/profiles/onboarded`;
            const onboardRes = await fetch(onboardUrl, {
              headers: { Authorization: `Bearer ${accessToken}` },
              signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
            });

            if (onboardRes.ok) {
              const onboardData = await onboardRes.json();
              if (onboardData && onboardData.onboarded) {
                // Cache enrichment fields provided by onboarded endpoint
                try {
                  setTokenEntry(accessToken, {
                    isValid: true,
                    userId,
                    profileId: onboardData.profile_id ?? undefined,
                    email: typeof onboardData.email !== 'undefined' ? onboardData.email : null,
                    username: typeof onboardData.username !== 'undefined' ? onboardData.username : null,
                    full_name: typeof onboardData.full_name !== 'undefined' ? onboardData.full_name : null,
                    expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
                  });
                } catch (e) {
                  // ignore cache write errors
                }

                // Try to fetch the full profile (best-effort) to obtain role
                try {
                  const profileRes2 = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/profiles/${userId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
                  });
                  if (profileRes2.ok) {
                    const profile = await profileRes2.json();
                    userRole = profile.role;
                    try {
                      setTokenEntry(accessToken, {
                        isValid: true,
                        userId,
                        role: profile.role,
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
                  } else if (profileRes2.status === 404) {
                    userRole = undefined;
                  } else {
                    console.error("Profile fetch failed with status:", profileRes2.status);
                    profileFetchError = true;
                  }
                } catch (e) {
                  console.error('Profile fetch failed after onboarded:', e);
                  profileFetchError = true;
                }
              } else {
                // Not onboarded — consider attempting creation (existing flow)
                const now = Date.now();
                const attemptTtl = Number(VALIDATION_CONFIG.ONBOARD_ATTEMPT_TTL_MS || 5 * 60 * 1000);
                const lastAttempt = userId ? (userOnboardAttempt.get(userId) || 0) : 0;
                if (now - lastAttempt < attemptTtl) {
                  // recently attempted; skip POST and treat as not onboarded
                } else {
                  if (userId) userOnboardAttempt.set(userId, now);
                  const createUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/profiles/onboard`;
                  try {
                    const createRes = await fetch(createUrl, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                      },
                      body: '{}',
                      signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
                    });

                    if (createRes.ok) {
                      const profile = await createRes.json();
                      const hasOrg = profile && profile.organization_id != null;
                      let qualifiesAsAdmin = false;
                      try {
                        if (profile && profile.role) {
                          const roleStr = String(profile.role).toLowerCase();
                          if (roleStr === "admin") {
                            const adminData = profile.admin_data;
                            if (adminData && adminData.admin_level != null && adminData.permissions && (Array.isArray(adminData.permissions) ? adminData.permissions.length > 0 : Boolean(adminData.permissions))) {
                              qualifiesAsAdmin = true;
                            }
                          }
                        }
                      } catch (e) {
                        // ignore and treat as not qualifying
                      }

                      if (hasOrg || qualifiesAsAdmin) {
                        userRole = profile.role;
                      } else {
                        userRole = undefined;
                      }
                    } else if (createRes.status === 401) {
                      isAuthenticated = false;
                    } else {
                      console.error('Profile creation failed with status:', createRes.status);
                      profileFetchError = true;
                    }
                  } catch (e) {
                    console.error('Profile creation request failed:', e);
                    profileFetchError = true;
                  }
                }
              }
            } else if (onboardRes.status === 401) {
              isAuthenticated = false;
            } else {
              console.error('Onboard check failed with status:', onboardRes.status);
              profileFetchError = true;
            }
          } else {
            console.error("Profile fetch failed with status:", profileRes.status);
            profileFetchError = true;
          }
        }
      } catch (err) {
        console.error("Profile/onboard request failed:", err);
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
    return NextResponse.redirect(new URL("/profile/create", request.url));
  }

  // Redirect authenticated users from auth routes to their dashboard by role
  if (isAuthRoute(pathname) && isAuthenticated) {
    // If profile fetch failed, don't redirect - let them stay on auth page with error
    if (profileFetchError) {
      return NextResponse.next();
    }
    
    // If user hasn't completed onboarding (no role), redirect to profile/create
    if (!userRole || !["Admin", "Faculty", "Student"].includes(userRole)) {
      return NextResponse.redirect(new URL("/profile/create", request.url));
    }
    
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

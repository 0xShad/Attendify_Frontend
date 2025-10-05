import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isProtectedRoute, isAuthRoute } from '@/lib/middleware/utils';
import { COOKIE_CONFIG, REDIRECT_URLS, VALIDATION_CONFIG } from '@/config/auth';

/**
 * In-memory cache for token validation results
 * Key: token, Value: { isValid: boolean, expiresAt: number }
 */
const tokenCache = new Map<string, { isValid: boolean; expiresAt: number }>();

/**
 * Decode JWT payload without verification (client-side check only)
 * Used to quickly check expiration before making backend call
 */
function decodeJWT(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('JWT decode failed:', error);
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
  return payload.exp < (now + VALIDATION_CONFIG.TOKEN_EXPIRY_BUFFER_SECONDS);
}

/**
 * Verify JWT token with backend
 * Calls /api/v1/users/me to validate token and get user data
 * Includes caching to reduce backend calls
 */
async function verifyToken(accessToken: string): Promise<boolean> {
  // Check cache first
  const cached = tokenCache.get(accessToken);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.isValid;
  }

  // Quick client-side expiration check
  if (isTokenExpired(accessToken)) {
    tokenCache.set(accessToken, { isValid: false, expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS });
    return false;
  }

  // Validate with backend
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
    });

    const isValid = response.ok;
    
    // Cache the result
    tokenCache.set(accessToken, {
      isValid,
      expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
    });

    // Clean up old cache entries (prevent memory leak)
    if (tokenCache.size > VALIDATION_CONFIG.CACHE_MAX_SIZE) {
      const now = Date.now();
      for (const [key, value] of tokenCache.entries()) {
        if (value.expiresAt < now) {
          tokenCache.delete(key);
        }
      }
    }

    return isValid;
  } catch (error) {
    console.error('Token verification failed:', error);
    
    // Cache failure for shorter duration to prevent retry storms
    tokenCache.set(accessToken, {
      isValid: false,
      expiresAt: Date.now() + VALIDATION_CONFIG.FAILURE_CACHE_TTL_MS,
    });
    
    return false;
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

  // Get authentication status from HTTP-only cookie
  const accessToken = request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN.name)?.value;
  
  // Verify token with backend if it exists (uses cache + client-side checks)
  let isAuthenticated = false;
  if (accessToken) {
    isAuthenticated = await verifyToken(accessToken);
  }

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL(REDIRECT_URLS.LOGIN, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute(pathname) && isAuthenticated) {
    const dashboardUrl = new URL(REDIRECT_URLS.DASHBOARD, request.url);
    return NextResponse.redirect(dashboardUrl);
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

/**
 * Middleware Utilities
 * Helper functions for route checking and authentication
 */

import { PROTECTED_ROUTES, PUBLIC_ROUTES, AUTH_ROUTES } from '@/config/routes';

/**
 * Check if a path is a protected route
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a path is a public route
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a path is an auth route
 */
export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a path should be excluded from middleware
 */
export function shouldExcludeFromMiddleware(pathname: string): boolean {
  const excludePatterns = [
    /^\/api\//,
    /^\/_next\//,
    /^\/favicon\.ico$/,
    /\.(svg|png|jpg|jpeg|gif|webp)$/,
  ];

  return excludePatterns.some((pattern) => pattern.test(pathname));
}

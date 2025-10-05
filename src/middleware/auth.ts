/**
 * Authentication Middleware
 * Utilities for protecting routes and checking authentication
 */

import { authAPI } from "@/lib/api/auth";

/**
 * Protected route paths that require authentication
 */
export const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/settings",
  "/attendance",
  "/events",
] as const;

/**
 * Public route paths that don't require authentication
 */
export const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
] as const;

/**
 * Routes that authenticated users shouldn't access (redirect to dashboard)
 */
export const AUTH_ROUTES = [
  "/auth/login",
  "/auth/signup",
] as const;

/**
 * Check if a path is protected
 */
export function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some((route) => path.startsWith(route));
}

/**
 * Check if a path is public
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => path === route || path.startsWith(route));
}

/**
 * Check if a path is an auth route
 */
export function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.some((route) => path === route || path.startsWith(route));
}

/**
 * Get redirect path based on authentication status and current path
 */
export function getRedirectPath(
  isAuthenticated: boolean,
  currentPath: string
): string | null {
  // Authenticated users trying to access auth pages -> redirect to dashboard
  if (isAuthenticated && isAuthRoute(currentPath)) {
    return "/dashboard";
  }

  // Unauthenticated users trying to access protected pages -> redirect to login
  if (!isAuthenticated && isProtectedRoute(currentPath)) {
    return `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
  }

  return null;
}

/**
 * Client-side route guard hook
 */
export function useRouteGuard() {
  if (typeof window === "undefined") return;

  const isAuthenticated = authAPI.isAuthenticated();
  const currentPath = window.location.pathname;
  const redirectPath = getRedirectPath(isAuthenticated, currentPath);

  if (redirectPath) {
    window.location.href = redirectPath;
  }
}

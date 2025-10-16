/**
 * Route Configuration
 * Centralized route definitions for authentication and protection
 */

/**
 * Protected routes that require authentication
 */
export const PROTECTED_ROUTES = [
  "/dashboard",
  "/admin/dashboard",
  "/admin/courses",
  "/admin/attendance",
  "/faculty/dashboard",
  "/faculty/classes",
  "/faculty/attendance",
  "/faculty/reports",
  "/faculty/announcements",
  "/profile",
  "/settings",
  "/attendance",
  "/events",
] as const;

/**
 * Public routes accessible without authentication
 */
export const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
] as const;

/**
 * Auth routes that authenticated users shouldn't access
 * These will redirect to dashboard if user is already logged in
 */
export const AUTH_ROUTES = ["/auth/login", "/auth/signup"] as const;

/**
 * API routes (excluded from middleware)
 */
export const API_ROUTES = ["/api"] as const;

/**
 * Type exports for route arrays
 */
export type ProtectedRoute = (typeof PROTECTED_ROUTES)[number];
export type PublicRoute = (typeof PUBLIC_ROUTES)[number];
export type AuthRoute = (typeof AUTH_ROUTES)[number];

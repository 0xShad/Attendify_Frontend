/**
 * Authentication Configuration
 * Centralized auth-related constants and settings
 */

/**
 * Cookie configuration
 */
export const COOKIE_CONFIG = {
  ACCESS_TOKEN: {
    name: "access_token",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  REFRESH_TOKEN: {
    name: "refresh_token",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
} as const;

/**
 * Middleware validation cache configuration
 */
export const VALIDATION_CONFIG = {
  CACHE_TTL_MS: 60 * 1000, // 1 minute cache for token validation
  CACHE_MAX_SIZE: 1000, // Maximum number of cached tokens
  FAILURE_CACHE_TTL_MS: 10 * 1000, // 10 seconds cache for failed validations
  REQUEST_TIMEOUT_MS: 5000, // 5 second timeout for backend calls
  TOKEN_EXPIRY_BUFFER_SECONDS: 30, // Refresh tokens 30 seconds before expiry
} as const;

/**
 * Cookie options for different environments
 */
export const getCookieOptions = (isProduction: boolean) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
});

/**
 * Redirect URLs
 */
export const REDIRECT_URLS = {
  LOGIN: "/auth/login",
  DASHBOARD: "/dashboard",
  ADMIN_DASHBOARD: "/admin/dashboard",
  FACULTY_DASHBOARD: "/faculty/dashboard",
} as const;

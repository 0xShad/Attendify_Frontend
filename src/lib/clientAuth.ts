// Lightweight client-side auth checker with a short in-memory cache.
// Used by UI components to avoid calling the backend on every interaction.

const CACHE_TTL_MS = 30_000; // 30 seconds

let cache: { isLoggedIn: boolean; expiresAt: number } | null = null;

export async function checkAuth(force = false): Promise<boolean> {
  if (!force && cache && cache.expiresAt > Date.now()) {
    return cache.isLoggedIn;
  }

  try {
    // Use the Next.js proxy endpoint for current user profiles when checking auth.
    // Previously this used /api/v1/users/me (backend) which results in 404 when
    // the proxy routes are used. Use /api/profiles/mine which proxies to the
    // backend /profiles/mine endpoint and respects server-side cookies.
    const res = await fetch('/api/profiles/mine', { credentials: 'include' });
    const ok = res.ok;
    cache = { isLoggedIn: ok, expiresAt: Date.now() + CACHE_TTL_MS };
    return ok;
  } catch (e) {
    // on network error, treat as not authenticated but cache briefly to avoid spamming
    cache = { isLoggedIn: false, expiresAt: Date.now() + 5000 };
    return false;
  }
}

export function clearAuthCache() {
  cache = null;
}

export function getCachedAuth() {
  if (cache && cache.expiresAt > Date.now()) return cache.isLoggedIn;
  return null;
}

// Lightweight client-side auth checker with a short in-memory cache.
// Used by UI components to avoid calling the backend on every interaction.

const CACHE_TTL_MS = 30_000; // 30 seconds

let cache: { isLoggedIn: boolean; expiresAt: number } | null = null;

export async function checkAuth(force = false): Promise<boolean> {
  if (!force && cache && cache.expiresAt > Date.now()) {
    return cache.isLoggedIn;
  }

  try {
    const res = await fetch('/api/v1/users/me', { credentials: 'include' });
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

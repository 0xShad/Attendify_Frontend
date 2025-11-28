export type TokenCacheEntry = {
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

const tokenCache = new Map<string, TokenCacheEntry>();

export function getTokenEntry(token: string): TokenCacheEntry | undefined {
  const e = tokenCache.get(token);
  if (!e) return undefined;
  if (e.expiresAt <= Date.now()) {
    tokenCache.delete(token);
    return undefined;
  }
  return e;
}

export function setTokenEntry(token: string, entry: TokenCacheEntry) {
  tokenCache.set(token, entry);
}

export function deleteTokenEntry(token: string) {
  tokenCache.delete(token);
}

export function clearTokenCache() {
  tokenCache.clear();
}

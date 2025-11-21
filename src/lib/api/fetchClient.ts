/**
 * Lightweight fetch helper used by API modules.
 * - sends `credentials: 'include'` by default so HTTP-only cookies are forwarded
 * - includes a best-effort Bearer token from localStorage when present
 * - returns a simple wrapper around `fetch` that throws on non-OK responses
 */

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const finalInit: RequestInit = { ...init };

  // Ensure credentials are included by default (cookies)
  if (!finalInit.credentials) finalInit.credentials = 'include';

  // Normalize headers. Respect caller-provided headers and avoid forcing
  // `Content-Type` for multipart/form-data or other non-JSON bodies.
  const providedHeaders = (finalInit.headers || {}) as Record<string, string>;
  const headers: Record<string, string> = { ...providedHeaders } as Record<string, string>;

  const hasContentType = Object.keys(headers).some(k => k.toLowerCase() === 'content-type');
  const body = finalInit.body as any;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;
  const isURLSearchParams = typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;

  if (!hasContentType && !isFormData && !isBlob && !isURLSearchParams) {
    headers['Content-Type'] = 'application/json';
  }

  // Best-effort: include any locally stored token under common keys
  try {
    if (typeof window !== 'undefined') {
      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('authToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore localStorage errors
  }

  finalInit.headers = headers;

  const res = await fetch(input, finalInit);

  // Provide a raw fetch variant for callers that need to inspect status or headers.
  // If caller used `fetchRawWithAuth`, they will get the Response object.

  // If the caller expects parsed JSON, return it for convenience (unless 204).
  if (res.status === 204) return res;

  const text = await res.text().catch(() => '');
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    // not JSON
  }

  if (!res.ok) {
    const message = (json && (json.message || json.detail)) || text || res.statusText || `HTTP ${res.status}`;
    const err: any = new Error(String(message));
    err.status = res.status;
    err.body = json ?? text;
    throw err;
  }

  return json;
}

export default fetchWithAuth;

/**
 * Same as `fetchWithAuth` but returns the raw `Response` object so callers
 * can inspect `res.ok`, `res.status`, `res.headers`, or call `res.json()` themselves.
 */
export async function fetchRawWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const finalInit: RequestInit = { ...init };
  if (!finalInit.credentials) finalInit.credentials = 'include';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(finalInit.headers || {} as Record<string, string>),
  } as Record<string, string>;

  try {
    if (typeof window !== 'undefined') {
      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('authToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {}

  finalInit.headers = headers;
  const res = await fetch(input, finalInit);
  return res;
}

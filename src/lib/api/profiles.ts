/**
 * Profiles API Client
 * Read-only endpoints for user profiles (enriched by the backend).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";

const PROFILES_ENDPOINTS = {
  DETAIL: (userId: number) => `${API_BASE_URL}/profiles/${userId}`,
  SEARCH: `${API_BASE_URL}/profiles/search`,
  ROLES: `${API_BASE_URL}/options/profiles/roles`,
  ORGANIZATIONS: `${API_BASE_URL}/organizations/options/organizations`,
  ADMIN_CREATE: `${API_BASE_URL}/admin/users`,
  LIST: `${API_BASE_URL}/profiles`,
} as const;

export interface Profile {
  id: number;
  user_id: number;
  bio: string | null;
  avatar_url: string | null;
  face_image: string | null;
  role: string | null;
  organization_id: number | null;
  // Optional organization info returned by newer responses
  organization_data?: {
    id?: number | null;
    name?: string | null;
    type?: string | null;
  } | null;
  last_active: string | null;
  email: string | null;
  username: string | null;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_email_verified: boolean | null;
  // Optional nested data sections
  academic_data?: {
    program_id?: number | null;
    student_id?: string | null;
    year_level?: number | null;
    enrollment_date?: string | null;
  } | null;
  business_data?: {
    department?: string | null;
    position?: string | null;
    employee_id?: string | null;
    hire_date?: string | null;
  } | null;
  admin_data?: {
    admin_level?: string | null;
    permissions?: string | null;
    assigned_date?: string | null;
  } | null;
}

export interface ListProfilesParams {
  role?: string;
  organization_id?: number;
  organization?: string;
  type?: string;
  created_from?: string;
  created_to?: string;
  last_active_from?: string;
  last_active_to?: string;
  has_avatar?: boolean;
  has_face_image?: boolean;
  skip?: number;
  limit?: number; // default 50, max 200
}

export interface SearchProfilesParams {
  // `q` is the canonical query param name used by the backend. Keep `query`
  // for backward compatibility with callers that still use that key.
  q?: string;
  query?: string;
  skip?: number;
  limit?: number; // default 50, max 200
}

export async function getProfile(userId: number): Promise<Profile> {
  const url = PROFILES_ENDPOINTS.DETAIL(userId);
  const data = await fetchWithDedupe(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  return data as Profile;
}

export async function searchProfiles(params: SearchProfilesParams = {}, token?: string): Promise<Profile[]> {
  const { skip = 0, limit = 50 } = params;
  // Accept either `q` (preferred) or `query` (legacy callers)
  const q = (params as any).q ?? (params as any).query;
  // Build query string
  const searchParams = new URLSearchParams();
  if (q) searchParams.append('q', String(q));
  searchParams.append('skip', String(skip));
  searchParams.append('limit', String(limit));

  // If we're in the browser and no explicit token was provided, prefer the
  // same-origin proxy route so the server-side code can read the HTTP-only
  // cookie and attach an Authorization header when forwarding to the backend.
  let requestUrl: string;
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser && !token) {
    requestUrl = `/api/profiles/search?${searchParams.toString()}`;
  } else {
    const url = new URL(PROFILES_ENDPOINTS.SEARCH);
    url.search = searchParams.toString();
    requestUrl = url.toString();
  }

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug(`[profilesAPI] searchProfiles -> ${requestUrl} (token? ${Boolean(token)})`);
  }

  // When calling the same-origin proxy, include credentials so the cookie is
  // sent to our Next.js route which will forward the Authorization header.
  const init: RequestInit = { method: 'GET', headers };
  if (isBrowser && !token) init.credentials = 'include';

  const data = await fetchWithDedupe(requestUrl, init);
  return data as Profile[];
}

export interface ListRolesParams {
  organization_id?: number;
  organization_type?: string;
}

export async function listRoles(params: ListRolesParams = {}): Promise<string[]> {
  const url = new URL(PROFILES_ENDPOINTS.ROLES);
  if (params.organization_id !== undefined) url.searchParams.append('organization_id', String(params.organization_id));
  if (params.organization_type) url.searchParams.append('organization_type', params.organization_type);
  const data = await fetchWithDedupe(url.toString(), { method: 'GET' });
  return data as string[];
}

// Fetch program codes for an organization. Backend returns either an array of strings or
// an array of objects; normalize in callers.
export async function listProgramCodesByOrganization(organizationId: number) {
  // Programs endpoints live under the /programs router (e.g. /api/v1/programs/options/codes/organization/{id})
  const url = `${API_BASE_URL}/programs/options/codes/organization/${organizationId}`;
  const data = await fetchWithDedupe(url, { method: 'GET' });
  return data;
}

export interface OrganizationOption {
  id: number;
  name: string;
  type?: string | null;
}

export async function listOrganizations(): Promise<OrganizationOption[]> {
  const url = PROFILES_ENDPOINTS.ORGANIZATIONS;
  const data = await fetchWithDedupe(url.toString(), { method: 'GET' });
  return data as OrganizationOption[];
}

export async function listProfiles(params: ListProfilesParams = {}): Promise<Profile[]> {
  const {
    role,
    organization_id,
    has_avatar,
    has_face_image,
    skip = 0,
    limit = 50,
  } = params;

  const url = new URL(PROFILES_ENDPOINTS.LIST);
  if (role) url.searchParams.append('role', role);
  if (params.organization) url.searchParams.append('organization', params.organization);
  if (params.type) url.searchParams.append('type', params.type);
  if (params.created_from) url.searchParams.append('created_from', params.created_from);
  if (params.created_to) url.searchParams.append('created_to', params.created_to);
  if (params.last_active_from) url.searchParams.append('last_active_from', params.last_active_from);
  if (params.last_active_to) url.searchParams.append('last_active_to', params.last_active_to);
  if (organization_id !== undefined) url.searchParams.append('organization_id', String(organization_id));
  if (has_avatar !== undefined) url.searchParams.append('has_avatar', String(has_avatar));
  if (has_face_image !== undefined) url.searchParams.append('has_face_image', String(has_face_image));
  url.searchParams.append('skip', String(skip));
  url.searchParams.append('limit', String(limit));

  // Use deduping fetch helper so simultaneous calls for the same URL
  // reuse the in-flight promise.
  const data = await fetchWithDedupe(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return data as Profile[];
}

// Simple in-memory deduper for identical in-flight requests.
// Keeps a map of url -> Promise so concurrent callers share the same network request.
// We intentionally do not cache responses long-term here; entries are removed after
// the promise settles. This prevents duplicate requests during React Strict Mode
// double-mounts or other legitimate concurrent callers.
const inFlightRequests = new Map<string, Promise<any>>();

async function fetchWithDedupe(url: string, init?: RequestInit) {
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)!;
  }

  // Ensure we don't send a Content-Type for GET requests. Some backends
  // validate request bodies differently when this header is present.
  const safeInit: RequestInit | undefined = init
    ? {
        ...init,
        headers: {
          ...(init.headers as Record<string, string> | undefined),
        },
      }
    : undefined;

  try {
    if (safeInit && (safeInit.method || 'GET').toUpperCase() === 'GET') {
      // Remove Content-Type for GET
      if (safeInit.headers && 'Content-Type' in safeInit.headers) {
        // @ts-ignore - headers is a plain object here
        delete (safeInit.headers as Record<string, string>)['Content-Type'];
      }
    }
  } catch (e) {
    // ignore header manipulation errors
  }

  const p = fetch(url, safeInit).then(async (response) => {
    if (!response.ok) {
      // Try to parse JSON error body for richer diagnostics
      const text = await response.text().catch(() => '');
      let parsed: any = {};
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch (e) {
        parsed = { detail: text };
      }
      const message = parsed?.detail || parsed?.message || response.statusText || `HTTP ${response.status}`;
      // Attach details for easier debugging in dev
      const err = new Error(message) as any;
      err.status = response.status;
      err.body = parsed;
      throw err;
    }
    return response.json();
  }).finally(() => {
    inFlightRequests.delete(url);
  });
  inFlightRequests.set(url, p);
  return p;
}

export const profilesAPI = {
  getProfile,
  searchProfiles,
  listRoles,
  listOrganizations,
  listProfiles,
};

// (we will attach createAdminUser and program fetcher after the function declaration below)

// Create an admin user (multipart/form-data). Accepts FormData and optional token.
export async function createAdminUser(formData: FormData, token?: string) {
  // If a token is provided, call backend directly with Authorization header.
  if (token) {
    const url = PROFILES_ENDPOINTS.ADMIN_CREATE;
    const headers: Record<string, string> = {};
    headers['Authorization'] = `Bearer ${token}`;

    const resp = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: headers,
      credentials: 'include',
    });

    let parsed: any = {};
    try { parsed = await resp.json(); } catch (e) { parsed = { detail: resp.statusText }; }
    if (!resp.ok) {
      const message = parsed?.detail || parsed?.message || resp.statusText || `HTTP ${resp.status}`;
      const err: any = new Error(message);
      err.status = resp.status;
      err.body = parsed;
      throw err;
    }
    return parsed;
  }

  // No token: if running in browser, POST to the local proxy route which will set
  // Authorization using the HTTP-only cookie (server-side) and forward the request.
  if (typeof window !== 'undefined') {
    const proxyUrl = '/api/admin/users';
    const resp = await fetch(proxyUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    let parsed: any = {};
    try { parsed = await resp.json(); } catch (e) { parsed = { detail: resp.statusText }; }
    if (!resp.ok) {
      const message = parsed?.detail || parsed?.message || resp.statusText || `HTTP ${resp.status}`;
      const err: any = new Error(message);
      err.status = resp.status;
      err.body = parsed;
      throw err;
    }
    return parsed;
  }
}

// attach createAdminUser and program fetcher and export the API object
Object.assign(profilesAPI, { createAdminUser, listProgramCodesByOrganization });
export default profilesAPI;



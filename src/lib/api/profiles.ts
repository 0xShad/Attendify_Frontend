/**
 * Profiles API Client
 * Read-only endpoints for user profiles (enriched by the backend).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";

const PROFILES_ENDPOINTS = {
  DETAIL: (userId: number) => `${API_BASE_URL}/profiles/${userId}`,
  SEARCH: `${API_BASE_URL}/profiles/search`,
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
  last_active: string | null;
  email: string | null;
  username: string | null;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_email_verified: boolean | null;
}

export interface ListProfilesParams {
  role?: string;
  organization_id?: number;
  has_avatar?: boolean;
  has_face_image?: boolean;
  skip?: number;
  limit?: number; // default 50, max 200
}

export interface SearchProfilesParams {
  query?: string;
  skip?: number;
  limit?: number; // default 50, max 200
}

export async function getProfile(userId: number): Promise<Profile> {
  const url = PROFILES_ENDPOINTS.DETAIL(userId);
  const data = await fetchWithDedupe(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  return data as Profile;
}

export async function searchProfiles(params: SearchProfilesParams = {}): Promise<Profile[]> {
  const { query, skip = 0, limit = 50 } = params;
  const url = new URL(PROFILES_ENDPOINTS.SEARCH);
  if (query) url.searchParams.append('query', query);
  url.searchParams.append('skip', String(skip));
  url.searchParams.append('limit', String(limit));

  const data = await fetchWithDedupe(url.toString(), { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  return data as Profile[];
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
  const p = fetch(url, init).then(async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = (errorData as any).detail || response.statusText;
      throw new Error(message);
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
  listProfiles,
};



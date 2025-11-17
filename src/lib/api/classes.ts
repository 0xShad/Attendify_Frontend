/**
 * Classes API client
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";

const CLASSES_ENDPOINTS = {
  LIST: `${API_BASE_URL}/classes/`,
  DETAIL: (id: string) => `${API_BASE_URL}/classes/${id}`,
} as const;

export interface ListClassesParams {
  skip?: number;
  limit?: number;
  course_id?: number;
  assigned_faculty_id?: number;
  academic_year?: string;
  semester?: string;
  class_code?: string;
  organization_id?: number;
  program_id?: number;
  room?: string;
}

export async function listClasses(params: ListClassesParams = {}): Promise<any[]> {
  const { skip = 0, limit = 100 } = params;
  const url = new URL(CLASSES_ENDPOINTS.LIST);
  url.searchParams.append('skip', String(skip));
  url.searchParams.append('limit', String(limit));
  if (params.course_id !== undefined && params.course_id !== null) url.searchParams.append('course_id', String(params.course_id));
  if (params.assigned_faculty_id !== undefined && params.assigned_faculty_id !== null) url.searchParams.append('assigned_faculty_id', String(params.assigned_faculty_id));
  if (params.academic_year) url.searchParams.append('academic_year', String(params.academic_year));
  if (params.semester) url.searchParams.append('semester', String(params.semester));
  if (params.class_code) url.searchParams.append('class_code', String(params.class_code));
  if (params.organization_id !== undefined && params.organization_id !== null) url.searchParams.append('organization_id', String(params.organization_id));
  if (params.program_id !== undefined && params.program_id !== null) url.searchParams.append('program_id', String(params.program_id));
  if (params.room) url.searchParams.append('room', String(params.room));

  // Debug: log the final URL so network issues / CORS problems are easier to diagnose in the browser
  // Note: kept as console.debug so it won't spam production logs unless the devtools are open.
  try {
    console.debug("Fetching classes list:", url.toString());
    const res = await import("./fetchClient").then(m => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || res.statusText || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    // Network-level errors like CORS or connection failures surface as a TypeError "Failed to fetch".
    // Re-throw with additional context to help debugging.
    const msg = err?.message ? String(err.message) : String(err);
    throw new Error(`Failed to fetch classes list (${url.toString()}): ${msg}`);
  }
}

/**
 * List classes for a specific faculty profile id.
 * Calls: GET /classes/faculty/{faculty_id}
 */
export async function listClassesForFaculty(
  facultyId: number,
  params: Partial<ListClassesParams> = {}
): Promise<any[]> {
  const url = new URL(`${API_BASE_URL}/classes/faculty/${facultyId}`);
  const { skip = 0, limit = 100 } = params as any;
  url.searchParams.append('skip', String(skip));
  url.searchParams.append('limit', String(limit));
  if (params.course_id !== undefined && params.course_id !== null) url.searchParams.append('course_id', String(params.course_id));
  if (params.academic_year) url.searchParams.append('academic_year', String(params.academic_year));
  if (params.semester) url.searchParams.append('semester', String(params.semester));
  if (params.organization_id !== undefined && params.organization_id !== null) url.searchParams.append('organization_id', String(params.organization_id));
  if (params.program_id !== undefined && params.program_id !== null) url.searchParams.append('program_id', String(params.program_id));

  try {
    console.debug("Fetching classes for faculty:", url.toString());
    const res = await import("./fetchClient").then((m) => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || res.statusText || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : String(err);
    throw new Error(`Failed to fetch classes for faculty ${facultyId}: ${msg}`);
  }
}

/**
 * List classes assigned to the current authenticated faculty (caller).
 * Calls GET /classes/mine via same-origin proxy so HTTP-only cookies work.
 */
export async function listMyClasses(params: Partial<ListClassesParams> = {}): Promise<any[]> {
  const url = new URL(`/api/classes/mine`, window.location.origin);
  const { skip = 0, limit = 100 } = params as any;
  url.searchParams.append('skip', String(skip));
  url.searchParams.append('limit', String(limit));
  if (params.academic_year) url.searchParams.append('academic_year', String(params.academic_year));
  if (params.semester) url.searchParams.append('semester', String(params.semester));
  if ((params as any).class_code) url.searchParams.append('class_code', String((params as any).class_code));
  if (params.organization_id !== undefined && params.organization_id !== null) url.searchParams.append('organization_id', String(params.organization_id));
  if (params.program_id !== undefined && params.program_id !== null) url.searchParams.append('program_id', String(params.program_id));
  if (params.course_id !== undefined && params.course_id !== null) url.searchParams.append('course_id', String(params.course_id));

  try {
    console.debug('Fetching my classes:', url.toString());
    const res = await import('./fetchClient').then(m => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText || `HTTP ${res.status}`);
      throw new Error(String(err));
    }
    return res.json();
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : String(err);
    throw new Error(`Failed to fetch my classes: ${msg}`);
  }
}

export async function getClass(id: number): Promise<any> {
  const res = await import("./fetchClient").then(m => m.fetchRawWithAuth(CLASSES_ENDPOINTS.DETAIL(String(id)), { method: 'GET' }));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

/**
 * Fetch a single class belonging to the currently authenticated faculty user.
 * Calls the same-origin proxy at `/api/classes/mine/{id}` so HTTP-only cookies
 * and Authorization headers are forwarded by the Next.js server.
 */
export async function getMyClass(id: number): Promise<any> {
  const url = `/api/classes/mine/${id}`;
  try {
    const res = await import('./fetchClient').then(m => m.fetchRawWithAuth(url, { method: 'GET' }));
    if (res.status === 404) {
      const body = await res.text().catch(() => 'Not found');
      throw new Error(`NotFound: ${body}`);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText || `HTTP ${res.status}`);
      throw new Error(String(body));
    }
    return res.json();
  } catch (err: any) {
    throw err;
  }
}

export async function createClass(payload: Record<string, any>): Promise<any> {
  const res = await import("./fetchClient").then(m => m.fetchRawWithAuth(CLASSES_ENDPOINTS.LIST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

/**
 * Create a class assigned to the current authenticated faculty user.
 * Calls POST /classes/mine with the minimal ClassCreate payload.
 */
export async function createMyClass(payload: {
  course_id?: number;
  new_course?: {
    code: string;
    name: string;
    description?: string | null;
    program_id?: number | null;
  };
  description?: string | null;
  room?: string | null;
  academic_year?: string | null;
  semester?: string | null;
}): Promise<any> {
  // Use same-origin proxy so HTTP-only cookies are forwarded by the server
  // and the backend receives a valid Authorization header.
  const url = `/api/classes/mine`;
  try {
    const res = await import("./fetchClient").then(m => m.fetchRawWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }));
    // Expect 201 Created on success per API contract
    if (res.status === 201) {
      return res.json();
    }

    // Map common error statuses to clearer messages
    let body: any = null;
    try {
      body = await res.json().catch(() => null);
    } catch (e) {
      body = null;
    }

    if (res.status === 401) {
      throw new Error('Unauthorized');
    }
    if (res.status === 400) {
      // Provide Pydantic validation details or a helpful fallback message
      let msg = 'Bad Request';
      if (body) {
        const candidate = body.detail ?? body.message ?? body;
        msg = typeof candidate === 'string' ? candidate : JSON.stringify(candidate);
      }
      throw new Error(msg);
    }
    if (res.status === 403) {
      throw new Error('Forbidden');
    }
    if (res.status >= 500) {
      throw new Error('Internal Server Error');
    }

    // Fallback for other non-OK responses
    let fallback = res.statusText || `HTTP ${res.status}`;
    if (body) {
      const candidate = body.detail ?? body.message ?? body;
      fallback = typeof candidate === 'string' ? candidate : JSON.stringify(candidate);
    }
    throw new Error(fallback || `HTTP ${res.status}`);
  } catch (err: any) {
    let msg: string;
    if (err instanceof Error) {
      // If the Error message contains an object-like string, try to make it clearer
      msg = err.message && err.message !== '[object Object]' ? err.message : JSON.stringify(err as any);
    } else if (typeof err === 'object') {
      try {
        msg = JSON.stringify(err);
      } catch (e) {
        msg = String(err);
      }
    } else {
      msg = String(err);
    }
    throw new Error(`Failed to create class via /classes/mine: ${msg}`);
  }
}

export async function updateClass(id: number, payload: Record<string, any>): Promise<any> {
  const res = await import("./fetchClient").then(m => m.fetchRawWithAuth(CLASSES_ENDPOINTS.DETAIL(String(id)), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export async function deleteClass(id: number): Promise<any> {
  const res = await import("./fetchClient").then(m => m.fetchRawWithAuth(CLASSES_ENDPOINTS.DETAIL(String(id)), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  }));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText);
  }
  // some APIs return an empty body; try to parse JSON but fall back to null
  return res.status === 204 ? null : res.json().catch(() => null);
}

export async function listEnrolleesForClass(classId: number): Promise<any[]> {
  const url = `${API_BASE_URL}/classes/${classId}/enrollees`;
  try {
    const res = await import("./fetchClient").then(m => m.fetchRawWithAuth(url, { method: 'GET' }));
    if (res.status === 404) {
      const body = await res.text().catch(() => '');
      throw new Error(`NotFound: ${body || 'Class not found'}`);
    }
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText || `HTTP ${res.status}`);
      throw new Error(String(err));
    }
    const data = await res.json();
    // Normalize returned enrollee objects to the expected frontend schema:
    // { id, profile_id, user_id, full_name, avatar_url, enrollment_date }
    if (Array.isArray(data)) {
      return data.map((item: any) => {
        const avatar = item?.avatar_url ?? item?.avatar ?? item?.avatarUrl ?? item?.profile?.avatar_url ?? item?.profile?.avatar ?? item?.profile_avatar ?? null;
        const id = typeof item?.id === 'number' ? item.id : (item?.id ? Number(item.id) : null);
        const profile_id = (item?.profile_id ?? item?.profile?.id ?? item?.profile_id) ?? null;
        const user_id = (item?.user_id ?? item?.user_id) ?? null;
        const full_name = item?.full_name ?? item?.fullName ?? item?.profile?.full_name ?? item?.profile?.name ?? null;
        const enrollment_date = item?.enrollment_date ?? item?.enrolled_at ?? item?.enrollmentDate ?? null;
        return {
          id: id === null ? null : Number(id),
          profile_id: profile_id === undefined || profile_id === null ? null : Number(profile_id),
          user_id: user_id === undefined ? null : (user_id === null ? null : Number(user_id)),
          full_name: full_name ?? null,
          avatar_url: avatar ?? null,
          enrollment_date: enrollment_date ?? null,
        } as any;
      });
    }
    return data as any[];
  } catch (err: any) {
    throw err;
  }
}

// List students that can be added to the class (candidates)
export async function listAvailableStudentsForClass(
  classId: number,
  q?: string | null,
  skip: number = 0,
  limit: number = 100
): Promise<any[]> {
  // Fetch the class to determine its organization, then list students for that organization.
  try {
    const cls = await getClass(classId).catch(() => null);
    const orgId = cls?.organization_id ?? cls?.organization?.id ?? null;
    if (!orgId) {
      // If we can't determine organization, return empty list instead of throwing so UI can handle gracefully
      return [];
    }

    const url = new URL(`${API_BASE_URL}/organizations/${orgId}/students`);
    url.searchParams.append('skip', String(skip));
    url.searchParams.append('limit', String(limit));
    if (q) url.searchParams.append('q', String(q));

    const res = await import("./fetchClient").then(m => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));
    if (res.status === 404) {
      // organization not found or endpoint not present — return empty list
      return [];
    }
    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText || `HTTP ${res.status}`);
      throw new Error(String(body));
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    throw err;
  }
}

// Add an enrollee (associate a profile/user to the class)
export async function addEnrolleeToClass(
  classId: number,
  payload: { profile_id?: number | null; user_id?: number | null } | Array<{ profile_id?: number | null; user_id?: number | null }>
): Promise<any> {
  // The backend now accepts either a single enrollee object or a list of them
  const url = `${API_BASE_URL}/classes/${classId}/enrollees`;
  try {
    const res = await import("./fetchClient").then(m => m.fetchRawWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }));
    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText || `HTTP ${res.status}`);
      throw new Error(String(body));
    }
    return res.json();
  } catch (err: any) {
    throw err;
  }
}

// Delete an enrollee from a class by enrollee record id
export async function deleteEnrolleeFromClass(classId: number, enrolleeId: number): Promise<null> {
  const url = `${API_BASE_URL}/classes/${classId}/enrollees/${enrolleeId}`;
  try {
    const res = await import("./fetchClient").then(m => m.fetchRawWithAuth(url, {
      method: 'DELETE',
    }));
    if (res.status === 404) {
      const body = await res.text().catch(() => 'Not Found');
      throw new Error(String(body));
    }
    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText || `HTTP ${res.status}`);
      throw new Error(String(body));
    }
    // server returns 204 on success
    return null;
  } catch (err: any) {
    throw err;
  }
}
export const classesAPI = {
  listClasses,
  listClassesForFaculty,
  listMyClasses,
  getClass,
  getMyClass,
  createClass,
  createMyClass,
  updateClass,
  deleteClass,
  listEnrolleesForClass,
  listAvailableStudentsForClass,
  addEnrolleeToClass,
  deleteEnrolleeFromClass,
};

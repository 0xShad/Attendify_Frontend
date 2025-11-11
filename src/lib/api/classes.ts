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
    const res = await fetch(url.toString(), { method: 'GET', headers: { 'Content-Type': 'application/json' } });
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

export async function getClass(id: number): Promise<any> {
  const res = await fetch(CLASSES_ENDPOINTS.DETAIL(String(id)), { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export async function createClass(payload: Record<string, any>): Promise<any> {
  const res = await fetch(CLASSES_ENDPOINTS.LIST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export async function updateClass(id: number, payload: Record<string, any>): Promise<any> {
  const res = await fetch(CLASSES_ENDPOINTS.DETAIL(String(id)), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export async function deleteClass(id: number): Promise<any> {
  const res = await fetch(CLASSES_ENDPOINTS.DETAIL(String(id)), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText);
  }
  // some APIs return an empty body; try to parse JSON but fall back to null
  return res.status === 204 ? null : res.json().catch(() => null);
}

export const classesAPI = {
  listClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
};

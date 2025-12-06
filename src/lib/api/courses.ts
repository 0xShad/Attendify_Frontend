/**
 * Courses API Client
 * Basic wrapper for course CRUD operations used by the frontend.
 */

const getApiBaseUrl = () => {
  if (typeof window !== "undefined" && (window as any).__ENV__?.NEXT_PUBLIC_BACKEND_API_URL) {
    return (window as any).__ENV__.NEXT_PUBLIC_BACKEND_API_URL;
  }
  return process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";
};

const COURSES_ENDPOINTS = {
  LIST: () => `${getApiBaseUrl()}/courses/`,
  SEARCH: () => `${getApiBaseUrl()}/courses/search`,
  DETAIL: (id: string) => `${getApiBaseUrl()}/courses/${id}`,
  CREATE: () => `${getApiBaseUrl()}/courses/`,
  UPDATE: (id: string) => `${getApiBaseUrl()}/courses/${id}`,
  DELETE: (id: string) => `${getApiBaseUrl()}/courses/${id}`,
  OPTIONS: () => `${getApiBaseUrl()}/courses/options`,
} as const;

export interface CreateCoursePayload {
  code: string;
  name: string;
  program_id?: number | null;
  units?: number;
  hours?: number;
  semester?: string;
  yearLevel?: string;
  status?: string;
  description?: string;
  prerequisites?: string[];
}

export interface ListCoursesParams {
  skip?: number;
  limit?: number;
  code?: string;
  name?: string;
  query?: string | null;
  min_classes?: number | null;
  max_classes?: number | null;
  program_id?: number;
  organization_id?: number;
}

export async function listCourses(params: ListCoursesParams = {}): Promise<any[]> {
  const { skip = 0, limit = 100, code, name, program_id } = params;
  const url = new URL(COURSES_ENDPOINTS.LIST());
  url.searchParams.append('skip', String(skip));
  url.searchParams.append('limit', String(limit));
  if (code) url.searchParams.append('code', code);
  if (name) url.searchParams.append('name', name);
  if (params.query && String(params.query).trim()) url.searchParams.append('query', String(params.query).trim());
  if (params.min_classes !== undefined && params.min_classes !== null) url.searchParams.append('min_classes', String(params.min_classes));
  if (params.max_classes !== undefined && params.max_classes !== null) url.searchParams.append('max_classes', String(params.max_classes));
  if (program_id !== undefined && program_id !== null) url.searchParams.append('program_id', String(program_id));
  if (params.organization_id !== undefined && params.organization_id !== null) url.searchParams.append('organization_id', String(params.organization_id));

  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || response.statusText);
  }
  return response.json();
}

export interface SearchCoursesParams {
  query?: string | null;
  skip?: number;
  limit?: number;
}

export async function searchCourses(params: SearchCoursesParams = {}): Promise<any[]> {
  const { query = null, skip = 0, limit = 100 } = params;
  const url = new URL(COURSES_ENDPOINTS.SEARCH());
  url.searchParams.append('skip', String(skip));
  url.searchParams.append('limit', String(limit));
  if (query && String(query).trim()) url.searchParams.append('query', String(query).trim());

  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || response.statusText);
  }
  return response.json();
}

export async function getCourse(id: number): Promise<any> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(COURSES_ENDPOINTS.DETAIL(String(id)), { method: 'GET' }));
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || response.statusText);
  }
  return response.json();
}

/**
 * Get lightweight course options for selects.
 * Supports optional filters: program_id and organization_id
 */
export async function getCourseOptions(params: { program_id?: number; organization_id?: number } = {}): Promise<any[]> {
  const url = new URL(COURSES_ENDPOINTS.OPTIONS());
  if (params.program_id !== undefined && params.program_id !== null) url.searchParams.append('program_id', String(params.program_id));
  if (params.organization_id !== undefined && params.organization_id !== null) url.searchParams.append('organization_id', String(params.organization_id));

  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || response.statusText);
  }
  return response.json();
}


/**
 * Get course options for the currently authenticated user.
 * Calls backend route: GET /courses/options/me
 * Uses same-origin proxy when in browser so HTTP-only cookie is forwarded.
 */
export async function getCourseOptionsForMe(): Promise<any[]> {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser) {
    const requestUrl = `/api/courses/options/me`;
    const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(requestUrl, { method: 'GET' }));
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || response.statusText);
    }
    return response.json();
  }

  const url = `${getApiBaseUrl()}/courses/options/me`;
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(url, { method: 'GET' }));
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || response.statusText);
  }
  return response.json();
}

export async function createCourse(payload: CreateCoursePayload): Promise<any> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(COURSES_ENDPOINTS.CREATE(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.message || response.statusText);
  }
  return response.json();
}

export async function updateCourse(id: number, payload: Partial<CreateCoursePayload>): Promise<any> {
  // Use PATCH for partial updates; some backends reject PUT for partial updates.
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(COURSES_ENDPOINTS.UPDATE(String(id)), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.message || response.statusText);
  }
  return response.json();
}

export async function deleteCourse(id: number): Promise<void> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(COURSES_ENDPOINTS.DELETE(String(id)), { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }));
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || response.statusText);
  }
}

export const coursesAPI = {
  listCourses,
  getCourse,
  getCourseOptions,
  getCourseOptionsForMe,
  createCourse,
  updateCourse,
  deleteCourse,
  searchCourses,
};

/**
 * Schools API Client
 * Handles all school-related API calls using the organizations endpoint
 */

// ==================== API Configuration ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";

const SCHOOLS_ENDPOINTS = {
  LIST: `${API_BASE_URL}/organizations/`,
  DETAIL: (id: number) => `${API_BASE_URL}/organizations/${id}`,
  CREATE: `${API_BASE_URL}/organizations/`,
  UPDATE: (id: number) => `${API_BASE_URL}/organizations/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/organizations/${id}`,
} as const;

// ==================== Types ====================

export interface AcademicData {
  accreditation?: string | null;
  established_year?: number | null;
  principal_name?: string | null;
  academic_level?: string | null;
}

export interface BusinessData {
  industry?: string | null;
  ceo_name?: string | null;
  founded_year?: number | null;
  company_size?: string | null;
}

export interface School {
  id: number;
  name: string;
  type: "Academic" | "Business";
  address: string | null;
  description: string | null;
  programs_count: number;
  courses_count: number;
  students_count: number;
  faculty_count: number;
  academic_data: AcademicData | null;
  business_data: BusinessData | null;
}

export interface SchoolCreate {
  name: string;
  type: "Academic" | "Business";
  address?: string;
  description?: string;
  academic_data?: AcademicData;
  business_data?: BusinessData;
}

export interface SchoolUpdate {
  name?: string;
  type?: "Academic" | "Business";
  address?: string;
  description?: string;
  academic_data?: AcademicData;
  business_data?: BusinessData;
}

export interface ListSchoolsParams {
  skip?: number;
  limit?: number;
  type?: "Academic" | "Business";
  min_programs?: number;
  max_programs?: number;
  min_courses?: number;
  max_courses?: number;
  min_students?: number;
  max_students?: number;
  min_faculty?: number;
  max_faculty?: number;
}

// ==================== API Functions ====================

/**
 * Get a list of all schools with pagination
 * Optionally filter by type and counts
 */
export async function listSchools(
  params: ListSchoolsParams = {}
): Promise<School[]> {
  // If the caller provided no params, call the endpoint without query parameters
  // (some backends reject requests with query params on this endpoint).
  const hasAnyParam = Object.keys(params).some((k) => (params as any)[k] !== undefined);
  let response: Response;
  if (!hasAnyParam) {
    // Prefer same-origin proxy so cookies / http-only tokens are forwarded by the server
    response = await import('./fetchClient').then(m => m.fetchRawWithAuth('/api/organizations', { method: 'GET' }));
  } else {
    const { 
      skip = 0, 
      limit = 100, 
      type,
      min_programs,
      max_programs,
      min_courses,
      max_courses,
      min_students,
      max_students,
      min_faculty,
      max_faculty
    } = params;

    const url = new URL(SCHOOLS_ENDPOINTS.LIST);
    url.searchParams.append('skip', skip.toString());
    url.searchParams.append('limit', limit.toString());

    if (type) url.searchParams.append('type', type);
    if (min_programs !== undefined) url.searchParams.append('min_programs', min_programs.toString());
    if (max_programs !== undefined) url.searchParams.append('max_programs', max_programs.toString());
    if (min_courses !== undefined) url.searchParams.append('min_courses', min_courses.toString());
    if (max_courses !== undefined) url.searchParams.append('max_courses', max_courses.toString());
    if (min_students !== undefined) url.searchParams.append('min_students', min_students.toString());
    if (max_students !== undefined) url.searchParams.append('max_students', max_students.toString());
    if (min_faculty !== undefined) url.searchParams.append('min_faculty', min_faculty.toString());
    if (max_faculty !== undefined) url.searchParams.append('max_faculty', max_faculty.toString());

    // Forward via same-origin proxy to ensure auth is handled server-side
    const proxyUrl = '/api/organizations?' + url.searchParams.toString();
    response = await import('./fetchClient').then(m => m.fetchRawWithAuth(proxyUrl, { method: 'GET' }));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || response.statusText;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  return data;
}

/**
 * Get a single school by ID
 */
export async function getSchool(id: number): Promise<School> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(SCHOOLS_ENDPOINTS.DETAIL(id), { method: 'GET' }));

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || response.statusText;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Create a new school
 * Backend returns: (school_data, None) on success or (None, "error message") on failure
 */
export async function createSchool(data: SchoolCreate): Promise<School> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(SCHOOLS_ENDPOINTS.CREATE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || errorData.message || response.statusText;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Update an existing school
 * Backend returns: (school_data, None) on success or (None, "error message") on failure
 */
export async function updateSchool(
  id: number,
  data: SchoolUpdate
): Promise<School> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(SCHOOLS_ENDPOINTS.UPDATE(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || errorData.message || response.statusText;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Delete a school
 */
export async function deleteSchool(id: number): Promise<void> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(SCHOOLS_ENDPOINTS.DELETE(id), { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }));

  if (!response.ok) {
    // Try to parse error detail from response
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
    } catch (parseError) {
      // If parsing fails, use status text
      if (parseError instanceof Error && parseError.message !== response.statusText) {
        throw parseError;
      }
    }
    throw new Error(`Failed to delete school: ${response.statusText}`);
  }
}

// Export as schoolsAPI object for consistency
export const schoolsAPI = {
  listSchools,
  getSchool,
  createSchool,
  updateSchool,
  deleteSchool,
};

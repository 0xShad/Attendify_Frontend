/**
 * Programs API Client
 * Handles all program-related API calls
 */

// ==================== API Configuration ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";

const PROGRAMS_ENDPOINTS = {
  LIST: `${API_BASE_URL}/programs/`,
  SEARCH: `${API_BASE_URL}/programs/search`,
  DETAIL: (id: number) => `${API_BASE_URL}/programs/${id}`,
  CREATE: `${API_BASE_URL}/programs/`,
  UPDATE: (id: number) => `${API_BASE_URL}/programs/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/programs/${id}`,
  OPTIONS_ORGANIZATIONS: `${API_BASE_URL}/programs/options/organizations`,
  // Organization options are served from the organizations router on the backend
  // (not under /programs). Use the organizations endpoint so we don't get 404s.
  OPTIONS_ORGANIZATIONS_CORRECTED: `${API_BASE_URL}/organizations/options/organizations`,
  OPTIONS_CODES: `${API_BASE_URL}/programs/options/codes`,
  OPTIONS_CODES_MINE: `${API_BASE_URL}/programs/options/mine`,
  OPTIONS_CODES_BY_ORGANIZATION: (organizationId: number) => `${API_BASE_URL}/programs/options/codes/organization/${organizationId}`,
} as const;

// ==================== Types ====================

export interface Program {
  id: number;
  name: string;
  code: string;
  organization_id: number | null;
  organization_name?: string | null;
  description: string | null;
  courses_count: number;
  students_count: number;
}

export interface ProgramCreate {
  name: string;
  code: string;
  organization_id: number;
  description?: string;
}

export interface ProgramUpdate {
  name?: string;
  code?: string;
  organization_id?: number;
  description?: string;
}

export interface ListProgramsParams {
  skip?: number;
  limit?: number;
  code?: string;
  organization_id?: number;
  min_courses?: number;
  max_courses?: number;
  min_students?: number;
  max_students?: number;
}

export interface SearchProgramsParams {
  skip?: number;
  limit?: number;
  query?: string;
}

export interface OrganizationOption {
  id: number;
  name: string;
}

export interface ProgramCodeOption {
  id: number;
  code: string;
  name?: string;
}

// ==================== API Functions ====================

/**
 * Search programs by name or code (OR logic)
 */
export async function searchPrograms(
  params: SearchProgramsParams = {}
): Promise<Program[]> {
  const { skip = 0, limit = 100, query } = params;
  
  const url = new URL(PROGRAMS_ENDPOINTS.SEARCH);
  url.searchParams.append('skip', skip.toString());
  url.searchParams.append('limit', limit.toString());
  
  if (query && query.trim()) {
    url.searchParams.append('query', query.trim());
  }

  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || response.statusText;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * List programs with filters (AND logic)
 */
export async function listPrograms(
  params: ListProgramsParams = {}
): Promise<Program[]> {
  const { 
    skip = 0, 
    limit = 100, 
    code,
    organization_id,
    min_courses,
    max_courses,
    min_students,
    max_students
  } = params;
  
  const url = new URL(PROGRAMS_ENDPOINTS.LIST);
  url.searchParams.append('skip', skip.toString());
  url.searchParams.append('limit', limit.toString());
  
  if (code && code.trim()) {
    url.searchParams.append('code', code.trim());
  }

  if (organization_id !== undefined) url.searchParams.append('organization_id', organization_id.toString());
  if (min_courses !== undefined) url.searchParams.append('min_courses', min_courses.toString());
  if (max_courses !== undefined) url.searchParams.append('max_courses', max_courses.toString());
  if (min_students !== undefined) url.searchParams.append('min_students', min_students.toString());
  if (max_students !== undefined) url.searchParams.append('max_students', max_students.toString());

  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || response.statusText;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  return data;
}

/**
 * Get a single program by ID
 */
export async function getProgram(id: number): Promise<Program> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(PROGRAMS_ENDPOINTS.DETAIL(id), { method: 'GET' }));

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || response.statusText;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Create a new program
 */
export async function createProgram(data: ProgramCreate): Promise<Program> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(PROGRAMS_ENDPOINTS.CREATE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const errorMessage = errorData.detail || errorData.message || `Failed to create program (${response.status})`;
      throw new Error(errorMessage);
    } catch (parseError) {
      // If parseError is already our thrown Error with message, re-throw it
      if (parseError instanceof Error && parseError.message && !parseError.message.includes('JSON')) {
        throw parseError;
      }
      // If JSON parsing fails, throw a generic error
      throw new Error(`Failed to create program (${response.status}: ${response.statusText})`);
    }
  }

  return response.json();
}

/**
 * Update an existing program
 */
export async function updateProgram(
  id: number,
  data: ProgramUpdate
): Promise<Program> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(PROGRAMS_ENDPOINTS.UPDATE(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || errorData.message || response.statusText;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Delete a program
 */
export async function deleteProgram(id: number): Promise<void> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(PROGRAMS_ENDPOINTS.DELETE(id), { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }));

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
    throw new Error(`Failed to delete program: ${response.statusText}`);
  }
}

/**
 * Get all organizations for filtering (Academic type only)
 */
export async function getOrganizationOptions(): Promise<OrganizationOption[]> {
  const url = new URL(PROGRAMS_ENDPOINTS.OPTIONS_ORGANIZATIONS_CORRECTED);
  // Filter to Academic organizations only
  url.searchParams.append('type', 'Academic');
  
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || response.statusText;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get all unique program codes for filtering
 */
export async function getProgramCodes(): Promise<string[]> {
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth(PROGRAMS_ENDPOINTS.OPTIONS_CODES, { method: 'GET' }));

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || response.statusText;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get program options for the current authenticated user
 */
export async function getMyProgramOptions(): Promise<ProgramCodeOption[]> {
  // Call the same-origin proxy so cookies/HTTP-only tokens are forwarded by the server
  const response = await import('./fetchClient').then(m => m.fetchRawWithAuth('/api/programs/options/mine', { method: 'GET' }));

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || response.statusText;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((d: any) => ({ id: Number(d.id), code: String(d.code), name: d.name ?? undefined }));
}

/**
 * Get program codes for a specific organization
 */
export async function getProgramCodesByOrganization(organizationId: number): Promise<ProgramCodeOption[]> {
  const response = await fetch(PROGRAMS_ENDPOINTS.OPTIONS_CODES_BY_ORGANIZATION(organizationId), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || response.statusText;
    throw new Error(errorMessage);
  }

  // Backend returns an array of objects: [{ id, code }, ...]
  const data = await response.json();
  // Normalize to ProgramCodeOption[] to keep typings accurate
  if (!Array.isArray(data)) return [];
  return data.map((d: any) => ({ id: Number(d.id), code: String(d.code), name: d.name ?? undefined }));
}

// Export as programsAPI object for consistency
export const programsAPI = {
  searchPrograms,
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  getOrganizationOptions,
  getProgramCodes,
  getMyProgramOptions,
  getProgramCodesByOrganization,
};

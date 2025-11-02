/**
 * Programs API Client
 * Handles all program-related API calls
 */

// ==================== API Configuration ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";

const PROGRAMS_ENDPOINTS = {
  LIST: `${API_BASE_URL}/programs/`,
  DETAIL: (id: number) => `${API_BASE_URL}/programs/${id}`,
  CREATE: `${API_BASE_URL}/programs/`,
  UPDATE: (id: number) => `${API_BASE_URL}/programs/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/programs/${id}`,
} as const;

// ==================== Types ====================

export interface Program {
  id: number;
  name: string;
  code: string;
  school_id: number;
  school_name?: string;
  description: string | null;
  courses_count: number;
  students_count: number;
}

export interface ProgramCreate {
  name: string;
  code: string;
  school_id: number;
  description?: string;
}

export interface ProgramUpdate {
  name?: string;
  code?: string;
  school_id?: number;
  description?: string;
}

export interface ListProgramsParams {
  skip?: number;
  limit?: number;
  search?: string;
  school_id?: number;
  min_courses?: number;
  max_courses?: number;
  min_students?: number;
  max_students?: number;
}

// ==================== API Functions ====================

/**
 * Get a list of all programs with pagination
 * Optionally filter by search term, school, and counts
 */
export async function listPrograms(
  params: ListProgramsParams = {}
): Promise<Program[]> {
  const { 
    skip = 0, 
    limit = 100, 
    search,
    school_id,
    min_courses,
    max_courses,
    min_students,
    max_students
  } = params;
  
  const url = new URL(PROGRAMS_ENDPOINTS.LIST);
  url.searchParams.append('skip', skip.toString());
  url.searchParams.append('limit', limit.toString());
  
  // Add search parameter if provided and not empty
  if (search && search.trim()) {
    url.searchParams.append('search', search.trim());
  }

  // Add filters if provided
  if (school_id !== undefined) url.searchParams.append('school_id', school_id.toString());
  if (min_courses !== undefined) url.searchParams.append('min_courses', min_courses.toString());
  if (max_courses !== undefined) url.searchParams.append('max_courses', max_courses.toString());
  if (min_students !== undefined) url.searchParams.append('min_students', min_students.toString());
  if (max_students !== undefined) url.searchParams.append('max_students', max_students.toString());

  const response = await fetch(url.toString(), {
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

  const data = await response.json();
  
  return data;
}

/**
 * Get a single program by ID
 */
export async function getProgram(id: number): Promise<Program> {
  const response = await fetch(PROGRAMS_ENDPOINTS.DETAIL(id), {
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

  return response.json();
}

/**
 * Create a new program
 */
export async function createProgram(data: ProgramCreate): Promise<Program> {
  const response = await fetch(PROGRAMS_ENDPOINTS.CREATE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || errorData.message || response.statusText;
    throw new Error(errorMessage);
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
  const response = await fetch(PROGRAMS_ENDPOINTS.UPDATE(id), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

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
  const response = await fetch(PROGRAMS_ENDPOINTS.DELETE(id), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

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

// Export as programsAPI object for consistency
export const programsAPI = {
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
};

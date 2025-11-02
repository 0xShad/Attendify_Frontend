/**
 * Schools API Client
 * Handles all school-related API calls
 */

// ==================== API Configuration ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";

const SCHOOLS_ENDPOINTS = {
  LIST: `${API_BASE_URL}/schools/`,
  DETAIL: (id: number) => `${API_BASE_URL}/schools/${id}`,
  CREATE: `${API_BASE_URL}/schools/`,
  UPDATE: (id: number) => `${API_BASE_URL}/schools/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/schools/${id}`,
} as const;

// ==================== Types ====================

export interface School {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  programs_count: number;
  courses_count: number;
  students_count: number;
  faculty_count: number;
}

export interface SchoolCreate {
  name: string;
  address?: string;
  description?: string;
}

export interface SchoolUpdate {
  name?: string;
  address?: string;
  description?: string;
}

export interface ListSchoolsParams {
  skip?: number;
  limit?: number;
  name?: string;
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
 * Optionally filter by name and counts
 */
export async function listSchools(
  params: ListSchoolsParams = {}
): Promise<School[]> {
  const { 
    skip = 0, 
    limit = 100, 
    name,
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
  
  // Add name parameter if provided and not empty
  if (name && name.trim()) {
    url.searchParams.append('name', name.trim());
  }

  // Add count filters if provided
  if (min_programs !== undefined) url.searchParams.append('min_programs', min_programs.toString());
  if (max_programs !== undefined) url.searchParams.append('max_programs', max_programs.toString());
  if (min_courses !== undefined) url.searchParams.append('min_courses', min_courses.toString());
  if (max_courses !== undefined) url.searchParams.append('max_courses', max_courses.toString());
  if (min_students !== undefined) url.searchParams.append('min_students', min_students.toString());
  if (max_students !== undefined) url.searchParams.append('max_students', max_students.toString());
  if (min_faculty !== undefined) url.searchParams.append('min_faculty', min_faculty.toString());
  if (max_faculty !== undefined) url.searchParams.append('max_faculty', max_faculty.toString());

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
 * Get a single school by ID
 */
export async function getSchool(id: number): Promise<School> {
  const response = await fetch(SCHOOLS_ENDPOINTS.DETAIL(id), {
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
 * Create a new school
 * Backend returns: (school_data, None) on success or (None, "error message") on failure
 */
export async function createSchool(data: SchoolCreate): Promise<School> {
  const response = await fetch(SCHOOLS_ENDPOINTS.CREATE, {
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
 * Update an existing school
 * Backend returns: (school_data, None) on success or (None, "error message") on failure
 */
export async function updateSchool(
  id: number,
  data: SchoolUpdate
): Promise<School> {
  const response = await fetch(SCHOOLS_ENDPOINTS.UPDATE(id), {
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
 * Delete a school
 */
export async function deleteSchool(id: number): Promise<void> {
  const response = await fetch(SCHOOLS_ENDPOINTS.DELETE(id), {
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

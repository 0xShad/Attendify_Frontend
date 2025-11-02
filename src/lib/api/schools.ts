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
}

// ==================== API Functions ====================

/**
 * Get a list of all schools with pagination
 */
export async function listSchools(
  params: ListSchoolsParams = {}
): Promise<School[]> {
  const { skip = 0, limit = 100 } = params;
  
  const url = new URL(SCHOOLS_ENDPOINTS.LIST);
  url.searchParams.append('skip', skip.toString());
  url.searchParams.append('limit', limit.toString());

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

  return response.json();
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

export interface Program {
  id: string;
  name: string;
  code: string;
  organization: string; // Display name
  organizationId: number | null;
  totalStudents: number;
  totalCourses: number;
  description?: string;
}

export interface ProgramFormData {
  name: string;
  code: string;
  organizationId: number | null;
  description: string;
}

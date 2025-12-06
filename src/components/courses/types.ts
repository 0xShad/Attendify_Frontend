export interface Program {
  id: number;
  code?: string;
  name: string;
  description?: string;
  organization_id?: number | null;
  // some backends may expose a school_id field
  school_id?: number | null;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  program_id?: number | null; // foreign key to Program
  school_id?: number | null; // foreign key to School (optional)
  school_name?: string | null;
  program_name?: string | null; // Program.name
  program_code?: string | null; // Program.code
  classes_count?: number;
  // legacy/ui-only fields
  units?: number;
  hours?: number;
  semester?: string;
  yearLevel?: string;
  status?: "Active" | "Inactive";
  prerequisites?: string[];
}

export type CourseFormData = Partial<Omit<Course, "id">> & { code?: string; name?: string };

export type ProgramOption = Program;

export interface SchoolOption {
  id: number;
  name: string;
  code?: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  school: string;
  duration: string;
  status: "Active" | "Inactive";
  totalStudents: number;
  totalCourses: number;
  description?: string;
}

export interface ProgramFormData {
  name: string;
  code: string;
  school: string;
  duration: string;
  status: "Active" | "Inactive";
  description: string;
}

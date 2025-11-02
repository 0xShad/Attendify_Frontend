export interface School {
  id: string;
  name: string;
  location: string;
  description: string;
  logo?: string;
  address: string;
  contact: string;
  email: string;
  totalPrograms: number;
  totalCourses: number;
  totalStudents: number;
  totalFaculty: number;
  status: "Active" | "Inactive";
}

export interface SchoolFormData {
  name: string;
  address: string;
  description: string;
}

"use client";

export interface Class {
  id: number;
  // Optional section code (e.g. "CS101-A"). Backend stores course_id; frontend may derive a section code.
  code?: string | null;

  // Reference to Course (may be null if not present in response)
  course_id: number | null;
  course_code?: string | null;
  // New field: backend now returns class_code for the specific class/section identifier
  class_code?: string | null;
  course_name?: string | null;

  // Optional descriptive fields on the class
  description?: string | null;
  room?: string | null;
  assigned_faculty_id?: number | null;
  assigned_faculty_name?: string | null;
  academic_year?: string | null;
  semester?: string | null;
  students_count?: number;

  // Optional denormalized program/school info (from joined course->program->organization)
  program_id?: number | null;
  program_name?: string | null;
  organization_id?: number | null;
  organization_name?: string | null;
}

export interface ClassFormData {
  code: string;
  name: string;
  program_id?: number | undefined;
  program_name?: string | undefined;
  school_id?: number | undefined;
  school_name?: string | undefined;
  instructor?: string | undefined;
  schedule?: string | undefined;
}

export interface ProgramOption {
  id: number;
  code?: string;
  name?: string;
}

export interface SchoolOption {
  id: number;
  name: string;
}

export type ClassesFilterValues = {
  query?: string;
  program?: string;
  organization?: string;
  course_option?: string;
  academic_year?: string;
  semester?: string;
  room?: string;
  instructor?: string;
};

"use client";

import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  role: z.string(),
  status: z.string(),
  lastActive: z.string().optional(),
  avatar: z.string().optional(),
  // backend auth user id (when available) - used to fetch enriched profile details
  auth_user_id: z.number().optional(),
  // Additional display fields
  type: z.string().optional(), // e.g. Admin | Business | Academic
  createdAt: z.string().optional(),
  organization_name: z.string().optional(),
  // Flattened profile fields from the backend (kept for completeness)
  academic_program_id: z.number().int().optional(),
  academic_student_id: z.string().optional(),
  academic_year_level: z.number().int().optional(),
  academic_enrollment_date: z.string().optional(),
  business_department: z.string().optional(),
  business_position: z.string().optional(),
  business_employee_id: z.string().optional(),
  business_hire_date: z.string().optional(),
  admin_level: z.string().optional(),
  admin_permissions: z.string().optional(),
  admin_assigned_date: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;



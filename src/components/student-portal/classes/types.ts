export type Schedule = {
  day_of_week?: string | number;
  date?: string; // ISO date or YYYY-MM-DD
  start_time?: string; // HH:MM:SS or HH:MM
  end_time?: string;
  modes?: string[];
  location?: string;
};

export type NextSchedule = Schedule & {
  // student-specific fields may be present
};

export type ClassWithSchedules = {
  id: string | number;
  course_name?: string;
  class_code?: string;
  course_code?: string;
  program_name?: string;
  organization_name?: string;
  description?: string;
  room?: string;
  is_active?: boolean;
  session_active?: boolean;
  session_total?: number;
  session_completed?: number;
  session_insight?: string;
  own_attendance_rate?: number;
  attendance_rate?: number;
  normal_schedules?: Schedule[];
  schedules?: Schedule[];
  special_schedules?: Schedule[];
  next_schedule?: NextSchedule | null;
  // additional dynamic fields allowed
  [key: string]: any;
};

export type Enrollee = {
  id: string | number;
  class_id: string | number;
  student_id: string | number;
  enrolled_at?: string;
  // other fields
  [key: string]: any;
};

export type EnrolledClass = ClassWithSchedules & {
  attendance_pct?: number; // normalized 0-100 percentage added by client
};

export type AttendanceRecord = {
  id: string;
  sessionDate: Date;
  status: "Present" | "Absent" | "Late" | "Excused";
  sessionType: "Regular" | "Lab" | "Review";
  duration: number;
};

export default {};

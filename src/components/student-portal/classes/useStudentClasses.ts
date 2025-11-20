"use client";

import { CheckCircle, Megaphone, BookOpen } from "lucide-react";

export type EnrolledClass = any;

export type AttendanceRecord = {
  id: string;
  sessionDate: Date;
  status: "Present" | "Absent" | "Late" | "Excused";
  sessionType: "Regular" | "Lab" | "Review";
  duration: number;
};

export function useStudentClasses() {
  // Mock data that follows backend `ClassWithSchedules` shape (simplified)
  const enrolledClasses: EnrolledClass[] = [
    {
      id: 123,
      course_id: 45,
      class_code: "CS101-A",
      course_code: "CS101",
      course_name: "Intro to Computer Science",
      program_id: 10,
      program_name: "Computer Science",
      organization_id: 3,
      organization_name: "Example University",
      description: "Intro class",
      room: "Rm 201",
      assigned_faculty_id: 77,
      assigned_faculty_name: "Prof. Alice",
      assigned_secretary: null,
      assigned_secretary_name: null,
      students_count: 30,
      attendance_rate: 87.5,
      schedules: [
        {
          id: 501,
          type: "normal",
          day_of_week: "Monday",
          date: null,
          start_time: "09:00:00",
          end_time: "10:30:00",
          location: "Rm 201",
          reason: null,
          notes: null,
          modes: ["in-person"],
        },
      ],
      normal_schedules: [
        {
          id: 501,
          type: "normal",
          day_of_week: "Monday",
          date: null,
          start_time: "09:00:00",
          end_time: "10:30:00",
          location: "Rm 201",
          reason: null,
          notes: null,
          modes: ["in-person"],
        },
      ],
      special_schedules: [],
      is_active: true,
      current_schedule_id: 501,
      current_schedule_type: "normal",
      session_active: true,
      active_session_id: 9001,
      next_schedule: {
        id: 501,
        type: "normal",
        date: null,
        day_of_week: "Monday",
        start_time: "09:00:00",
        end_time: "10:30:00",
        location: "Rm 201",
      },
      own_attendance_rate: 80.0,
      session_total: 12,
      session_completed: 10,
      session_insight: "Good",
    },
  ];

  const activeSessions = enrolledClasses.map((c) => ({
    id: `SESSION_${c.id}`,
    classId: c.id,
    className: c.course_name ?? c.class_code,
    date: new Date().toISOString().split("T")[0],
    startTime: c.next_schedule?.start_time?.slice(0,5) ?? "09:00",
    endTime: c.next_schedule?.end_time?.slice(0,5) ?? "10:30",
    isActive: !!c.session_active,
    mode: c.normal_schedules?.[0]?.modes?.[0] ?? "in-person",
    location: c.room ?? c.next_schedule?.location,
    requiresFaceRecognition: true,
    allowOnlineMode: true,
  }));

  const generateAttendanceHistory = (classId: number | string): AttendanceRecord[] => {
    const sessions: AttendanceRecord[] = [];
    // Simple deterministic mock: generate last N sessions based on session_total
    const cls = enrolledClasses.find((c) => c.id === classId || c.class_code === classId);
    const total = cls?.session_total ?? 10;
    for (let i = 0; i < total; i++) {
      const status = i % 10 === 0 ? "Absent" : i % 7 === 0 ? "Late" : "Present";
      const sessionType = i % 5 === 0 ? ("Lab" as const) : ("Regular" as const);
      sessions.push({
        id: `${cls?.class_code ?? classId}-s-${i + 1}`,
        sessionDate: new Date(Date.now() - (i * 7) * 24 * 60 * 60 * 1000),
        status,
        sessionType,
        duration: sessionType === "Lab" ? 120 : 60,
      });
    }
    return sessions.reverse();
  };

  const recentActivity = [
    {
      id: 1,
      type: "attendance",
      message: "Attendance recorded for CS101",
      time: "2 hours ago",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      id: 2,
      type: "announcement",
      message: "New announcement in MATH201",
      time: "1 day ago",
      icon: Megaphone,
      color: "text-blue-600",
    },
    {
      id: 3,
      type: "assignment",
      message: "Assignment submitted for ENG102",
      time: "2 days ago",
      icon: BookOpen,
      color: "text-purple-600",
    },
  ];

  return {
    enrolledClasses,
    activeSessions,
    generateAttendanceHistory,
    recentActivity,
  };
}

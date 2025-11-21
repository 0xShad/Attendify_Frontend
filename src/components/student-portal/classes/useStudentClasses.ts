"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { CheckCircle, Megaphone, BookOpen } from "lucide-react";
import { listMyClasses } from "@/lib/api/classes";
import { normalizeAttendanceRate } from "@/lib/utils/format";
import type { EnrolledClass, AttendanceRecord } from "./types";

type UseStudentClassesOptions = {
  skip?: number;
  limit?: number;
  academic_year?: string;
  semester?: string;
  organization_id?: number;
  program_id?: number;
  course_id?: number;
  class_code?: string;
};

export function useStudentClasses(opts?: UseStudentClassesOptions) {
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const buildQuery = (o: UseStudentClassesOptions = {}) => {
    const params = new URLSearchParams();
    params.set("skip", String(o.skip ?? 0));
    params.set("limit", String(o.limit ?? 100));
    if (o.academic_year) params.set("academic_year", o.academic_year);
    if (o.semester) params.set("semester", o.semester);
    if (o.organization_id != null) params.set("organization_id", String(o.organization_id));
    if (o.program_id != null) params.set("program_id", String(o.program_id));
    if (o.course_id != null) params.set("course_id", String(o.course_id));
    if (o.class_code) params.set("class_code", o.class_code);
    return params.toString();
  };

  const fetchClasses = useCallback(async (options?: UseStudentClassesOptions) => {
    setLoading(true);
    setError(null);
    try {
      // Use existing API client which calls the same-origin proxy `/api/classes/mine`.
      const params: any = {
        skip: options?.skip ?? 0,
        limit: options?.limit ?? 100,
      };
      if (options?.academic_year) params.academic_year = options.academic_year;
      if (options?.semester) params.semester = options.semester;
      if (options?.organization_id != null) params.organization_id = options.organization_id;
      if (options?.program_id != null) params.program_id = options.program_id;
      if (options?.course_id != null) params.course_id = options.course_id;
      if (options?.class_code) params.class_code = options.class_code;

      const res = await listMyClasses(params);
      if (!Array.isArray(res)) throw new Error("Unexpected response from listMyClasses");
      // Normalize attendance rate into a consistent 0-100 percentage field for UI convenience
      const normalized = (res as EnrolledClass[]).map((c) => ({
        ...c,
        attendance_pct: normalizeAttendanceRate(c.own_attendance_rate ?? c.attendance_rate),
      }));
      // Development logs removed
      setEnrolledClasses(normalized);
      return normalized;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("useStudentClasses fetch error:", err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial load
    fetchClasses(opts as UseStudentClassesOptions);
  }, [fetchClasses, JSON.stringify(opts ?? {})]);

  const activeSessions = useMemo(() => {
    return enrolledClasses.map((c) => ({
      id: `SESSION_${c.id}`,
      classId: c.id,
      className: c.course_name ?? c.class_code ?? c.course_code,
      date: new Date().toISOString().split("T")[0],
      startTime: c.next_schedule?.start_time?.slice(0, 5) ?? c.normal_schedules?.[0]?.start_time?.slice(0, 5) ?? "09:00",
      endTime: c.next_schedule?.end_time?.slice(0, 5) ?? c.normal_schedules?.[0]?.end_time?.slice(0, 5) ?? "10:30",
      isActive: !!c.session_active,
      mode: c.normal_schedules?.[0]?.modes?.[0] ?? c.schedules?.[0]?.modes?.[0] ?? "in-person",
      location: c.room ?? c.next_schedule?.location ?? c.normal_schedules?.[0]?.location,
      requiresFaceRecognition: true,
      allowOnlineMode: true,
    }));
  }, [enrolledClasses]);

  const generateAttendanceHistory = (classId: number | string): AttendanceRecord[] => {
    const sessions: AttendanceRecord[] = [];
    const cls = enrolledClasses.find((c) => c.id === classId || c.class_code === classId);
    const total = cls?.session_total ?? 10;
    for (let i = 0; i < total; i++) {
      const status = i % 10 === 0 ? "Absent" : i % 7 === 0 ? "Late" : "Present";
      const sessionType = i % 5 === 0 ? ("Lab" as const) : ("Regular" as const);
      sessions.push({
        id: `${cls?.class_code ?? classId}-s-${i + 1}`,
        sessionDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
        status,
        sessionType,
        duration: sessionType === "Lab" ? 120 : 60,
      });
    }
    return sessions.reverse();
  };

  const recentActivity = useMemo(() => [
    {
      id: 1,
      type: "attendance",
      message: "Attendance recorded",
      time: "2 hours ago",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      id: 2,
      type: "announcement",
      message: "New announcement",
      time: "1 day ago",
      icon: Megaphone,
      color: "text-blue-600",
    },
    {
      id: 3,
      type: "assignment",
      message: "Assignment submitted",
      time: "2 days ago",
      icon: BookOpen,
      color: "text-purple-600",
    },
  ], []);

  return {
    enrolledClasses,
    activeSessions,
    generateAttendanceHistory,
    recentActivity,
    loading,
    error,
    reload: () => fetchClasses(opts as UseStudentClassesOptions),
  };
}

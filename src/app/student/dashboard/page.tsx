"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useAuthContext } from '@/contexts/AuthContext';
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  BookOpen,
  UserCheck,
  Megaphone,
  Plus,
  ChevronRight,
  MapPin,
  AlertTriangle,
  Wifi,
  Camera,
  Eye,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import DashboardMetrics from "@/components/student-portal/dashboard/DashboardMetrics";
import DashboardActiveSessions from "@/components/student-portal/dashboard/DashboardActiveSessions";
import DashboardQuickActions from "@/components/student-portal/dashboard/DashboardQuickActions";
import DashboardAttendanceOverview from "@/components/student-portal/dashboard/DashboardAttendanceOverview";
import DashboardUpcomingSessions from "@/components/student-portal/dashboard/DashboardUpcomingSessions";
import DashboardAnnouncements from "@/components/student-portal/dashboard/DashboardAnnouncements";
import { getStudentDashboard } from "@/lib/api/analytics";

type TrendType = "up" | "down" | "neutral";

export default function StudentDashboard() {
  // Local state + mock fallback
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getStudentDashboard()
      .then((data) => {
        if (mounted) setDashboard(data);
      })
      .catch((err) => {
        console.error("Failed to fetch student dashboard:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const refreshDashboard = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStudentDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('refreshDashboard failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get the authenticated user's name for the greeting
  const { user } = useAuthContext();
  const displayName = user ? `${(user.firstName || user.username || user.email || '').trim()}${user.lastName ? ` ${user.lastName}` : ''}`.trim() || 'Guest' : 'Guest';

  // Map enrolled classes from the dashboard payload when available. The
  // backend returns `Enrolled_Classes_This_Semester` with fields like
  // `class_id`, `class_code`, `my_attendance_rate`, `session_attended`,
  // and `session_total`. Map to the frontend shape expected by the
  // `DashboardClassPerformance` component.
  const enrolledClasses = useMemo(() => {
    if (dashboard && Array.isArray(dashboard.Enrolled_Classes_This_Semester)) {
      return dashboard.Enrolled_Classes_This_Semester.map((it: any) => ({
        id: it.class_id ? String(it.class_id) : `${String(it.course_id ?? 'c')}-${String(it.class_code ?? '')}`,
        // Use the full course name as the primary label for UI/charting
        name: it.course_name ? String(it.course_name) : (it.course_code ? String(it.course_code) : String(it.class_code ?? '')),
        code: it.class_code ?? it.course_code ?? null,
        attendanceRate: Number(it.my_attendance_rate ?? 0),
        attendedSessions: Number(it.session_attended ?? it.attendance_present ?? 0),
        totalSessions: Number(it.session_total ?? 0),
        raw: it,
      }));
    }

    // Fallback: empty list (avoid hardcoded mock data when real dashboard exists)
    return [];
  }, [dashboard]);

  // Parse schedule start_time (HH:MM:SS) into a Date for today
  function parseScheduleStartToDate(startTime: string | null) {
    if (!startTime) return null;
    const parts = startTime.split(":");
    if (parts.length < 2) return null;
    const now = new Date();
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(parts[0], 10),
      parseInt(parts[1], 10),
      parts[2] ? parseInt(parts[2], 10) : 0
    );
    return d;
  }

  const activeSessions = useMemo(() => {
    if (dashboard?.Current_Class_Section) {
      const c = dashboard.Current_Class_Section;
      const sched = findScheduleById(c.schedule); // primary lookup by schedule id (now authoritative)
      return [
        {
          id: c.class_id ? String(c.class_id) : "current",
          classId: c.class_id ? String(c.class_id) : undefined,
          sessionId: c.session_id ?? undefined,
          className: formatClassLabel(c.class_code, c.course_name),
          date: undefined,
          startTime:
            formatTimeFromHHMMSS(sched?.start_time) || (sched?.start_time ? String(sched.start_time).slice(0,5) : undefined),
          endTime:
            formatTimeFromHHMMSS(sched?.end_time) || (sched?.end_time ? String(sched.end_time).slice(0,5) : undefined),
          isActive: !!c.is_active,
          isSecretary: !!dashboard?.User_Section?.is_secretary,
          mode: normalizeMode(c.mode) || undefined,
          location: sched?.location || c.room || undefined,
          requiresFaceRecognition: !!c.mode && /face|f2f|face_to_face|face-to-face/i.test(String(c.mode)),
          allowOnlineMode: !!c.mode && (/online|hybrid/i.test(String(c.mode))),
          cutoffTime: undefined,
        },
      ];
    }
    return [];
  }, [dashboard]);

  // DEBUG: log dashboard and activeSessions to help troubleshoot missing current class
  React.useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      const dump = (() => { try { return JSON.stringify(dashboard, null, 2); } catch (e) { return String(dashboard); }})();
      console.debug("student dashboard payload (json):", dump);
      // eslint-disable-next-line no-console
      console.debug("computed activeSessions:", activeSessions);
    } catch (e) {
      // ignore
    }
  }, [dashboard, activeSessions]);

  const announcements = useMemo(() => {
    if (dashboard?.Announcement_Section) {
      // Minimal mapping: we don't have full announcement content from this endpoint, so create placeholders
      const a = dashboard.Announcement_Section;
      return [
        {
          id: "announcements-summary",
          title: `${a.unread_announcements} unread announcements`,
          content: `${a.total_announcements_in_my_classes} announcements in your classes`,
          className: null,
          date: a.last_read || null,
          priority: "Medium",
          isRead: false,
        },
      ];
    }
    return [];
  }, [dashboard]);

  // Calculate metrics
  const metricCards = useMemo(() => {
    if (dashboard) {
      const ann = dashboard.Announcement_Section || {};
      return [
        {
          title: "Enrolled Classes",
          value: String(dashboard.enrolled_classes ?? 0),
          change: `${dashboard.difference_last_semester ?? 0} this semester`,
          trend: (dashboard.difference_last_semester || 0) > 0 ? ("up" as TrendType) : ("neutral" as TrendType),
          icon: BookOpen,
          color: "bg-blue-500",
        },
        {
          title: "Overall Attendance",
          value: `${dashboard.attendance_rate_this_semester ?? 0}%`,
          change: `${dashboard.attendance_rate_diff_from_prev_month ?? 0}% than last month`,
          trend: (dashboard.attendance_rate_diff_from_prev_month || 0) > 0 ? ("up" as TrendType) : ("down" as TrendType),
          icon: UserCheck,
          color: "bg-green-500",
        },
        {
          title: "Sessions This Week",
          value: String(dashboard.class_schedule_this_week ?? 0),
          change: `${dashboard.upcoming_today ?? 0} upcoming today`,
          trend: "neutral" as TrendType,
          icon: Calendar,
          color: "bg-violet-500",
        },
        {
          title: "Unread Announcements",
          value: String(ann.unread_announcements ?? 0),
          change: `${ann.total_announcements_in_my_classes ?? 0} total`,
          trend: "neutral" as TrendType,
          icon: Megaphone,
          color: "bg-orange-500",
        },
      ];
    }

    return [
      {
        title: "Enrolled Classes",
        value: enrolledClasses.length.toString(),
        change: "+1 this semester",
        trend: "up" as TrendType,
        icon: BookOpen,
        color: "bg-blue-500",
      },
      {
        title: "Overall Attendance",
        value: `${Math.round(
          enrolledClasses.reduce((sum, cls) => sum + (cls.attendanceRate || 0), 0) /
            Math.max(1, enrolledClasses.length)
        )}%`,
        change: "+2.3% this month",
        trend: "up" as TrendType,
        icon: UserCheck,
        color: "bg-green-500",
      },
      {
        title: "Sessions This Week",
        value: "12",
        change: "3 upcoming today",
        trend: "neutral" as TrendType,
        icon: Calendar,
        color: "bg-violet-500",
      },
      {
        title: "Unread Announcements",
        value: announcements.filter((a) => !a.isRead).length.toString(),
        change: "-1 from yesterday",
        trend: "down" as TrendType,
        icon: Megaphone,
        color: "bg-orange-500",
      },
    ];
  }, [dashboard, enrolledClasses, announcements]);

  // Attendance chart data
  const attendanceChartData = useMemo(() => {
    // Prefer the enrolled-classes stats when available because they include
    // per-class attendance breakdowns (present/late/absent/excused).
    if (dashboard?.Enrolled_Classes_This_Semester && dashboard.Enrolled_Classes_This_Semester.length) {
      return dashboard.Enrolled_Classes_This_Semester.map((it: any) => ({
        name: it.course_name ? String(it.course_name) : (it.class_code ? String(it.class_code) : ''),
        attendance: Number(it.my_attendance_rate ?? 0),
        sessions: Number(it.session_attended ?? it.attendance_present ?? 0),
        total: Number(it.session_total ?? 0),
        attendance_present: Number(it.attendance_present ?? 0),
        attendance_late: Number(it.attendance_late ?? 0),
        attendance_absent: Number(it.attendance_absent ?? 0),
        attendance_excused: Number(it.attendance_excused ?? 0),
        raw: it,
      }));
    }

    // Fallback: map today's schedule entries (these typically don't include
    // the detailed attendance counts, so totals may be zero).
    if (dashboard?.Today_Schedule_Section?.length) {
      return dashboard.Today_Schedule_Section.map((it: any) => ({
        // Prefer course_name when available so chart labels show full course title
        name: it.course_name ? String(it.course_name) : (it.class_code ? String(it.class_code) : ''),
        attendance: dashboard.attendance_rate_this_semester ?? 0,
        sessions: Number(it.session_attended ?? it.attendance_present ?? 0),
        total: Number(it.session_total ?? 0),
        attendance_present: Number(it.attendance_present ?? it.session_attended ?? 0),
        attendance_late: Number(it.attendance_late ?? 0),
        attendance_absent: Number(it.attendance_absent ?? 0),
        attendance_excused: Number(it.attendance_excused ?? 0),
        raw: it,
      }));
    }

    return [];
  }, [dashboard, enrolledClasses]);

  const chartConfig = {
    attendance: {
      label: "Attendance %",
      color: "hsl(217, 91%, 60%)",
    },
  };

  function normalizeMode(mode: string | null | undefined) {
    if (!mode) return undefined;
    const m = String(mode).toLowerCase();
    if (m === "online") return "Online";
    if (m === "hybrid") return "Hybrid";
    if (m === "face_to_face" || m === "face-to-face" || m === "f2f" || m === "face") return "Face-to-Face";
    if (m.includes("face") && m.includes("to")) return "Face-to-Face";
    return String(mode).charAt(0).toUpperCase() + String(mode).slice(1);
  }

  function formatClassLabel(classCode?: any, courseName?: any) {
    const code = classCode ? String(classCode) : null;
    const name = courseName ? String(courseName) : null;
    if (code && name) return `${code} - ${name}`;
    if (code) return code;
    if (name) return name;
    return "(Unknown Class)";
  }

  function formatTimeFromHHMMSS(hms: string | null | undefined) {
    if (!hms) return null;
    const date = parseScheduleStartToDate(hms);
    if (!date) return null;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function findScheduleById(id: number | string | null | undefined) {
    if (!id) return null;
    const sid = Number(id);
    const today = dashboard?.Today_Schedule_Section || [];
    const all = dashboard?.Schedules_Section || [];
    let found = today.find((it: any) => it.schedule && Number(it.schedule.id) === sid);
    if (found) return found.schedule;
    found = all.find((it: any) => it.schedule && Number(it.schedule.id) === sid);
    if (found) return found.schedule;
    return null;
  }

  // NOTE: Removed class-id fallback; backend `Current_Class_Section.schedule` is authoritative.


  // Upcoming sessions (from dashboard.Today_Schedule_Section)

  const upcomingSessions = useMemo(() => {
    if (dashboard?.Today_Schedule_Section?.length) {
      const now = new Date();
      const currentScheduleId = dashboard.Current_Class_Section?.schedule ?? null;

      return dashboard.Today_Schedule_Section
        .filter((it: any) => {
          // Exclude the current session (already in progress)
          if (currentScheduleId && it.schedule && it.schedule.id === currentScheduleId) return false;

          // Parse start time and exclude if it's already past
          const startDate = parseScheduleStartToDate(it.schedule?.start_time || null);
          if (startDate && startDate.getTime() <= now.getTime()) return false;

          return true;
        })
        .map((it: any) => ({
          id: String(it.class_id || it.class_code || it.course_id || Math.random()),
          name: formatClassLabel(it.class_code, it.course_name),
          mode: normalizeMode(it.mode) || undefined,
          nextSession: parseScheduleStartToDate(it.schedule?.start_time || null),
          location: it.schedule?.location || it.room || null,
          dayOfWeek: it.schedule?.day_of_week || null,
        }));
    }

    return enrolledClasses
      .filter((cls) => {
        if (!cls.nextSession) return false;
        const now = new Date();
        const sessionTime = new Date(cls.nextSession);
        const timeDiff = sessionTime.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000; // Next 24 hours
      })
      .sort((a, b) => new Date(a.nextSession!).getTime() - new Date(b.nextSession!).getTime());
  }, [dashboard, enrolledClasses]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section - Mobile First */}
      <div className="flex flex-col space-y-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your classes today.
          </p>
        </div>
      </div>

      {/* Dashboard Metrics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        <DashboardMetrics metrics={metricCards as any} />
      )}

      {/* Active Sessions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          <div className="lg:col-span-2">
            <Skeleton className="h-48" />
          </div>
        ) : (
          <DashboardActiveSessions
            sessions={activeSessions}
            currentSession={activeSessions && activeSessions.length ? activeSessions[0] : undefined}
            onRefresh={refreshDashboard}
            currentUserIsSecretary={!!dashboard?.User_Section?.is_secretary}
          />
        )}

        {loading ? (
          <Skeleton className="h-48" />
        ) : (
          <DashboardQuickActions />
        )}
      </div>

      {/* Upcoming Sessions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {loading ? (
          <Skeleton className="h-56" />
        ) : (
          <DashboardUpcomingSessions
            sessions={upcomingSessions}
            noMoreToday={
              !!dashboard?.Today_Schedule_Section?.length &&
              dashboard.Today_Schedule_Section.length > 0 &&
              upcomingSessions.length === 0
            }
          />
        )}

        {loading ? (
          <Skeleton className="h-56" />
        ) : (
          <DashboardAnnouncements announcements={announcements} />
        )}
      </div>

      {/* Attendance Overview */}
      <DashboardAttendanceOverview
        enrolledClasses={enrolledClasses}
        chartConfig={chartConfig}
        attendanceChartData={attendanceChartData}
      />
    </div>
  );
}

"use client";

import React, { useMemo } from "react";
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

type TrendType = "up" | "down" | "neutral";

export default function StudentDashboard() {
  // Mock data
  const enrolledClasses = useMemo(
    () => [
      {
        id: "CS101",
        name: "Introduction to Computer Science",
        code: "CS101",
        instructor: "Dr. Sarah Johnson",
        schedule: "Mon, Wed, Fri 9:00 AM",
        mode: "Hybrid" as const,
        location: "Room 202 / Online",
        nextSession: new Date("2025-10-17T09:00:00"),
        attendanceRate: 92.5,
        totalSessions: 32,
        attendedSessions: 30,
        status: "Active" as const,
      },
      {
        id: "MATH201",
        name: "Calculus II",
        code: "MATH201",
        instructor: "Prof. Michael Chen",
        schedule: "Tue, Thu 2:00 PM",
        mode: "In-Person" as const,
        location: "Math Building 104",
        nextSession: new Date("2025-10-17T14:00:00"),
        attendanceRate: 88.0,
        totalSessions: 28,
        attendedSessions: 25,
        status: "Active" as const,
      },
      {
        id: "ENG102",
        name: "English Composition",
        code: "ENG102",
        instructor: "Dr. Emily Rodriguez",
        schedule: "Mon, Wed 11:00 AM",
        mode: "Online" as const,
        nextSession: new Date("2025-10-17T11:00:00"),
        attendanceRate: 96.0,
        totalSessions: 24,
        attendedSessions: 23,
        status: "Active" as const,
      },
    ],
    []
  );

  const activeSessions = useMemo(
    () => [
      {
        id: "SESSION001",
        classId: "CS101",
        className: "Introduction to Computer Science",
        date: "2025-10-17",
        startTime: "09:00",
        endTime: "10:30",
        isActive: true,
        mode: "Hybrid" as const,
        location: "Room 202",
        requiresFaceRecognition: true,
        allowOnlineMode: true,
        cutoffTime: 10,
      },
    ],
    []
  );

  const announcements = useMemo(
    () => [
      {
        id: "ANN001",
        title: "Midterm Exam Schedule Released",
        content: "The midterm examination schedule has been posted.",
        classId: "CS101",
        className: "Introduction to Computer Science",
        instructor: "Dr. Sarah Johnson",
        date: "2025-10-15",
        priority: "High" as const,
        isRead: false,
      },
      {
        id: "ANN002",
        title: "Assignment 3 Due Friday",
        content:
          "Don&apos;t forget that Assignment 3 is due this Friday at 11:59 PM.",
        classId: "MATH201",
        className: "Calculus II",
        instructor: "Prof. Michael Chen",
        date: "2025-10-14",
        priority: "Medium" as const,
        isRead: false,
      },
    ],
    []
  );

  // Calculate metrics
  const metricCards = useMemo(
    () => [
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
          enrolledClasses.reduce((sum, cls) => sum + cls.attendanceRate, 0) /
            enrolledClasses.length
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
    ],
    [enrolledClasses, announcements]
  );

  // Attendance chart data
  const attendanceChartData = enrolledClasses.map((cls) => ({
    name: cls.code,
    attendance: cls.attendanceRate,
    sessions: cls.attendedSessions,
    total: cls.totalSessions,
  }));

  const chartConfig = {
    attendance: {
      label: "Attendance %",
      color: "hsl(217, 91%, 60%)",
    },
  };

  // Upcoming sessions (next 24 hours)
  const upcomingSessions = enrolledClasses
    .filter((cls) => {
      if (!cls.nextSession) return false;
      const now = new Date();
      const sessionTime = new Date(cls.nextSession);
      const timeDiff = sessionTime.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000; // Next 24 hours
    })
    .sort(
      (a, b) =>
        new Date(a.nextSession!).getTime() - new Date(b.nextSession!).getTime()
    );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section - Mobile First */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, Alex!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your classes today.
          </p>
        </div>
      </div>

      {/* Dashboard Metrics Cards */}
      <DashboardMetrics metrics={metricCards as any} />

      {/* Active Sessions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <DashboardActiveSessions sessions={activeSessions} />
        <DashboardQuickActions />
      </div>

      {/* Upcoming Sessions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <DashboardUpcomingSessions sessions={upcomingSessions} />
        <DashboardAnnouncements announcements={announcements} />
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

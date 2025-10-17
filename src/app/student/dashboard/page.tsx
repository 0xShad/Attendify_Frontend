"use client";

import React, { useState, useMemo } from "react";
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
  Video,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Camera,
  Play,
  Eye,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
} from "recharts";

type TrendType = "up" | "down" | "neutral";

export default function StudentDashboard() {
  // Mock data
  const enrolledClasses = [
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
  ];

  const activeSessions = [
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
  ];

  const announcements = [
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
      content: "Don't forget that Assignment 3 is due this Friday at 11:59 PM.",
      classId: "MATH201",
      className: "Calculus II",
      instructor: "Prof. Michael Chen",
      date: "2025-10-14",
      priority: "Medium" as const,
      isRead: false,
    },
  ];

  const recentAttendance = [
    { date: "Mon", attended: true, className: "CS101" },
    { date: "Tue", attended: true, className: "MATH201" },
    { date: "Wed", attended: false, className: "CS101" },
    { date: "Thu", attended: true, className: "MATH201" },
    { date: "Fri", attended: true, className: "CS101" },
  ];

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
            Here's what's happening with your classes today.
          </p>
        </div>
      </div>

      {/* Dashboard Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric, index) => (
          <Card key={index} className="@container/card">
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={
                    metric.trend === "up"
                      ? "border-green-200 text-green-700 bg-green-50"
                      : metric.trend === "down"
                      ? "border-red-200 text-red-700 bg-red-50"
                      : "border-gray-200 text-gray-700 bg-gray-50"
                  }
                >
                  {metric.trend === "up" && (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  )}
                  {metric.trend === "down" && (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {metric.change}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Active Sessions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Active Sessions */}
        <Card className="lg:col-span-2 border shadow-sm bg-stone-50/40 supports-[backdrop-filter]:backdrop-blur-md border-stone-200/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Active Sessions</CardTitle>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                {activeSessions.length} Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active sessions</p>
                <p className="text-sm">
                  Sessions will appear here when they start
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-blue-50 border-green-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <h4 className="font-medium truncate">
                            {session.className}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.startTime} - {session.endTime}
                          </div>
                          {session.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.location}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        {session.allowOnlineMode && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="whitespace-nowrap"
                          >
                            <Wifi className="w-3 h-3 mr-1" />
                            Join Online
                          </Button>
                        )}
                        {session.requiresFaceRecognition && (
                          <Button size="sm" className="whitespace-nowrap">
                            <Camera className="w-3 h-3 mr-1" />
                            Face Scan
                          </Button>
                        )}
                      </div>
                    </div>

                    {session.cutoffTime && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-yellow-700">
                          Attendance closes {session.cutoffTime} minutes after
                          start time
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border shadow-sm bg-stone-50/40 supports-[backdrop-filter]:backdrop-blur-md border-stone-200/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/student/classes/join" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Join New Class
              </Button>
            </Link>
            <Link href="/student/attendance" className="block">
              <Button className="w-full justify-start" variant="outline">
                <UserCheck className="w-4 h-4 mr-2" />
                View Attendance
              </Button>
            </Link>
            <Link href="/student/profile" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Camera className="w-4 h-4 mr-2" />
                Update Face Data
              </Button>
            </Link>
            <Link href="/student/announcements" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Megaphone className="w-4 h-4 mr-2" />
                View Announcements
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Upcoming Sessions */}
        <Card className="border shadow-sm bg-stone-50/40 supports-[backdrop-filter]:backdrop-blur-md border-stone-200/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No classes today</p>
                <p className="text-sm">Enjoy your day off!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 4).map((cls) => {
                  const sessionTime = new Date(cls.nextSession!);
                  const timeUntil = Math.floor(
                    (sessionTime.getTime() - new Date().getTime()) / (1000 * 60)
                  );

                  return (
                    <div
                      key={cls.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/50 border border-stone-200/50 hover:bg-white/70 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            cls.mode === "Online"
                              ? "bg-blue-500"
                              : cls.mode === "In-Person"
                              ? "bg-green-500"
                              : "bg-purple-500"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {cls.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {sessionTime.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {cls.location && (
                            <>
                              <span>•</span>
                              <span className="truncate">{cls.location}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <Badge variant="outline" className="text-xs">
                          {timeUntil > 60
                            ? `${Math.floor(timeUntil / 60)}h ${
                                timeUntil % 60
                              }m`
                            : `${timeUntil}m`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}

                {upcomingSessions.length > 4 && (
                  <Link href="/student/classes">
                    <Button variant="ghost" className="w-full">
                      View All Classes
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card className="border shadow-sm bg-stone-50/40 supports-[backdrop-filter]:backdrop-blur-md border-stone-200/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Announcements</CardTitle>
              <Link href="/student/announcements">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No announcements</p>
                <p className="text-sm">New announcements will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      !announcement.isRead
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white/50 border-stone-200/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {announcement.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${
                          announcement.priority === "High"
                            ? "border-red-200 text-red-700 bg-red-50"
                            : announcement.priority === "Medium"
                            ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                            : "border-green-200 text-green-700 bg-green-50"
                        }`}
                      >
                        {announcement.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{announcement.className || "General"}</span>
                      <span>{announcement.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Overview */}
      <Card className="border shadow-sm bg-stone-50/40 supports-[backdrop-filter]:backdrop-blur-md border-stone-200/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Attendance Overview</CardTitle>
              <CardDescription>
                Your attendance performance across all classes
              </CardDescription>
            </div>
            <Link href="/student/attendance">
              <Button variant="outline" size="sm">
                <Eye className="w-3 h-3 mr-1" />
                View Details
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attendance Chart */}
            <div className="lg:col-span-2">
              <ChartContainer
                config={chartConfig}
                className="h-48 md:h-64 w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={attendanceChartData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                >
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    className="text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    className="text-xs"
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="attendance"
                    fill="var(--color-attendance)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Class Performance */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Class Performance</h4>
              <div className="space-y-3">
                {enrolledClasses.map((cls) => (
                  <div key={cls.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{cls.code}</span>
                      <span className="text-muted-foreground">
                        {cls.attendedSessions}/{cls.totalSessions}
                      </span>
                    </div>
                    <Progress value={cls.attendanceRate} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{cls.attendanceRate}% attendance</span>
                      <span
                        className={
                          cls.attendanceRate >= 90
                            ? "text-green-600"
                            : cls.attendanceRate >= 75
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {cls.attendanceRate >= 90
                          ? "Excellent"
                          : cls.attendanceRate >= 75
                          ? "Good"
                          : "Needs Improvement"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import {
  IconDownload,
  IconFilter,
  IconCalendar,
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconUserCheck,
  IconClock,
  IconFileText,
  IconChartBar,
} from "@tabler/icons-react";
import {
  Download,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  Clock,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

interface Class {
  id: string;
  name: string;
  code: string;
  schedule: string;
  enrolledStudents: number;
  totalSessions: number;
  completedSessions: number;
  attendanceRate: number;
  status: "Active" | "Inactive" | "Scheduled";
}

interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
  enrollmentStatus: "Enrolled" | "Pending" | "Rejected";
  attendanceRate: number;
  totalSessions: number;
  presentSessions: number;
  lastAttendance?: string;
}

interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "Active" | "Completed" | "Scheduled";
  presentCount: number;
  totalStudents: number;
}

interface ReportsAnalyticsProps {
  classes: Class[];
  students: Student[];
  sessions: AttendanceSession[];
}

export function ReportsAnalytics({
  classes,
  students,
  sessions,
}: ReportsAnalyticsProps) {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("week");
  const [reportType, setReportType] = useState<string>("attendance");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const filteredClasses =
      selectedClass === "all"
        ? classes
        : classes.filter((c) => c.id === selectedClass);
    const filteredStudents =
      selectedClass === "all"
        ? students
        : students.filter((s) => s.classId === selectedClass);
    const filteredSessions =
      selectedClass === "all"
        ? sessions
        : sessions.filter((s) => s.classId === selectedClass);

    // Overall statistics
    const totalStudents = filteredStudents.filter(
      (s) => s.enrollmentStatus === "Enrolled"
    ).length;
    const totalSessions = filteredSessions.filter(
      (s) => s.status === "Completed"
    ).length;
    const averageAttendance =
      filteredClasses.length > 0
        ? filteredClasses.reduce((sum, cls) => sum + cls.attendanceRate, 0) /
          filteredClasses.length
        : 0;

    // Attendance trend data (mock data for demonstration)
    const attendanceTrend = [
      { date: "Oct 8", rate: 88 },
      { date: "Oct 9", rate: 92 },
      { date: "Oct 10", rate: 85 },
      { date: "Oct 11", rate: 90 },
      { date: "Oct 12", rate: 94 },
      { date: "Oct 13", rate: 87 },
      { date: "Oct 14", rate: 91 },
      { date: "Oct 15", rate: 89 },
    ];

    // Class performance data
    const classPerformance = filteredClasses.map((cls) => ({
      name: cls.code,
      attendance: cls.attendanceRate,
      sessions: cls.completedSessions,
      students: cls.enrolledStudents,
    }));

    // Student performance categories
    const excellentStudents = filteredStudents.filter(
      (s) => s.attendanceRate >= 95
    ).length;
    const goodStudents = filteredStudents.filter(
      (s) => s.attendanceRate >= 85 && s.attendanceRate < 95
    ).length;
    const averageStudents = filteredStudents.filter(
      (s) => s.attendanceRate >= 75 && s.attendanceRate < 85
    ).length;
    const poorStudents = filteredStudents.filter(
      (s) => s.attendanceRate < 75
    ).length;

    const performanceData = [
      { name: "Excellent (95%+)", value: excellentStudents, color: "#22c55e" },
      { name: "Good (85-94%)", value: goodStudents, color: "#3b82f6" },
      { name: "Average (75-84%)", value: averageStudents, color: "#f59e0b" },
      { name: "Poor (<75%)", value: poorStudents, color: "#ef4444" },
    ];

    return {
      totalStudents,
      totalSessions,
      averageAttendance,
      attendanceTrend,
      classPerformance,
      performanceData,
    };
  }, [classes, students, sessions, selectedClass]);

  const chartConfig = {
    attendance: {
      label: "Attendance Rate",
      color: "hsl(217, 91%, 60%)",
    },
  };

  const handleExportReport = (format: string) => {
    const timestamp = new Date().toISOString().split("T")[0];
    const className =
      selectedClass === "all"
        ? "All_Classes"
        : classes.find((c) => c.id === selectedClass)?.code || selectedClass;

    let csvContent = "";
    let filename = "";

    switch (reportType) {
      case "attendance":
        filename = `${className}_Attendance_Report_${timestamp}.${format}`;
        if (format === "csv") {
          const headers = [
            "Class",
            "Code",
            "Enrolled Students",
            "Completed Sessions",
            "Attendance Rate",
            "Status",
          ];
          const filteredClasses =
            selectedClass === "all"
              ? classes
              : classes.filter((c) => c.id === selectedClass);
          csvContent = [
            headers.join(","),
            ...filteredClasses.map((cls) =>
              [
                cls.name,
                cls.code,
                cls.enrolledStudents,
                cls.completedSessions,
                `${cls.attendanceRate}%`,
                cls.status,
              ].join(",")
            ),
          ].join("\n");
        }
        break;

      case "students":
        filename = `${className}_Student_Report_${timestamp}.${format}`;
        if (format === "csv") {
          const headers = [
            "Student ID",
            "Name",
            "Email",
            "Class",
            "Attendance Rate",
            "Present Sessions",
            "Total Sessions",
          ];
          const filteredStudents =
            selectedClass === "all"
              ? students
              : students.filter((s) => s.classId === selectedClass);
          csvContent = [
            headers.join(","),
            ...filteredStudents.map((student) => {
              const studentClass = classes.find(
                (c) => c.id === student.classId
              );
              return [
                student.id,
                student.name,
                student.email,
                studentClass?.code || "",
                `${student.attendanceRate}%`,
                student.presentSessions,
                student.totalSessions,
              ].join(",");
            }),
          ].join("\n");
        }
        break;

      case "sessions":
        filename = `${className}_Sessions_Report_${timestamp}.${format}`;
        if (format === "csv") {
          const headers = [
            "Session ID",
            "Class",
            "Date",
            "Start Time",
            "End Time",
            "Present",
            "Total",
            "Attendance Rate",
          ];
          const filteredSessions =
            selectedClass === "all"
              ? sessions
              : sessions.filter((s) => s.classId === selectedClass);
          csvContent = [
            headers.join(","),
            ...filteredSessions.map((session) =>
              [
                session.id,
                session.className,
                session.date,
                session.startTime,
                session.endTime || "N/A",
                session.presentCount,
                session.totalStudents,
                `${Math.round(
                  (session.presentCount / session.totalStudents) * 100
                )}%`,
              ].join(",")
            ),
          ].join("\n");
        }
        break;
    }

    if (format === "csv" && csvContent) {
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }

    setExportDialogOpen(false);
    toast({
      title: "Success",
      description: `${
        reportType.charAt(0).toUpperCase() + reportType.slice(1)
      } report exported successfully`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            Customize your reports and analytics view
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="semester">This Semester</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setExportDialogOpen(true)}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {analyticsData.totalStudents}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Students
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {analyticsData.totalSessions}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Sessions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {analyticsData.averageAttendance.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg. Attendance
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">+2.3%</div>
                <div className="text-sm text-muted-foreground">Trend</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Trends</TabsTrigger>
          <TabsTrigger value="classes">Class Performance</TabsTrigger>
          <TabsTrigger value="students">Student Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trend</CardTitle>
                <CardDescription>
                  Daily attendance rates over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <LineChart data={analyticsData.attendanceTrend}>
                    <XAxis dataKey="date" />
                    <YAxis domain={[70, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="var(--color-attendance)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-attendance)" }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Student Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Student Performance</CardTitle>
                <CardDescription>
                  Distribution by attendance rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.performanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {analyticsData.performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {analyticsData.performanceData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Attendance Analysis</CardTitle>
              <CardDescription>
                Comprehensive attendance tracking and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <BarChart data={analyticsData.attendanceTrend}>
                  <XAxis dataKey="date" />
                  <YAxis domain={[70, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="rate"
                    fill="var(--color-attendance)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance Comparison</CardTitle>
              <CardDescription>
                Compare attendance rates across different classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.classPerformance.map((cls, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{cls.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {cls.students} students • {cls.sessions} sessions
                          completed
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {cls.attendance}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Attendance
                        </div>
                      </div>
                    </div>
                    <Progress value={cls.attendance} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Breakdown</CardTitle>
              <CardDescription>
                Individual student attendance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Last Attendance</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students
                    .filter(
                      (s) =>
                        selectedClass === "all" || s.classId === selectedClass
                    )
                    .filter((s) => s.enrollmentStatus === "Enrolled")
                    .sort((a, b) => b.attendanceRate - a.attendanceRate)
                    .slice(0, 10)
                    .map((student) => {
                      const studentClass = classes.find(
                        (c) => c.id === student.classId
                      );
                      const performance =
                        student.attendanceRate >= 95
                          ? "Excellent"
                          : student.attendanceRate >= 85
                          ? "Good"
                          : student.attendanceRate >= 75
                          ? "Average"
                          : "Poor";

                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {student.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {student.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{studentClass?.code}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {student.attendanceRate}%
                              </span>
                              <div className="w-16">
                                <Progress
                                  value={student.attendanceRate}
                                  className="h-1"
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.presentSessions}/{student.totalSessions}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {student.lastAttendance || "Never"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                performance === "Excellent"
                                  ? "border-green-200 text-green-700 bg-green-50"
                                  : performance === "Good"
                                  ? "border-blue-200 text-blue-700 bg-blue-50"
                                  : performance === "Average"
                                  ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                                  : "border-red-200 text-red-700 bg-red-50"
                              }
                            >
                              {performance}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Reports</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Summary</SelectItem>
                  <SelectItem value="students">Student Performance</SelectItem>
                  <SelectItem value="sessions">Session Details</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleExportReport("csv")}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportReport("pdf")}
                className="flex-1"
                disabled
              >
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              PDF export coming soon
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

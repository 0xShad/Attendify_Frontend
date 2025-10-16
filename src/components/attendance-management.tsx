"use client";

import React, { useState, useEffect } from "react";
import {
  IconPlay,
  IconPlayerStop,
  IconEdit,
  IconDownload,
  IconRefresh,
  IconCheck,
  IconX,
  IconClock,
  IconMapPin,
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconSearch,
} from "@tabler/icons-react";
import {
  Play,
  Square,
  Clock,
  MapPin,
  Users,
  UserCheck,
  UserX,
  Search,
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
import { useToast } from "@/hooks/use-toast";

interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "Active" | "Completed" | "Scheduled";
  presentCount: number;
  totalStudents: number;
  location?: string;
  notes?: string;
  attendanceRecords: AttendanceRecord[];
}

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: "Present" | "Absent" | "Late" | "Excused";
  timestamp?: string;
  method?: "Face Recognition" | "Manual" | "QR Code";
  notes?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
  enrollmentStatus: "Enrolled" | "Pending" | "Rejected";
}

interface Class {
  id: string;
  name: string;
  code: string;
  schedule: string;
  enrolledStudents: number;
  location?: string;
}

interface AttendanceManagementProps {
  classes: Class[];
  students: Student[];
  activeSessions: AttendanceSession[];
  onStartSession: (classId: string) => void;
  onEndSession: (sessionId: string) => void;
  onUpdateAttendance: (sessionId: string, records: AttendanceRecord[]) => void;
}

export function AttendanceManagement({
  classes,
  students,
  activeSessions,
  onStartSession,
  onEndSession,
  onUpdateAttendance,
}: AttendanceManagementProps) {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [manualAttendanceOpen, setManualAttendanceOpen] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<AttendanceSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "present" | "absent" | "late" | "excused"
  >("all");

  // Timer state for active sessions
  const [sessionTimes, setSessionTimes] = useState<{ [key: string]: number }>(
    {}
  );

  // Update session timers
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimes: { [key: string]: number } = {};
      activeSessions.forEach((session) => {
        if (session.status === "Active") {
          const startTime = new Date(`${session.date}T${session.startTime}`);
          const now = new Date();
          const diff = Math.floor(
            (now.getTime() - startTime.getTime()) / 1000 / 60
          ); // minutes
          newTimes[session.id] = Math.max(0, diff);
        }
      });
      setSessionTimes(newTimes);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [activeSessions]);

  const handleStartSession = () => {
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Please select a class first",
        variant: "destructive",
      });
      return;
    }

    onStartSession(selectedClass);
    setSelectedClass("");
    toast({
      title: "Session Started",
      description: "Attendance session has been started successfully",
    });
  };

  const handleEndSession = (sessionId: string) => {
    onEndSession(sessionId);
    toast({
      title: "Session Ended",
      description: "Attendance session has been completed",
    });
  };

  const handleOpenManualAttendance = (session: AttendanceSession) => {
    setSelectedSession(session);

    // Initialize attendance records for all enrolled students
    const classStudents = students.filter(
      (s) => s.classId === session.classId && s.enrollmentStatus === "Enrolled"
    );
    const records = classStudents.map((student) => ({
      studentId: student.id,
      studentName: student.name,
      status: "Absent" as const,
      method: "Manual" as const,
    }));

    // Merge with existing records if any
    const existingRecords = session.attendanceRecords || [];
    const mergedRecords = records.map((record) => {
      const existing = existingRecords.find(
        (r) => r.studentId === record.studentId
      );
      return existing || record;
    });

    setAttendanceRecords(mergedRecords);
    setManualAttendanceOpen(true);
  };

  const handleUpdateAttendanceRecord = (
    studentId: string,
    status: "Present" | "Absent" | "Late" | "Excused",
    notes?: string
  ) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.studentId === studentId
          ? {
              ...record,
              status,
              timestamp:
                status !== "Absent" ? new Date().toISOString() : undefined,
              notes,
            }
          : record
      )
    );
  };

  const handleSaveAttendance = () => {
    if (!selectedSession) return;

    onUpdateAttendance(selectedSession.id, attendanceRecords);
    setManualAttendanceOpen(false);
    setSelectedSession(null);

    toast({
      title: "Success",
      description: "Attendance records saved successfully",
    });
  };

  const exportAttendanceReport = (session: AttendanceSession) => {
    const records = session.attendanceRecords || [];
    const headers = [
      "Student ID",
      "Name",
      "Status",
      "Timestamp",
      "Method",
      "Notes",
    ];
    const csvContent = [
      headers.join(","),
      ...records.map((record) =>
        [
          record.studentId,
          record.studentName,
          record.status,
          record.timestamp || "",
          record.method || "",
          record.notes || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.classCode}_attendance_${session.date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Attendance report exported successfully",
    });
  };

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || record.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-700 border-green-200";
      case "Late":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Excused":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Absent":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Start Session */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Session</CardTitle>
          <CardDescription>Begin taking attendance for a class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name} ({classItem.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStartSession} disabled={!selectedClass}>
              <Play className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Currently running attendance sessions
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="bg-green-50 border-green-200 text-green-700"
            >
              {activeSessions.filter((s) => s.status === "Active").length}{" "}
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {activeSessions.filter((s) => s.status === "Active").length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No Active Sessions</h3>
              <p className="text-sm">
                Start a new session to begin taking attendance
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSessions
                .filter((s) => s.status === "Active")
                .map((session) => (
                  <div
                    key={session.id}
                    className="p-6 rounded-lg border-2 border-green-200 bg-green-50/50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">
                            {session.className}
                          </h3>
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                            Live
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Started: {session.startTime}</span>
                          <span>
                            Duration: {sessionTimes[session.id] || 0} min
                          </span>
                          {session.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenManualAttendance(session)}
                        >
                          <IconEdit className="w-4 h-4 mr-1" />
                          Manual Entry
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleEndSession(session.id)}
                        >
                          <Square className="w-4 h-4 mr-1" />
                          End Session
                        </Button>
                      </div>
                    </div>

                    {/* Real-time Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <UserCheck className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {session.presentCount}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Present
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <UserX className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-red-600">
                                {session.totalStudents - session.presentCount}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Absent
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold">
                                {session.totalStudents}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Total Students
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 rounded-lg">
                              <IconUserCheck className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold">
                                {session.totalStudents > 0
                                  ? Math.round(
                                      (session.presentCount /
                                        session.totalStudents) *
                                        100
                                    )
                                  : 0}
                                %
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Attendance Rate
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">
                          Attendance Progress
                        </span>
                        <span className="text-sm font-medium">
                          {session.presentCount}/{session.totalStudents}
                        </span>
                      </div>
                      <Progress
                        value={
                          session.totalStudents > 0
                            ? (session.presentCount / session.totalStudents) *
                              100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>
                Previously completed attendance sessions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <IconDownload className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock recent sessions - in real app, this would come from props */}
            <div className="p-4 rounded-lg border bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">
                    Introduction to Computer Science
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Oct 15, 2025 • 9:00-10:30 AM</span>
                    <span>42/45 present (93%)</span>
                    <span>Room 202</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 border-green-200 text-green-700"
                  >
                    Completed
                  </Badge>
                  <Button variant="outline" size="sm">
                    <IconDownload className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">
                    Data Structures and Algorithms
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Oct 14, 2025 • 2:00-3:30 PM</span>
                    <span>35/38 present (92%)</span>
                    <span>Room 304</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 border-green-200 text-green-700"
                  >
                    Completed
                  </Badge>
                  <Button variant="outline" size="sm">
                    <IconDownload className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Attendance Dialog */}
      <Dialog
        open={manualAttendanceOpen}
        onOpenChange={setManualAttendanceOpen}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Manual Attendance - {selectedSession?.className}
            </DialogTitle>
            <div className="text-sm text-muted-foreground">
              {selectedSession?.date} • {selectedSession?.startTime}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search and Filter */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filterStatus}
                onValueChange={(value: any) => setFilterStatus(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Attendance Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.studentId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {record.studentName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {record.studentName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {record.studentId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(record.status)}
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.timestamp
                          ? new Date(record.timestamp).toLocaleTimeString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Add notes..."
                          value={record.notes || ""}
                          onChange={(e) =>
                            handleUpdateAttendanceRecord(
                              record.studentId,
                              record.status,
                              e.target.value
                            )
                          }
                          className="w-32 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={
                              record.status === "Present"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              handleUpdateAttendanceRecord(
                                record.studentId,
                                "Present"
                              )
                            }
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              record.status === "Late" ? "default" : "outline"
                            }
                            onClick={() =>
                              handleUpdateAttendanceRecord(
                                record.studentId,
                                "Late"
                              )
                            }
                          >
                            Late
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              record.status === "Excused"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              handleUpdateAttendanceRecord(
                                record.studentId,
                                "Excused"
                              )
                            }
                          >
                            Excused
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              record.status === "Absent"
                                ? "destructive"
                                : "outline"
                            }
                            onClick={() =>
                              handleUpdateAttendanceRecord(
                                record.studentId,
                                "Absent"
                              )
                            }
                          >
                            Absent
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Total: {attendanceRecords.length} students • Present:{" "}
                {attendanceRecords.filter((r) => r.status === "Present").length}{" "}
                • Late:{" "}
                {attendanceRecords.filter((r) => r.status === "Late").length} •
                Excused:{" "}
                {attendanceRecords.filter((r) => r.status === "Excused").length}{" "}
                • Absent:{" "}
                {attendanceRecords.filter((r) => r.status === "Absent").length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setManualAttendanceOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAttendance}>Save Attendance</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

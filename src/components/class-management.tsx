"use client";

import React, { useState } from "react";
import {
  IconUsers,
  IconEdit,
  IconTrash,
  IconPlus,
  IconDownload,
  IconEye,
  IconCheck,
  IconX,
  IconClock,
  IconMapPin,
  IconSettings,
  IconChevronDown,
} from "@tabler/icons-react";
import { Users, Clock, MapPin, Settings, ChevronDown } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentStatus: "Enrolled" | "Pending" | "Rejected";
  attendanceRate: number;
  totalSessions: number;
  presentSessions: number;
  lastAttendance?: string;
  enrollmentDate: string;
}

interface Class {
  id: string;
  name: string;
  code: string;
  schedule: string;
  mode: "Online" | "In-Person" | "Hybrid";
  enrolledStudents: number;
  totalSessions: number;
  completedSessions: number;
  attendanceRate: number;
  status: "Active" | "Inactive" | "Scheduled";
  location?: string;
  description?: string;
  cutoffTime?: number;
  locationRadius?: number;
  maxEnrollment?: number;
}

interface ClassManagementProps {
  classData: Class;
  students: Student[];
  onUpdateClass: (classData: Class) => void;
  onUpdateStudents: (students: Student[]) => void;
}

export function ClassManagement({
  classData,
  students,
  onUpdateClass,
  onUpdateStudents,
}: ClassManagementProps) {
  const { toast } = useToast();
  const [editClassOpen, setEditClassOpen] = useState(false);
  const [enrollStudentOpen, setEnrollStudentOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Edit form states
  const [editedClass, setEditedClass] = useState<Class>(classData);

  // Student enrollment form
  const [studentEmail, setStudentEmail] = useState("");
  const [studentName, setStudentName] = useState("");

  const classStudents = students.filter((s) => s.classId === classData.id);
  const pendingStudents = classStudents.filter(
    (s) => s.enrollmentStatus === "Pending"
  );
  const enrolledStudents = classStudents.filter(
    (s) => s.enrollmentStatus === "Enrolled"
  );

  const handleSaveClass = () => {
    onUpdateClass(editedClass);
    setEditClassOpen(false);
    toast({
      title: "Success",
      description: "Class updated successfully",
    });
  };

  const handleEnrollStudent = () => {
    if (!studentEmail || !studentName) {
      toast({
        title: "Error",
        description: "Email and name are required",
        variant: "destructive",
      });
      return;
    }

    const newStudent: Student = {
      id: `S${Date.now()}`,
      name: studentName,
      email: studentEmail,
      classId: classData.id,
      enrollmentStatus: "Enrolled",
      attendanceRate: 0,
      totalSessions: 0,
      presentSessions: 0,
      enrollmentDate: new Date().toISOString().split("T")[0],
    };

    onUpdateStudents([...students, newStudent]);
    setEnrollStudentOpen(false);
    setStudentEmail("");
    setStudentName("");

    toast({
      title: "Success",
      description: "Student enrolled successfully",
    });
  };

  const handleEnrollmentDecision = (
    studentId: string,
    decision: "approve" | "reject"
  ) => {
    const updatedStudents = students.map((student) =>
      student.id === studentId
        ? {
            ...student,
            enrollmentStatus:
              decision === "approve"
                ? ("Enrolled" as const)
                : ("Rejected" as const),
          }
        : student
    );

    onUpdateStudents(updatedStudents);

    toast({
      title: "Success",
      description: `Student ${
        decision === "approve" ? "approved" : "rejected"
      } successfully`,
    });
  };

  const handleRemoveStudent = (studentId: string) => {
    const updatedStudents = students.filter(
      (student) => student.id !== studentId
    );
    onUpdateStudents(updatedStudents);

    toast({
      title: "Success",
      description: "Student removed from class",
    });
  };

  const handleExportStudentList = () => {
    // Create CSV content
    const headers = [
      "Name",
      "Email",
      "Status",
      "Attendance Rate",
      "Total Sessions",
      "Present Sessions",
      "Last Attendance",
    ];
    const csvContent = [
      headers.join(","),
      ...classStudents.map((student) =>
        [
          student.name,
          student.email,
          student.enrollmentStatus,
          `${student.attendanceRate}%`,
          student.totalSessions,
          student.presentSessions,
          student.lastAttendance || "Never",
        ].join(",")
      ),
    ].join("\n");

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${classData.code}_students.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Student list exported successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl">{classData.name}</CardTitle>
              <CardDescription className="text-base mt-1">
                {classData.code} • {classData.schedule}
              </CardDescription>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {enrolledStudents.length} enrolled
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {classData.mode}
                </div>
                {classData.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {classData.location}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  classData.status === "Active"
                    ? "border-green-200 text-green-700 bg-green-50"
                    : "border-gray-200 text-gray-700 bg-gray-50"
                }
              >
                {classData.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditClassOpen(true)}>
                    <IconEdit className="w-4 h-4 mr-2" />
                    Edit Class
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <IconSettings className="w-4 h-4 mr-2" />
                    Class Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportStudentList}>
                    <IconDownload className="w-4 h-4 mr-2" />
                    Export Student List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {enrolledStudents.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Enrolled</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {pendingStudents.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {classData.attendanceRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg. Attendance
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {classData.completedSessions}/{classData.totalSessions}
                  </div>
                  <div className="text-sm text-muted-foreground">Sessions</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Pending Enrollment Requests */}
      {pendingStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Pending Enrollment Requests
            </CardTitle>
            <CardDescription>
              Review and approve student enrollment requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-yellow-50/50 border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-yellow-100 text-yellow-700">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Requested: {student.enrollmentDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleEnrollmentDecision(student.id, "approve")
                      }
                    >
                      <IconCheck className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleEnrollmentDecision(student.id, "reject")
                      }
                    >
                      <IconX className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enrolled Students */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Enrolled Students</CardTitle>
              <CardDescription>
                Manage student enrollment and view attendance records
              </CardDescription>
            </div>
            <Button onClick={() => setEnrollStudentOpen(true)}>
              <IconPlus className="w-4 h-4 mr-2" />
              Enroll Student
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Attendance Rate</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Last Attendance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolledStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {student.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{student.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">
                        {student.attendanceRate}%
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          student.attendanceRate >= 90
                            ? "bg-green-500"
                            : student.attendanceRate >= 75
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {student.presentSessions}/{student.totalSessions}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.lastAttendance || "Never"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <IconEye className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <IconEye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconEdit className="w-4 h-4 mr-2" />
                          Edit Student
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleRemoveStudent(student.id)}
                        >
                          <IconTrash className="w-4 h-4 mr-2" />
                          Remove from Class
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Class Dialog */}
      <Dialog open={editClassOpen} onOpenChange={setEditClassOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-class-name">Class Name</Label>
              <Input
                id="edit-class-name"
                value={editedClass.name}
                onChange={(e) =>
                  setEditedClass((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-class-code">Class Code</Label>
              <Input
                id="edit-class-code"
                value={editedClass.code}
                onChange={(e) =>
                  setEditedClass((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-schedule">Schedule</Label>
              <Input
                id="edit-schedule"
                value={editedClass.schedule}
                onChange={(e) =>
                  setEditedClass((prev) => ({
                    ...prev,
                    schedule: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-mode">Mode</Label>
              <Select
                value={editedClass.mode}
                onValueChange={(value: "Online" | "In-Person" | "Hybrid") =>
                  setEditedClass((prev) => ({ ...prev, mode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In-Person">In-Person</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editedClass.location || ""}
                onChange={(e) =>
                  setEditedClass((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editedClass.description || ""}
                onChange={(e) =>
                  setEditedClass((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveClass} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditClassOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enroll Student Dialog */}
      <Dialog open={enrollStudentOpen} onOpenChange={setEnrollStudentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll New Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-name">Student Name</Label>
              <Input
                id="student-name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter student's full name"
              />
            </div>
            <div>
              <Label htmlFor="student-email">Email Address</Label>
              <Input
                id="student-email"
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="student@email.com"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEnrollStudent} className="flex-1">
                <IconPlus className="w-4 h-4 mr-2" />
                Enroll Student
              </Button>
              <Button
                variant="outline"
                onClick={() => setEnrollStudentOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Class Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Class Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cutoff-time">
                Attendance Cutoff Time (minutes)
              </Label>
              <Input
                id="cutoff-time"
                type="number"
                value={editedClass.cutoffTime || 10}
                onChange={(e) =>
                  setEditedClass((prev) => ({
                    ...prev,
                    cutoffTime: parseInt(e.target.value),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Students must arrive within this time to be marked present
              </p>
            </div>
            <div>
              <Label htmlFor="location-radius">Location Radius (meters)</Label>
              <Input
                id="location-radius"
                type="number"
                value={editedClass.locationRadius || 50}
                onChange={(e) =>
                  setEditedClass((prev) => ({
                    ...prev,
                    locationRadius: parseInt(e.target.value),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required proximity for location-based attendance
              </p>
            </div>
            <div>
              <Label htmlFor="max-enrollment">Maximum Enrollment</Label>
              <Input
                id="max-enrollment"
                type="number"
                value={editedClass.maxEnrollment || ""}
                onChange={(e) =>
                  setEditedClass((prev) => ({
                    ...prev,
                    maxEnrollment: parseInt(e.target.value),
                  }))
                }
                placeholder="No limit"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveClass} className="flex-1">
                Save Settings
              </Button>
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

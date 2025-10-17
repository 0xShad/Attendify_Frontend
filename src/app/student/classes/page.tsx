"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Video,
  Wifi,
  WifiOff,
  Eye,
  UserCheck,
  Megaphone,
  ChevronRight,
  Settings,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Users,
  Camera,
  Play,
  MoreVertical,
  BookOpen,
  Star,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";

export default function StudentClasses() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classDetailsOpen, setClassDetailsOpen] = useState(false);

  // Mock data
  const enrolledClasses = [
    {
      id: "CS101",
      name: "Introduction to Computer Science",
      code: "CS101",
      instructor: "Dr. Sarah Johnson",
      instructorAvatar: "/avatars/instructor1.jpg",
      schedule: "Mon, Wed, Fri 9:00 AM",
      mode: "Hybrid",
      location: "Room 202 / Online",
      nextSession: new Date("2025-10-17T09:00:00"),
      attendanceRate: 92.5,
      totalSessions: 32,
      attendedSessions: 30,
      status: "Active",
      credits: 3,
      semester: "Fall 2024",
      description:
        "An introduction to the fundamental concepts of computer science including programming, algorithms, and data structures.",
      syllabus: "/documents/cs101-syllabus.pdf",
      announcements: 5,
      assignments: 8,
      grade: "A-",
    },
    {
      id: "MATH201",
      name: "Calculus II",
      code: "MATH201",
      instructor: "Prof. Michael Chen",
      instructorAvatar: "/avatars/instructor2.jpg",
      schedule: "Tue, Thu 2:00 PM",
      mode: "In-Person",
      location: "Math Building 104",
      nextSession: new Date("2025-10-17T14:00:00"),
      attendanceRate: 88.0,
      totalSessions: 28,
      attendedSessions: 25,
      status: "Active",
      credits: 4,
      semester: "Fall 2024",
      description:
        "Continuation of Calculus I covering integration techniques, applications of integrals, and infinite series.",
      syllabus: "/documents/math201-syllabus.pdf",
      announcements: 3,
      assignments: 6,
      grade: "B+",
    },
    {
      id: "ENG102",
      name: "English Composition",
      code: "ENG102",
      instructor: "Dr. Emily Rodriguez",
      instructorAvatar: "/avatars/instructor3.jpg",
      schedule: "Mon, Wed 11:00 AM",
      mode: "Online",
      nextSession: new Date("2025-10-17T11:00:00"),
      attendanceRate: 96.0,
      totalSessions: 24,
      attendedSessions: 23,
      status: "Active",
      credits: 3,
      semester: "Fall 2024",
      description:
        "Development of writing skills through various forms of composition and critical analysis.",
      syllabus: "/documents/eng102-syllabus.pdf",
      announcements: 7,
      assignments: 12,
      grade: "A",
    },
  ];

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

  // Filter classes based on search
  const filteredClasses = enrolledClasses.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (classItem: any) => {
    setSelectedClass(classItem);
    setClassDetailsOpen(true);
  };

  const handleDropClass = (classId: string) => {
    toast({
      title: "Drop Request Sent",
      description:
        "Your request to drop the class has been submitted for review.",
      variant: "default",
    });
  };

  const getNextSessionTime = (nextSession: Date) => {
    const now = new Date();
    const timeDiff = nextSession.getTime() - now.getTime();

    if (timeDiff < 0) return "Session ended";

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) return `in ${minutes}m`;
    if (hours < 24) return `in ${hours}h ${minutes}m`;

    return nextSession.toLocaleDateString();
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "Online":
        return <Wifi className="w-4 h-4" />;
      case "In-Person":
        return <MapPin className="w-4 h-4" />;
      case "Hybrid":
        return <Video className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "Online":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "In-Person":
        return "bg-green-100 text-green-700 border-green-200";
      case "Hybrid":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Classes</h1>
            <p className="text-muted-foreground">
              Manage your enrolled classes and view schedules
            </p>
          </div>
          <Link href="/student/classes/join">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Join New Class
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="enrolled" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enrolled">Enrolled Classes</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="space-y-4">
          {/* Classes Grid - Mobile First */}
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No classes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "You haven't enrolled in any classes yet"}
              </p>
              <Link href="/student/classes/join">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Join Your First Class
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredClasses.map((classItem) => (
                <Card
                  key={classItem.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2">
                          {classItem.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {classItem.code} • {classItem.credits} credits
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(classItem)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Megaphone className="w-4 h-4 mr-2" />
                            Announcements
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Attendance History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Class Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDropClass(classItem.id)}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Drop Class
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Instructor */}
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={classItem.instructorAvatar} />
                        <AvatarFallback>
                          {classItem.instructor
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {classItem.instructor}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Instructor
                        </p>
                      </div>
                    </div>

                    {/* Class Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{classItem.schedule}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        {getModeIcon(classItem.mode)}
                        <span className="truncate">{classItem.location}</span>
                        <Badge
                          variant="outline"
                          className={getModeColor(classItem.mode)}
                        >
                          {classItem.mode}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          Next: {getNextSessionTime(classItem.nextSession)}
                        </span>
                      </div>
                    </div>

                    {/* Attendance Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Attendance</span>
                        <span className="font-medium">
                          {classItem.attendedSessions}/{classItem.totalSessions}
                        </span>
                      </div>
                      <Progress
                        value={classItem.attendanceRate}
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{classItem.attendanceRate}%</span>
                        <span
                          className={
                            classItem.attendanceRate >= 90
                              ? "text-green-600"
                              : classItem.attendanceRate >= 75
                              ? "text-yellow-600"
                              : "text-red-600"
                          }
                        >
                          {classItem.attendanceRate >= 90
                            ? "Excellent"
                            : classItem.attendanceRate >= 75
                            ? "Good"
                            : "At Risk"}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {classItem.announcements}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Announcements
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {classItem.assignments}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Assignments
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {classItem.grade}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Grade
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button
                      onClick={() => handleViewDetails(classItem)}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent interactions across all classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                  >
                    <div
                      className={`p-2 rounded-full bg-white ${activity.color}`}
                    >
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Class Details Drawer */}
      <Drawer open={classDetailsOpen} onOpenChange={setClassDetailsOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{selectedClass?.name}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {selectedClass && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Course Code
                  </label>
                  <p className="text-lg font-semibold">{selectedClass.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Credits
                  </label>
                  <p className="text-lg font-semibold">
                    {selectedClass.credits}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Semester
                  </label>
                  <p className="text-lg font-semibold">
                    {selectedClass.semester}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Grade
                  </label>
                  <p className="text-lg font-semibold text-green-600">
                    {selectedClass.grade}
                  </p>
                </div>
              </div>

              {/* Instructor */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Instructor
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedClass.instructorAvatar} />
                    <AvatarFallback>
                      {selectedClass.instructor
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedClass.instructor}</p>
                    <p className="text-sm text-muted-foreground">Professor</p>
                  </div>
                </div>
              </div>

              {/* Schedule & Location */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Schedule & Location
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedClass.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getModeIcon(selectedClass.mode)}
                    <span>{selectedClass.location}</span>
                    <Badge
                      variant="outline"
                      className={getModeColor(selectedClass.mode)}
                    >
                      {selectedClass.mode}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="mt-2 text-sm">{selectedClass.description}</p>
              </div>

              {/* Attendance Stats */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Attendance Statistics
                </label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Sessions Attended</span>
                    <span className="font-medium">
                      {selectedClass.attendedSessions} /{" "}
                      {selectedClass.totalSessions}
                    </span>
                  </div>
                  <Progress
                    value={selectedClass.attendanceRate}
                    className="h-3"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span>{selectedClass.attendanceRate}% Attendance Rate</span>
                    <Badge
                      className={
                        selectedClass.attendanceRate >= 90
                          ? "bg-green-100 text-green-700 border-green-200"
                          : selectedClass.attendanceRate >= 75
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      }
                    >
                      {selectedClass.attendanceRate >= 90
                        ? "Excellent"
                        : selectedClass.attendanceRate >= 75
                        ? "Good"
                        : "At Risk"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Megaphone className="w-4 h-4 mr-2" />
                  View Announcements
                </Button>
                <Button variant="outline" size="sm">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Attendance History
                </Button>
                <Button variant="outline" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Course Materials
                </Button>
              </div>
            </div>
          )}
          </div>
          <DrawerFooter className="px-4 pb-4">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

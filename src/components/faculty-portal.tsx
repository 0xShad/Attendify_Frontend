"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  IconHome,
  IconUsers,
  IconFileText,
  IconList,
  IconSettings,
  IconPlus,
  IconCheck,
  IconLoader2,
  IconX,
  IconChartBar,
  IconBell,
  IconSearch,
  IconCalendar,
  IconTrendingUp,
  IconTrendingDown,
  IconEye,
  IconEdit,
  IconTrash,
  IconDownload,
  IconFilter,
  IconRefresh,
  IconMenu2,
  IconChevronRight,
  IconChevronDown,
  IconDots,
  IconLogout,
  IconCreditCard,
  IconNotification,
  IconUserCheck,
  IconClockHour4,
  IconSchool,
  IconUser,
  IconBook,
  IconChalkboard,
  IconClock,
  IconSpeakerphone,
  IconPlaystationCircle,
  IconPlayerPlay,
  IconPlayerStop,
} from "@tabler/icons-react";
import {
  Trash2,
  Eye,
  Edit,
  User,
  Users,
  Book,
  Clock,
  MessageSquare,
  Play,
  Square,
  CheckCircle,
  MoreVertical,
  UserPlus,
  Settings,
  Download,
  Send,
  X,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
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
  ResponsiveContainer,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
  cutoffTime?: number; // minutes before class
  locationRadius?: number; // meters for location-based attendance
}

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
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
  location?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  classIds: string[];
  createdDate: string;
  priority: "Low" | "Medium" | "High";
  status: "Draft" | "Published";
}

// Notification dropdown with glassy styling
function NotificationMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <IconBell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-stone-50/70 supports-[backdrop-filter]:backdrop-blur-md border shadow-lg">
        <div className="p-2">
          <div className="text-sm font-medium">Notifications</div>
          <div className="mt-2 space-y-2">
            <div className="text-sm text-muted-foreground">
              CS101 session starting in 15 minutes
            </div>
            <div className="text-sm text-muted-foreground">
              New student enrollment request
            </div>
            <div className="text-sm text-muted-foreground">
              Attendance report ready for export
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Separate component for sidebar user menu that can use useSidebar hook
function SidebarUserMenu({
  setSettingsOpen,
}: {
  setSettingsOpen: (open: boolean) => void;
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarFallback className="rounded-lg bg-green-500 text-white">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Dr. Sarah Johnson</span>
                <span className="text-muted-foreground truncate text-xs">
                  faculty@attendify.com
                </span>
              </div>
              <IconDots className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-green-500 text-white">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    Dr. Sarah Johnson
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    faculty@attendify.com
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <IconSettings className="w-4 h-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <IconLogout className="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function FacultyPortal() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Navigation - check URL params for initial tab
  const initialTab =
    (searchParams?.get("tab") as
      | "dashboard"
      | "classes"
      | "attendance"
      | "reports"
      | "announcements") || "dashboard";
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "classes" | "attendance" | "reports" | "announcements"
  >(initialTab);

  // Update tab from URL params
  useEffect(() => {
    const tabParam = searchParams?.get("tab") as
      | "dashboard"
      | "classes"
      | "attendance"
      | "reports"
      | "announcements";
    if (
      tabParam &&
      [
        "dashboard",
        "classes",
        "attendance",
        "reports",
        "announcements",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Sheet and Drawer states
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addAnnouncementOpen, setAddAnnouncementOpen] = useState(false);
  const [startSessionOpen, setStartSessionOpen] = useState(false);
  const [manualAttendanceOpen, setManualAttendanceOpen] = useState(false);
  const [viewClassOpen, setViewClassOpen] = useState(false);
  const [editClassOpen, setEditClassOpen] = useState(false);
  const [enrollStudentOpen, setEnrollStudentOpen] = useState(false);
  const [viewStudentOpen, setViewStudentOpen] = useState(false);
  const [viewSessionOpen, setViewSessionOpen] = useState(false);
  const [viewAnnouncementOpen, setViewAnnouncementOpen] = useState(false);
  const [editAnnouncementOpen, setEditAnnouncementOpen] = useState(false);

  // Selected items for viewing/editing
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSession, setSelectedSession] =
    useState<AttendanceSession | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [addingClass, setAddingClass] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  // Form states
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassSchedule, setNewClassSchedule] = useState("");
  const [newClassMode, setNewClassMode] = useState<
    "Online" | "In-Person" | "Hybrid"
  >("In-Person");
  const [newClassLocation, setNewClassLocation] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");

  // Announcement form
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementPriority, setAnnouncementPriority] = useState<
    "Low" | "Medium" | "High"
  >("Medium");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Mock data
  const [classes, setClasses] = useState<Class[]>([
    {
      id: "CS101",
      name: "Introduction to Computer Science",
      code: "CS101",
      schedule: "Mon, Wed, Fri 9:00 AM",
      mode: "In-Person",
      enrolledStudents: 45,
      totalSessions: 48,
      completedSessions: 32,
      attendanceRate: 92.5,
      status: "Active",
      location: "Room 202",
      cutoffTime: 10,
      locationRadius: 50,
    },
    {
      id: "CS201",
      name: "Data Structures and Algorithms",
      code: "CS201",
      schedule: "Tue, Thu 2:00 PM",
      mode: "Hybrid",
      enrolledStudents: 38,
      totalSessions: 32,
      completedSessions: 20,
      attendanceRate: 88.7,
      status: "Active",
      location: "Room 304 / Online",
      cutoffTime: 15,
    },
    {
      id: "CS301",
      name: "Database Management Systems",
      code: "CS301",
      schedule: "Mon, Wed 11:00 AM",
      mode: "Online",
      enrolledStudents: 52,
      totalSessions: 30,
      completedSessions: 18,
      attendanceRate: 95.2,
      status: "Active",
    },
  ]);

  const [students, setStudents] = useState<Student[]>([
    {
      id: "S001",
      name: "Alice Cooper",
      email: "alice.cooper@student.edu",
      studentId: "ST001",
      classId: "CS101",
      enrollmentStatus: "Enrolled",
      attendanceRate: 95.2,
      totalSessions: 32,
      presentSessions: 30,
      lastAttendance: "2025-10-15",
    },
    {
      id: "S002",
      name: "Bob Wilson",
      email: "bob.wilson@student.edu",
      studentId: "ST002",
      classId: "CS101",
      enrollmentStatus: "Enrolled",
      attendanceRate: 87.5,
      totalSessions: 32,
      presentSessions: 28,
      lastAttendance: "2025-10-14",
    },
    {
      id: "S003",
      name: "Carol Smith",
      email: "carol.smith@student.edu",
      studentId: "ST003",
      classId: "CS101",
      enrollmentStatus: "Pending",
      attendanceRate: 0,
      totalSessions: 0,
      presentSessions: 0,
    },
  ]);

  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([
    {
      id: "SESSION001",
      classId: "CS101",
      className: "Introduction to Computer Science",
      date: "2025-10-16",
      startTime: "09:00",
      endTime: "10:30",
      status: "Active",
      presentCount: 42,
      totalStudents: 45,
      location: "Room 202",
    },
  ]);

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: "ANN001",
      title: "Midterm Exam Schedule",
      content:
        "The midterm examinations will be held next week. Please check your individual schedules.",
      classIds: ["CS101", "CS201"],
      createdDate: "2025-10-15",
      priority: "High",
      status: "Published",
    },
    {
      id: "ANN002",
      title: "Assignment Due Reminder",
      content: "Don't forget that Assignment 3 is due this Friday at 11:59 PM.",
      classIds: ["CS101"],
      createdDate: "2025-10-14",
      priority: "Medium",
      status: "Published",
    },
  ]);

  // Navigation items
  const navigationItems = [
    { id: "dashboard", icon: IconHome, label: "Dashboard" },
    { id: "classes", icon: IconBook, label: "My Classes" },
    { id: "attendance", icon: IconUserCheck, label: "Attendance" },
    { id: "reports", icon: IconFileText, label: "Reports" },
    { id: "announcements", icon: IconSpeakerphone, label: "Announcements" },
  ];

  // Dashboard metrics
  const metricCards = useMemo(
    () => [
      {
        title: "Total Classes",
        value: classes.length.toString(),
        change: "+1",
        trend: "up",
        icon: IconBook,
        color: "bg-blue-500",
      },
      {
        title: "Total Students",
        value: classes
          .reduce((sum, cls) => sum + cls.enrolledStudents, 0)
          .toString(),
        change: "+8",
        trend: "up",
        icon: IconUsers,
        color: "bg-green-500",
      },
      {
        title: "Avg. Attendance",
        value: `${(
          classes.reduce((sum, cls) => sum + cls.attendanceRate, 0) /
          classes.length
        ).toFixed(1)}%`,
        change: "+2.3%",
        trend: "up",
        icon: IconUserCheck,
        color: "bg-violet-500",
      },
      {
        title: "Active Sessions",
        value: activeSessions.length.toString(),
        change: "0",
        trend: "neutral",
        icon: IconClock,
        color: "bg-orange-500",
      },
    ],
    [classes, activeSessions]
  );

  // Handlers
  const handleAddClass = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newClassName || !newClassCode) {
      toast({
        title: "Error",
        description: "Class name and code are required",
        variant: "destructive",
      });
      return;
    }

    setAddingClass(true);
    await new Promise((r) => setTimeout(r, 800));

    const newClass: Class = {
      id: newClassCode,
      name: newClassName,
      code: newClassCode,
      schedule: newClassSchedule,
      mode: newClassMode,
      enrolledStudents: 0,
      totalSessions: 0,
      completedSessions: 0,
      attendanceRate: 0,
      status: "Active",
      location: newClassLocation,
      description: newClassDescription,
      cutoffTime: 10,
      locationRadius: 50,
    };

    setClasses((prev) => [newClass, ...prev]);
    setAddingClass(false);
    setAddClassOpen(false);

    // Reset form
    setNewClassName("");
    setNewClassCode("");
    setNewClassSchedule("");
    setNewClassMode("In-Person");
    setNewClassLocation("");
    setNewClassDescription("");

    toast({
      title: "Success",
      description: "Class created successfully",
    });
  };

  const handleStartSession = (classId: string) => {
    const classData = classes.find((c) => c.id === classId);
    if (!classData) return;

    const newSession: AttendanceSession = {
      id: `SESSION${Date.now()}`,
      classId,
      className: classData.name,
      date: new Date().toISOString().split("T")[0],
      startTime: new Date().toTimeString().slice(0, 5),
      endTime: "",
      status: "Active",
      presentCount: 0,
      totalStudents: classData.enrolledStudents,
      location: classData.location,
    };

    setActiveSessions((prev) => [...prev, newSession]);
    toast({
      title: "Session Started",
      description: `Attendance session for ${classData.name} has been started`,
    });
  };

  const handleEndSession = (sessionId: string) => {
    setActiveSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              status: "Completed" as const,
              endTime: new Date().toTimeString().slice(0, 5),
            }
          : session
      )
    );
    toast({
      title: "Session Ended",
      description: "Attendance session has been ended",
    });
  };

  const handleAddAnnouncement = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!announcementTitle || !announcementContent) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    const newAnnouncement: Announcement = {
      id: `ANN${Date.now()}`,
      title: announcementTitle,
      content: announcementContent,
      classIds: selectedClasses,
      createdDate: new Date().toISOString().split("T")[0],
      priority: announcementPriority,
      status: "Published",
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);
    setAddAnnouncementOpen(false);

    // Reset form
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementPriority("Medium");
    setSelectedClasses([]);

    toast({
      title: "Success",
      description: "Announcement published successfully",
    });
  };

  const handleExportReport = (type: string) => {
    toast({
      title: "Export Started",
      description: `${type} report is being prepared for download`,
    });
  };

  React.useEffect(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Shadcn Sidebar */}
        <Sidebar
          variant="sidebar"
          className="border-r border-border bg-stone-50/60 supports-[backdrop-filter]:backdrop-blur-md shadow-lg flex flex-col min-h-screen relative z-50"
        >
          {/* Sidebar Header with Logo */}
          <SidebarHeader className="px-4 py-6 border-b">
            <div className="flex items-center gap-3">
              <Image
                src="/logo_blue.png"
                alt="Attendify Logo"
                width={48}
                height={48}
                className="flex-shrink-0"
              />
              <div className="group-data-[collapsible=icon]:hidden">
                <span className="font-bold text-lg block">Attendify</span>
                <span className="text-xs text-muted-foreground">
                  Faculty Portal
                </span>
              </div>
            </div>
          </SidebarHeader>

          {/* Navigation Content */}
          <SidebarContent className="px-4 flex-1 overflow-y-auto min-h-0">
            <SidebarGroup className="py-4">
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeTab === item.id}
                        onClick={() =>
                          setActiveTab(
                            item.id as
                              | "dashboard"
                              | "classes"
                              | "attendance"
                              | "reports"
                              | "announcements"
                          )
                        }
                        className="w-full justify-start"
                        size="lg"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Sidebar Footer */}
          <SidebarFooter>
            <SidebarUserMenu setSettingsOpen={setSettingsOpen} />
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className="flex-1 overflow-x-hidden">
          {/* Top Header */}
          <header className="sticky top-0 z-40 border-b bg-stone-50/98 backdrop-blur-xl supports-[backdrop-filter]:bg-stone-50/95 shadow-lg transition-all duration-300">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <div className="flex items-center gap-2 md:hidden">
                  <Image
                    src="/logo_blue.png"
                    alt="Attendify Logo"
                    width={24}
                    height={24}
                    className="flex-shrink-0"
                  />
                  <span className="font-semibold">Attendify</span>
                </div>

                <div className="hidden md:flex md:items-center md:gap-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/logo_blue.png"
                      alt="Attendify Logo"
                      width={40}
                      height={40}
                      className="flex-shrink-0"
                    />
                    <div>
                      <h2 className="text-2xl font-bold capitalize">
                        {activeTab}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {activeTab === "dashboard" &&
                          "Overview of your classes and activities"}
                        {activeTab === "classes" &&
                          "Create and manage your classes"}
                        {activeTab === "attendance" &&
                          "Monitor and manage attendance sessions"}
                        {activeTab === "reports" &&
                          "View attendance reports and analytics"}
                        {activeTab === "announcements" &&
                          "Communicate with your students"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <NotificationMenu />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 md:p-6 space-y-4 md:space-y-6 safe-area-bottom relative">
            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div className="space-y-4 md:space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="animate-pulse h-32 bg-stone-200 rounded-lg"
                        />
                      ))}
                    </div>
                    <div className="animate-pulse h-64 bg-stone-200 rounded-lg" />
                  </div>
                ) : (
                  <>
                    {/* Dashboard Metrics Cards */}
                    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
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
                                  <IconTrendingUp className="w-3 h-3" />
                                )}
                                {metric.trend === "down" && (
                                  <IconTrendingDown className="w-3 h-3" />
                                )}
                                {metric.change}
                              </Badge>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>

                    {/* Quick Actions and Active Sessions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                      {/* Quick Actions */}
                      <Card className="border shadow-sm bg-stone-50/40 supports-[backdrop-filter]:backdrop-blur-md border-stone-200/50">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg">
                            Quick Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button
                            onClick={() => setAddClassOpen(true)}
                            className="w-full justify-start"
                            variant="outline"
                          >
                            <IconPlus className="w-4 h-4 mr-2" />
                            Create New Class
                          </Button>
                          <Button
                            onClick={() => setAddAnnouncementOpen(true)}
                            className="w-full justify-start"
                            variant="outline"
                          >
                            <IconSpeakerphone className="w-4 h-4 mr-2" />
                            New Announcement
                          </Button>
                          <Button
                            onClick={() =>
                              handleExportReport("Attendance Summary")
                            }
                            className="w-full justify-start"
                            variant="outline"
                          >
                            <IconDownload className="w-4 h-4 mr-2" />
                            Export Reports
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Active Sessions */}
                      <Card className="lg:col-span-2 border shadow-sm bg-stone-50/40 supports-[backdrop-filter]:backdrop-blur-md border-stone-200/50">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg">
                            Active Sessions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {activeSessions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <IconClockHour4 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No active sessions</p>
                              <p className="text-sm">
                                Start an attendance session to monitor real-time
                                attendance
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {activeSessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="flex items-center justify-between p-4 rounded-lg bg-stone-100/30 border"
                                >
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">
                                      {session.className}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {session.presentCount}/
                                      {session.totalStudents} present
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Started: {session.startTime} •{" "}
                                      {session.location}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                      Active
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handleEndSession(session.id)
                                      }
                                    >
                                      <Square className="w-3 h-3 mr-1" />
                                      End
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Classes Overview */}
                    <Card className="border shadow-sm bg-stone-50/40 supports-[backdrop-filter]:backdrop-blur-md border-stone-200/50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Your Classes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {classes.slice(0, 6).map((classItem) => (
                            <div
                              key={classItem.id}
                              className="p-4 rounded-lg bg-white/50 border border-stone-200/50 hover:bg-white/70 transition-colors cursor-pointer"
                              onClick={() => setActiveTab("classes")}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">
                                    {classItem.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {classItem.code}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={
                                    classItem.status === "Active"
                                      ? "border-green-200 text-green-700 bg-green-50"
                                      : "border-gray-200 text-gray-700 bg-gray-50"
                                  }
                                >
                                  {classItem.status}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm">
                                <p className="text-muted-foreground">
                                  <Users className="w-3 h-3 inline mr-1" />
                                  {classItem.enrolledStudents} students
                                </p>
                                <p className="text-muted-foreground">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {classItem.schedule}
                                </p>
                                <p className="text-muted-foreground">
                                  Attendance: {classItem.attendanceRate}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* Classes Management */}
            {activeTab === "classes" && (
              <div className="space-y-4">
                {/* Header with Add Class Button */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">My Classes</h3>
                      <p className="text-sm text-muted-foreground">
                        Create and manage your classes, schedules, and
                        enrollment
                      </p>
                    </div>
                    <Button onClick={() => setAddClassOpen(true)} size="sm">
                      <IconPlus className="w-4 h-4 mr-2" />
                      Add Class
                    </Button>
                  </div>
                </div>

                {/* Mobile-First Classes List */}
                <div className="space-y-4">
                  {classes.map((classItem) => (
                    <Card key={classItem.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        {/* Class Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base truncate">
                              {classItem.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {classItem.code} • {classItem.mode}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                classItem.status === "Active"
                                  ? "border-green-200 text-green-700 bg-green-50"
                                  : "border-gray-200 text-gray-700 bg-gray-50"
                              }
                            >
                              {classItem.status}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClass(classItem);
                                    setViewClassOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClass(classItem);
                                    setEditClassOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Class
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClass(classItem);
                                    setEnrollStudentOpen(true);
                                  }}
                                >
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Enroll Student
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStartSession(classItem.id)
                                  }
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Start Session
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Class
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Class Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">
                              {classItem.schedule}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{classItem.enrolledStudents} students</span>
                          </div>
                          {classItem.location && (
                            <div className="flex items-center gap-2 col-span-2">
                              <IconChalkboard className="w-4 h-4 text-muted-foreground" />
                              <span className="truncate">
                                {classItem.location}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Progress Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              Sessions: {classItem.completedSessions}/
                              {classItem.totalSessions}
                            </span>
                            <span className="font-medium">
                              Attendance: {classItem.attendanceRate}%
                            </span>
                          </div>
                          <Progress
                            value={
                              (classItem.completedSessions /
                                classItem.totalSessions) *
                              100
                            }
                            className="h-2"
                          />
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => handleStartSession(classItem.id)}
                            className="flex-1"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start Session
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedClass(classItem);
                              setViewClassOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance Management */}
            {activeTab === "attendance" && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">
                      Attendance Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor sessions, mark attendance, and manage real-time
                      attendance
                    </p>
                  </div>
                  <Button
                    onClick={() => setManualAttendanceOpen(true)}
                    variant="outline"
                  >
                    <IconEdit className="w-4 h-4 mr-2" />
                    Manual Attendance
                  </Button>
                </div>

                {/* Active Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>
                      Sessions currently accepting attendance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeSessions.filter((s) => s.status === "Active")
                      .length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <IconClockHour4 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No active sessions</p>
                        <p className="text-sm">
                          Start a session from your classes to begin taking
                          attendance
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeSessions
                          .filter((s) => s.status === "Active")
                          .map((session) => (
                            <div
                              key={session.id}
                              className="p-4 rounded-lg border bg-green-50/50 border-green-200"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium">
                                    {session.className}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Started: {session.startTime} •{" "}
                                    {session.location}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                                    Live
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleEndSession(session.id)}
                                    className="whitespace-nowrap"
                                  >
                                    End Session
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-green-600">
                                        {session.presentCount}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Present
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-red-600">
                                        {session.totalStudents -
                                          session.presentCount}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Absent
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold">
                                        {Math.round(
                                          (session.presentCount /
                                            session.totalStudents) *
                                            100
                                        )}
                                        %
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Attendance
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Student Attendance Table */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-sm">
                                    Student Attendance
                                  </h5>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedSession(session);
                                      setManualAttendanceOpen(true);
                                    }}
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Manual Edit
                                  </Button>
                                </div>

                                {/* Mobile-First Student List */}
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {Array.from(
                                    { length: session.totalStudents },
                                    (_, i) => {
                                      const isPresent =
                                        i < session.presentCount;
                                      const student = {
                                        id: `student-${i}`,
                                        name: `Student ${i + 1}`,
                                        email: `student${i + 1}@university.edu`,
                                        avatar: `S${i + 1}`,
                                        isPresent,
                                      };

                                      return (
                                        <div
                                          key={student.id}
                                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                            isPresent
                                              ? "bg-green-50 border-green-200"
                                              : "bg-red-50 border-red-200"
                                          }`}
                                        >
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Avatar className="w-8 h-8 shrink-0">
                                              <AvatarFallback className="text-xs">
                                                {student.avatar}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium text-sm truncate">
                                                {student.name}
                                              </div>
                                              <div className="text-xs text-muted-foreground truncate">
                                                {student.email}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 shrink-0">
                                            <Badge
                                              variant={
                                                isPresent
                                                  ? "default"
                                                  : "secondary"
                                              }
                                              className={
                                                isPresent
                                                  ? "bg-green-100 text-green-700 border-green-200"
                                                  : "bg-red-100 text-red-700 border-red-200"
                                              }
                                            >
                                              {isPresent ? "Present" : "Absent"}
                                            </Badge>

                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                >
                                                  <MoreVertical className="w-3 h-3" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                  onClick={() => {
                                                    // Toggle attendance status
                                                    console.log(
                                                      `Toggle attendance for ${student.name}`
                                                    );
                                                  }}
                                                >
                                                  <CheckCircle className="w-3 h-3 mr-2" />
                                                  {isPresent
                                                    ? "Mark Absent"
                                                    : "Mark Present"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  onClick={() => {
                                                    setSelectedStudent({
                                                      id: student.id,
                                                      name: student.name,
                                                      email: student.email,
                                                      studentId: `ST${String(
                                                        i + 1
                                                      ).padStart(3, "0")}`,
                                                      classId: session.classId,
                                                      enrollmentStatus:
                                                        "Enrolled",
                                                      attendanceRate:
                                                        Math.floor(
                                                          Math.random() * 20
                                                        ) + 80,
                                                      totalSessions: 15,
                                                      presentSessions:
                                                        Math.floor(
                                                          ((Math.random() * 20 +
                                                            80) *
                                                            15) /
                                                            100
                                                        ),
                                                    });
                                                    setViewStudentOpen(true);
                                                  }}
                                                >
                                                  <Eye className="w-3 h-3 mr-2" />
                                                  View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                  <Send className="w-3 h-3 mr-2" />
                                                  Send Message
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  className="text-red-600"
                                                  onClick={() => {
                                                    console.log(
                                                      `Remove ${student.name} from session`
                                                    );
                                                  }}
                                                >
                                                  <Trash2 className="w-3 h-3 mr-2" />
                                                  Remove from Session
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() =>
                                      console.log("Mark all present")
                                    }
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    All Present
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() =>
                                      console.log("Mark all absent")
                                    }
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    All Absent
                                  </Button>
                                </div>
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
                    <CardTitle>Recent Sessions</CardTitle>
                    <CardDescription>
                      Previously completed attendance sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* This would be populated with completed sessions */}
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">
                          Recent session history will appear here
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Reports */}
            {activeTab === "reports" && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">Reports & Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      View attendance statistics and export detailed reports
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleExportReport("Class Summary")}
                      variant="outline"
                    >
                      <IconDownload className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                {/* Report Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((classItem) => (
                    <Card key={classItem.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {classItem.name}
                        </CardTitle>
                        <CardDescription>{classItem.code}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">
                              Students
                            </div>
                            <div className="font-medium">
                              {classItem.enrolledStudents}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Sessions
                            </div>
                            <div className="font-medium">
                              {classItem.completedSessions}/
                              {classItem.totalSessions}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-muted-foreground">
                              Attendance Rate
                            </div>
                            <div className="font-medium text-lg">
                              {classItem.attendanceRate}%
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            handleExportReport(`${classItem.name} Report`)
                          }
                        >
                          <IconDownload className="w-4 h-4 mr-2" />
                          Export Report
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Announcements */}
            {activeTab === "announcements" && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">Announcements</h3>
                    <p className="text-sm text-muted-foreground">
                      Communicate with your students across all classes
                    </p>
                  </div>
                  <Button onClick={() => setAddAnnouncementOpen(true)}>
                    <IconPlus className="w-4 h-4 mr-2" />
                    New Announcement
                  </Button>
                </div>

                {/* Announcements List */}
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <Card key={announcement.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg">
                              {announcement.title}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {announcement.createdDate} • Classes:{" "}
                              {announcement.classIds.join(", ")}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                announcement.priority === "High"
                                  ? "border-red-200 text-red-700 bg-red-50"
                                  : announcement.priority === "Medium"
                                  ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                                  : "border-green-200 text-green-700 bg-green-50"
                              }
                            >
                              {announcement.priority}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                announcement.status === "Published"
                                  ? "border-green-200 text-green-700 bg-green-50"
                                  : "border-gray-200 text-gray-700 bg-gray-50"
                              }
                            >
                              {announcement.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {announcement.content}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAnnouncement(announcement);
                              setEditAnnouncementOpen(true);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAnnouncement(announcement);
                              setViewAnnouncementOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SidebarInset>

        {/* Add Class Drawer */}
        <Drawer open={addClassOpen} onOpenChange={setAddClassOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Create New Class</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              <div>
                <Label htmlFor="class-name">Class Name</Label>
                <Input
                  id="class-name"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g., Introduction to Computer Science"
                  required
                />
              </div>
              <div>
                <Label htmlFor="class-code">Class Code</Label>
                <Input
                  id="class-code"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  placeholder="e.g., CS101"
                  required
                />
              </div>
              <div>
                <Label htmlFor="class-schedule">Schedule</Label>
                <Input
                  id="class-schedule"
                  value={newClassSchedule}
                  onChange={(e) => setNewClassSchedule(e.target.value)}
                  placeholder="e.g., Mon, Wed, Fri 9:00 AM"
                />
              </div>
              <div>
                <Label htmlFor="class-mode">Mode</Label>
                <Select
                  value={newClassMode}
                  onValueChange={(value: "Online" | "In-Person" | "Hybrid") =>
                    setNewClassMode(value)
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
                <Label htmlFor="class-location">Location (optional)</Label>
                <Input
                  id="class-location"
                  value={newClassLocation}
                  onChange={(e) => setNewClassLocation(e.target.value)}
                  placeholder="e.g., Room 202"
                />
              </div>
              <div>
                <Label htmlFor="class-description">
                  Description (optional)
                </Label>
                <Textarea
                  id="class-description"
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                  placeholder="Brief description of the class"
                  rows={3}
                />
              </div>
            </div>
            <DrawerFooter>
              <Button
                onClick={handleAddClass}
                disabled={addingClass}
                className="w-full"
              >
                {addingClass ? (
                  <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <IconPlus className="w-4 h-4 mr-2" />
                )}
                Create Class
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Add Announcement Drawer */}
        <Drawer
          open={addAnnouncementOpen}
          onOpenChange={setAddAnnouncementOpen}
        >
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Create Announcement</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              <div>
                <Label htmlFor="announcement-title">Title</Label>
                <Input
                  id="announcement-title"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Announcement title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="announcement-content">Content</Label>
                <Textarea
                  id="announcement-content"
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Write your announcement..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="announcement-priority">Priority</Label>
                <Select
                  value={announcementPriority}
                  onValueChange={(value: "Low" | "Medium" | "High") =>
                    setAnnouncementPriority(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Classes</Label>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`class-${classItem.id}`}
                        checked={selectedClasses.includes(classItem.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClasses((prev) => [
                              ...prev,
                              classItem.id,
                            ]);
                          } else {
                            setSelectedClasses((prev) =>
                              prev.filter((id) => id !== classItem.id)
                            );
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor={`class-${classItem.id}`}
                        className="text-sm font-normal flex-1"
                      >
                        {classItem.name} ({classItem.code})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={handleAddAnnouncement} className="w-full">
                <IconSpeakerphone className="w-4 h-4 mr-2" />
                Publish Announcement
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Settings Drawer */}
        <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DrawerContent className="max-h-[90vh] mx-auto max-w-md">
            <DrawerHeader className="text-left">
              <DrawerTitle>Faculty Settings</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Profile Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      type="text"
                      defaultValue="Dr. Sarah Johnson"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="faculty@attendify.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      type="text"
                      defaultValue="Computer Science"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Class Preferences
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="default-cutoff">
                      Default Attendance Cutoff (minutes)
                    </Label>
                    <Input
                      id="default-cutoff"
                      type="number"
                      defaultValue="10"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location-radius">
                      Location Radius (meters)
                    </Label>
                    <Input
                      id="location-radius"
                      type="number"
                      defaultValue="50"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Notification Preferences
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="class-notifications"
                      className="text-sm font-normal"
                    >
                      Class Session Reminders
                    </Label>
                    <input
                      id="class-notifications"
                      type="checkbox"
                      className="h-4 w-4"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="enrollment-notifications"
                      className="text-sm font-normal"
                    >
                      Enrollment Requests
                    </Label>
                    <input
                      id="enrollment-notifications"
                      type="checkbox"
                      className="h-4 w-4"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="attendance-alerts"
                      className="text-sm font-normal"
                    >
                      Low Attendance Alerts
                    </Label>
                    <input
                      id="attendance-alerts"
                      type="checkbox"
                      className="h-4 w-4"
                      defaultChecked
                    />
                  </div>
                </div>
              </div>
            </div>
            <DrawerFooter className="border-t">
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => setSettingsOpen(false)}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* View Class Details Drawer */}
        <Drawer open={viewClassOpen} onOpenChange={setViewClassOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>
                {selectedClass?.name || "Class Details"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-6 overflow-y-auto">
              {selectedClass && (
                <>
                  {/* Class Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      Class Information
                    </h3>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Class Code:
                        </span>
                        <span className="font-medium">
                          {selectedClass.code}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Schedule:</span>
                        <span className="font-medium">
                          {selectedClass.schedule}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mode:</span>
                        <Badge variant="outline">{selectedClass.mode}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">
                          {selectedClass.location || "Not specified"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant={
                            selectedClass.status === "Active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {selectedClass.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Enrolled Students Table */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm text-muted-foreground">
                        Enrolled Students ({selectedClass.enrolledStudents})
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEnrollStudentOpen(true)}
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Enroll
                      </Button>
                    </div>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-right">
                              Attendance
                            </TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from(
                            { length: selectedClass.enrolledStudents },
                            (_, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-mono text-xs">
                                  {String(i + 1).padStart(2, "0")}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-7 h-7">
                                      <AvatarFallback className="text-xs">
                                        {`S${i + 1}`}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-sm">
                                        Student {i + 1}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        student{i + 1}@university.edu
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="text-sm font-medium">
                                    {Math.floor(Math.random() * 20) + 80}%
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Eye className="w-3 h-3 mr-2" />
                                        View Profile
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Send className="w-3 h-3 mr-2" />
                                        Send Message
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-red-600">
                                        <Trash2 className="w-3 h-3 mr-2" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Recent Sessions */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      Recent Sessions
                    </h3>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <div>
                              <div className="text-sm font-medium">
                                Session {selectedClass.completedSessions - i}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(
                                  Date.now() - i * 24 * 60 * 60 * 1000
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {Math.floor(Math.random() * 10) + 85}% attended
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Edit Class Drawer */}
        <Drawer open={editClassOpen} onOpenChange={setEditClassOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Edit Class</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              {selectedClass && (
                <>
                  <div>
                    <Label htmlFor="edit-class-name">Class Name</Label>
                    <Input
                      id="edit-class-name"
                      defaultValue={selectedClass.name}
                      placeholder="e.g., Introduction to Computer Science"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-class-code">Class Code</Label>
                    <Input
                      id="edit-class-code"
                      defaultValue={selectedClass.code}
                      placeholder="e.g., CS101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-class-schedule">Schedule</Label>
                    <Input
                      id="edit-class-schedule"
                      defaultValue={selectedClass.schedule}
                      placeholder="e.g., Mon, Wed, Fri 9:00 AM"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-class-mode">Mode</Label>
                    <Select defaultValue={selectedClass.mode}>
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
                    <Label htmlFor="edit-class-location">Location</Label>
                    <Input
                      id="edit-class-location"
                      defaultValue={selectedClass.location}
                      placeholder="e.g., Room 202"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-class-status">Status</Label>
                    <Select defaultValue={selectedClass.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DrawerFooter>
              <Button className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Enroll Student Drawer */}
        <Drawer open={enrollStudentOpen} onOpenChange={setEnrollStudentOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Enroll Student</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              <div>
                <Label htmlFor="student-search">Search Students</Label>
                <Input
                  id="student-search"
                  placeholder="Search by name, email, or student ID..."
                  className="mt-1"
                />
              </div>

              {/* Available Students List */}
              <div className="space-y-3">
                <Label>Available Students</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {`U${i + 1}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            Student {i + 1}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            student{i + 1}@university.edu
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserPlus className="w-3 h-3 mr-1" />
                        Enroll
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Enrollment */}
              <div className="space-y-3 pt-4 border-t">
                <Label>Manual Enrollment</Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="manual-name">Student Name</Label>
                    <Input id="manual-name" placeholder="Full name" />
                  </div>
                  <div>
                    <Label htmlFor="manual-email">Email Address</Label>
                    <Input
                      id="manual-email"
                      type="email"
                      placeholder="student@university.edu"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-id">Student ID</Label>
                    <Input id="manual-id" placeholder="Student ID number" />
                  </div>
                </div>
              </div>
            </div>
            <DrawerFooter>
              <Button className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll Student
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* View Announcement Details Drawer */}
        <Drawer
          open={viewAnnouncementOpen}
          onOpenChange={setViewAnnouncementOpen}
        >
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>
                {selectedAnnouncement?.title || "Announcement Details"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-6 overflow-y-auto">
              {selectedAnnouncement && (
                <>
                  {/* Announcement Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge
                        variant="outline"
                        className={
                          selectedAnnouncement.priority === "High"
                            ? "border-red-200 text-red-700 bg-red-50"
                            : selectedAnnouncement.priority === "Medium"
                            ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                            : "border-green-200 text-green-700 bg-green-50"
                        }
                      >
                        {selectedAnnouncement.priority} Priority
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          selectedAnnouncement.status === "Published"
                            ? "border-green-200 text-green-700 bg-green-50"
                            : "border-gray-200 text-gray-700 bg-gray-50"
                        }
                      >
                        {selectedAnnouncement.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Content
                        </Label>
                        <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm">
                            {selectedAnnouncement.content}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Created
                          </Label>
                          <p className="mt-1">
                            {selectedAnnouncement.createdDate}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Priority
                          </Label>
                          <p className="mt-1">
                            {selectedAnnouncement.priority}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Target Classes */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Target Classes ({selectedAnnouncement.classIds.length})
                    </Label>
                    <div className="space-y-2">
                      {selectedAnnouncement.classIds.map((classId, index) => {
                        const classItem = classes.find((c) => c.id === classId);
                        return (
                          <div
                            key={classId}
                            className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <div>
                                <div className="text-sm font-medium">
                                  {classItem?.name || `Class ${classId}`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {classItem?.code || classId} •{" "}
                                  {classItem?.enrolledStudents || 0} students
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery Stats (Mock data) */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Delivery Statistics
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border rounded-lg text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {selectedAnnouncement.classIds.reduce(
                            (total, classId) => {
                              const classItem = classes.find(
                                (c) => c.id === classId
                              );
                              return total + (classItem?.enrolledStudents || 0);
                            },
                            0
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Recipients
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg text-center">
                        <div className="text-lg font-bold text-green-600">
                          {Math.floor(Math.random() * 20) + 80}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Read Rate
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DrawerFooter>
              <Button
                onClick={() => {
                  setViewAnnouncementOpen(false);
                  setEditAnnouncementOpen(true);
                }}
                className="w-full"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Announcement
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Edit Announcement Drawer */}
        <Drawer
          open={editAnnouncementOpen}
          onOpenChange={setEditAnnouncementOpen}
        >
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Edit Announcement</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              {selectedAnnouncement && (
                <>
                  <div>
                    <Label htmlFor="edit-announcement-title">Title</Label>
                    <Input
                      id="edit-announcement-title"
                      defaultValue={selectedAnnouncement.title}
                      placeholder="Announcement title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-announcement-content">Content</Label>
                    <Textarea
                      id="edit-announcement-content"
                      defaultValue={selectedAnnouncement.content}
                      placeholder="Write your announcement..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-announcement-priority">Priority</Label>
                    <Select defaultValue={selectedAnnouncement.priority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-announcement-status">Status</Label>
                    <Select defaultValue={selectedAnnouncement.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Published">Published</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Target Classes</Label>
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                      {classes.map((classItem) => (
                        <div
                          key={classItem.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`edit-class-${classItem.id}`}
                            defaultChecked={selectedAnnouncement.classIds.includes(
                              classItem.id
                            )}
                            className="h-4 w-4"
                          />
                          <Label
                            htmlFor={`edit-class-${classItem.id}`}
                            className="text-sm font-normal flex-1"
                          >
                            {classItem.name} ({classItem.code})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <DrawerFooter>
              <Button className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* View Student Details Drawer */}
        <Drawer open={viewStudentOpen} onOpenChange={setViewStudentOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>
                {selectedStudent?.name || "Student Profile"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-6 overflow-y-auto">
              {selectedStudent && (
                <>
                  {/* Student Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="text-lg">
                          {selectedStudent.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {selectedStudent.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedStudent.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {selectedStudent.studentId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Statistics */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Attendance Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedStudent.attendanceRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Overall Rate
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg text-center">
                        <div className="text-2xl font-bold">
                          {selectedStudent.presentSessions}/
                          {selectedStudent.totalSessions}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Sessions
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={selectedStudent.attendanceRate}
                      className="h-2"
                    />
                  </div>

                  {/* Recent Attendance */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Recent Sessions
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                Math.random() > 0.2
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                            <div>
                              <div className="text-sm font-medium">
                                Session {selectedStudent.totalSessions - i}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(
                                  Date.now() - i * 24 * 60 * 60 * 1000
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              Math.random() > 0.2 ? "default" : "secondary"
                            }
                          >
                            {Math.random() > 0.2 ? "Present" : "Absent"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Contact Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" size="sm">
                        <Send className="w-3 h-3 mr-2" />
                        Send Email
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-3 h-3 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Manual Attendance Edit Drawer */}
        <Drawer
          open={manualAttendanceOpen}
          onOpenChange={setManualAttendanceOpen}
        >
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Manual Attendance Edit</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              {selectedSession && (
                <>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">
                      {selectedSession.className}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Session started: {selectedSession.startTime} •{" "}
                      {selectedSession.location}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Student List
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => console.log("Select all")}
                        >
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => console.log("Clear all")}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-3">
                      {Array.from(
                        { length: selectedSession.totalStudents },
                        (_, i) => {
                          const isPresent = i < selectedSession.presentCount;
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 border rounded-md"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {`S${i + 1}`}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm">
                                    Student {i + 1}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    student{i + 1}@university.edu
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`manual-student-${i}`}
                                  defaultChecked={isPresent}
                                  className="h-4 w-4"
                                  onChange={(e) => {
                                    console.log(
                                      `Student ${i + 1} attendance:`,
                                      e.target.checked
                                    );
                                  }}
                                />
                                <Label
                                  htmlFor={`manual-student-${i}`}
                                  className="text-sm font-normal"
                                >
                                  Present
                                </Label>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-3 pt-3 border-t">
                    <Label className="text-sm font-medium">
                      Additional Options
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="late-arrival"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="late-arrival" className="text-sm">
                          Allow late arrivals (next 15 minutes)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="auto-save"
                          defaultChecked
                          className="h-4 w-4"
                        />
                        <Label htmlFor="auto-save" className="text-sm">
                          Auto-save changes
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DrawerFooter>
              <Button className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Attendance
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </SidebarProvider>
  );
}

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Home,
  BookOpen,
  UserCheck,
  User,
  Megaphone,
  Settings,
  Bell,
  MoreHorizontal,
  LogOut,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ChevronRight,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Camera,
  MapPin,
  Wifi,
  WifiOff,
  Check,
  X,
  AlertTriangle,
  Video,
  Mic,
  Eye,
  Edit,
  Trash,
  Download,
  Scan,
  QrCode,
  Loader2,
  CheckCircle,
  XCircle,
  Users,
  MoreVertical,
  Send,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
} from "recharts";

// Types
interface EnrolledClass {
  id: string;
  name: string;
  code: string;
  instructor: string;
  schedule: string;
  mode: "Online" | "In-Person" | "Hybrid";
  location?: string;
  nextSession?: string;
  attendanceRate: number;
  totalSessions: number;
  attendedSessions: number;
  status: "Active" | "Completed" | "Dropped";
}

interface AttendanceRecord {
  id: string;
  classId: string;
  className: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Excused";
  sessionType: "Online" | "In-Person";
  timestamp?: string;
}

interface AvailableClass {
  id: string;
  name: string;
  code: string;
  instructor: string;
  schedule: string;
  mode: "Online" | "In-Person" | "Hybrid";
  location?: string;
  enrolledCount: number;
  maxCapacity: number;
  description?: string;
  prerequisites?: string[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  classId?: string;
  className?: string;
  instructor: string;
  date: string;
  priority: "Low" | "Medium" | "High";
  isRead: boolean;
}

interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  mode: "Online" | "In-Person";
  location?: string;
  requiresFaceRecognition: boolean;
  allowOnlineMode: boolean;
  cutoffTime?: number; // minutes
}

// Notification Menu Component
function NotificationMenu() {
  const [unreadCount, setUnreadCount] = useState(3);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-stone-50/70 supports-[backdrop-filter]:backdrop-blur-md border shadow-lg">
        <div className="p-2">
          <div className="text-sm font-medium mb-2">Notifications</div>
          <div className="space-y-2">
            <div className="text-sm p-2 rounded bg-blue-50 border-l-2 border-blue-400">
              CS101 session starts in 10 minutes
            </div>
            <div className="text-sm p-2 rounded bg-green-50 border-l-2 border-green-400">
              Attendance recorded successfully
            </div>
            <div className="text-sm p-2 rounded bg-yellow-50 border-l-2 border-yellow-400">
              New announcement in Math 201
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View All
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Sidebar User Menu Component
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
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="/avatars/student.jpg" />
                <AvatarFallback className="rounded-lg bg-purple-500 text-white">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Alex Johnson</span>
                <span className="text-muted-foreground truncate text-xs">
                  alex.johnson@student.edu
                </span>
              </div>
              <MoreHorizontal className="ml-auto size-4" />
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
                  <AvatarImage src="/avatars/student.jpg" />
                  <AvatarFallback className="rounded-lg bg-purple-500 text-white">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Alex Johnson</span>
                  <span className="text-muted-foreground truncate text-xs">
                    alex.johnson@student.edu
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <Settings className="w-4 h-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut className="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default function StudentPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const pathname = usePathname();

  // Get current tab from pathname
  const getCurrentTab = () => {
    if (pathname?.includes("/dashboard")) return "dashboard";
    if (pathname?.includes("/classes")) return "classes";
    if (pathname?.includes("/attendance")) return "attendance";
    if (pathname?.includes("/profile")) return "profile";
    if (pathname?.includes("/announcements")) return "announcements";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState(getCurrentTab());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [joinClassOpen, setJoinClassOpen] = useState(false);
  const [faceRecognitionOpen, setFaceRecognitionOpen] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<AttendanceSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const [enrolledClasses] = useState<EnrolledClass[]>([
    {
      id: "CS101",
      name: "Introduction to Computer Science",
      code: "CS101",
      instructor: "Dr. Sarah Johnson",
      schedule: "Mon, Wed, Fri 9:00 AM",
      mode: "Hybrid",
      location: "Room 202 / Online",
      nextSession: "2025-10-17T09:00:00",
      attendanceRate: 92.5,
      totalSessions: 32,
      attendedSessions: 30,
      status: "Active",
    },
    {
      id: "MATH201",
      name: "Calculus II",
      code: "MATH201",
      instructor: "Prof. Michael Chen",
      schedule: "Tue, Thu 2:00 PM",
      mode: "In-Person",
      location: "Math Building 104",
      nextSession: "2025-10-17T14:00:00",
      attendanceRate: 88.0,
      totalSessions: 28,
      attendedSessions: 25,
      status: "Active",
    },
    {
      id: "ENG102",
      name: "English Composition",
      code: "ENG102",
      instructor: "Dr. Emily Rodriguez",
      schedule: "Mon, Wed 11:00 AM",
      mode: "Online",
      nextSession: "2025-10-17T11:00:00",
      attendanceRate: 96.0,
      totalSessions: 24,
      attendedSessions: 23,
      status: "Active",
    },
  ]);

  const [activeSessions] = useState<AttendanceSession[]>([
    {
      id: "SESSION001",
      classId: "CS101",
      className: "Introduction to Computer Science",
      date: "2025-10-17",
      startTime: "09:00",
      endTime: "10:30",
      isActive: true,
      mode: "In-Person" as const,
      location: "Room 202",
      requiresFaceRecognition: true,
      allowOnlineMode: true,
      cutoffTime: 10,
    },
  ]);

  const [announcements] = useState<Announcement[]>([
    {
      id: "ANN001",
      title: "Midterm Exam Schedule Released",
      content:
        "The midterm examination schedule has been posted. Please check your class pages for specific dates and times.",
      classId: "CS101",
      className: "Introduction to Computer Science",
      instructor: "Dr. Sarah Johnson",
      date: "2025-10-15",
      priority: "High",
      isRead: false,
    },
    {
      id: "ANN002",
      title: "Assignment 3 Due Friday",
      content:
        "Don't forget that Assignment 3 is due this Friday at 11:59 PM. Submit through the course portal.",
      classId: "MATH201",
      className: "Calculus II",
      instructor: "Prof. Michael Chen",
      date: "2025-10-14",
      priority: "Medium",
      isRead: false,
    },
    {
      id: "ANN003",
      title: "Library Resources Workshop",
      content:
        "Join us for a workshop on utilizing library resources for your research papers.",
      instructor: "Library Staff",
      date: "2025-10-13",
      priority: "Low",
      isRead: true,
    },
  ]);

  // Navigation items
  const navigationItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      href: "/student/dashboard",
    },
    {
      id: "classes",
      icon: BookOpen,
      label: "My Classes",
      href: "/student/classes",
    },
    {
      id: "attendance",
      icon: UserCheck,
      label: "Attendance",
      href: "/student/attendance",
    },
    { id: "profile", icon: User, label: "Profile", href: "/student/profile" },
    {
      id: "announcements",
      icon: Megaphone,
      label: "Announcements",
      href: "/student/announcements",
    },
  ];

  // Dashboard metrics
  const metricCards = useMemo(
    () => [
      {
        title: "Enrolled Classes",
        value: enrolledClasses.length.toString(),
        change: "+1 this semester",
        trend: "up",
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
        trend: "up",
        icon: UserCheck,
        color: "bg-green-500",
      },
      {
        title: "Sessions This Week",
        value: "12",
        change: "3 upcoming",
        trend: "neutral",
        icon: Calendar,
        color: "bg-violet-500",
      },
      {
        title: "Unread Announcements",
        value: announcements.filter((a) => !a.isRead).length.toString(),
        change: "2 high priority",
        trend: "neutral",
        icon: Megaphone,
        color: "bg-orange-500",
      },
    ],
    [enrolledClasses, announcements]
  );

  // Handlers
  const handleJoinClass = async (classCode: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setJoinClassOpen(false);

    toast({
      title: "Join Request Sent",
      description: `Your request to join ${classCode} has been sent to the instructor.`,
    });
  };

  const handleStartAttendance = async (
    session: AttendanceSession,
    mode: "face" | "online"
  ) => {
    setSelectedSession(session);

    if (mode === "face") {
      setFaceRecognitionOpen(true);
    } else {
      // Simulate online attendance
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsLoading(false);

      toast({
        title: "Attendance Recorded",
        description: `Present for ${session.className}`,
        variant: "default",
      });
    }
  };

  const handleFaceRecognition = async () => {
    if (!selectedSession) return;

    setIsLoading(true);
    // Simulate face recognition processing
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsLoading(false);
    setFaceRecognitionOpen(false);
    setSelectedSession(null);

    // Simulate different outcomes
    const outcomes = ["success", "invalid", "duplicate"];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    switch (outcome) {
      case "success":
        toast({
          title: "Attendance Recorded ✓",
          description: `Successfully recorded attendance for ${selectedSession.className}`,
          variant: "default",
        });
        break;
      case "invalid":
        toast({
          title: "Recognition Failed ✗",
          description:
            "Face not recognized. Please try again or contact support.",
          variant: "destructive",
        });
        break;
      case "duplicate":
        toast({
          title: "Already Recorded ⚠",
          description: "Your attendance for this session was already recorded.",
          variant: "default",
        });
        break;
    }
  };

  // Update tab based on pathname changes
  useEffect(() => {
    setActiveTab(getCurrentTab());
  }, [pathname]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Student Sidebar */}
        <Sidebar
          variant="sidebar"
          className="border-r border-border bg-stone-50/60 supports-[backdrop-filter]:backdrop-blur-md shadow-lg flex flex-col min-h-screen relative z-50"
        >
          {/* Sidebar Header */}
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
                  Student Portal
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
                        asChild
                        isActive={activeTab === item.id}
                        className="w-full justify-start"
                        size="lg"
                      >
                        <Link href={item.href}>
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </Link>
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
                        {activeTab === "dashboard" && "Your academic overview"}
                        {activeTab === "classes" &&
                          "Manage your enrolled classes"}
                        {activeTab === "attendance" && "Record your attendance"}
                        {activeTab === "profile" &&
                          "Update your profile and preferences"}
                        {activeTab === "announcements" &&
                          "View class announcements"}
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
            {children}
          </div>
        </SidebarInset>

        {/* Join Class Drawer */}
        <Drawer open={joinClassOpen} onOpenChange={setJoinClassOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Join a Class</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="code">Class Code</TabsTrigger>
                  <TabsTrigger value="browse">Browse Classes</TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="space-y-4">
                  <div>
                    <Label htmlFor="class-code">Enter Class Code</Label>
                    <Input
                      id="class-code"
                      placeholder="e.g., CS101-001"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get the class code from your instructor
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleJoinClass("CS101-001")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Request to Join
                  </Button>
                </TabsContent>

                <TabsContent value="browse" className="space-y-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {/* Mock available classes */}
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">Physics 101</h4>
                          <p className="text-sm text-muted-foreground">
                            PHY101 • Dr. Smith
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Mon, Wed, Fri 10:00 AM
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Join
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">Chemistry Lab</h4>
                          <p className="text-sm text-muted-foreground">
                            CHEM102 • Dr. Wilson
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tue, Thu 2:00 PM
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Join
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Face Recognition Dialog */}
        <Dialog
          open={faceRecognitionOpen}
          onOpenChange={setFaceRecognitionOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Face Recognition Attendance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-48 h-36 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                      <p className="text-sm text-muted-foreground">
                        Processing...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-muted-foreground">
                        Position your face in the frame
                      </p>
                    </div>
                  )}
                </div>

                {selectedSession && (
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{selectedSession.className}</p>
                    <p className="text-muted-foreground">
                      {selectedSession.date} • {selectedSession.startTime}
                    </p>
                    {selectedSession.location && (
                      <p className="text-muted-foreground flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedSession.location}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleFaceRecognition}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Scan className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? "Processing" : "Scan Face"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFaceRecognitionOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Drawer */}
        <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DrawerContent className="max-h-[90vh] mx-auto max-w-md">
            <DrawerHeader className="text-left">
              <DrawerTitle>Student Settings</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-6 overflow-y-auto">
              {/* Profile Information */}
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
                      defaultValue="Alex Johnson"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input
                      id="student-id"
                      type="text"
                      defaultValue="ST202400123"
                      className="mt-1"
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="alex.johnson@student.edu"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      type="text"
                      defaultValue="Computer Science"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Attendance Preferences */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Attendance Preferences
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="auto-location"
                      className="text-sm font-normal"
                    >
                      Auto-detect Location
                    </Label>
                    <input
                      id="auto-location"
                      type="checkbox"
                      className="h-4 w-4"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="face-recognition"
                      className="text-sm font-normal"
                    >
                      Enable Face Recognition
                    </Label>
                    <input
                      id="face-recognition"
                      type="checkbox"
                      className="h-4 w-4"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="session-reminders"
                      className="text-sm font-normal"
                    >
                      Session Reminders
                    </Label>
                    <input
                      id="session-reminders"
                      type="checkbox"
                      className="h-4 w-4"
                      defaultChecked
                    />
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Notifications
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="class-notifications"
                      className="text-sm font-normal"
                    >
                      Class Announcements
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
                      htmlFor="attendance-reminders"
                      className="text-sm font-normal"
                    >
                      Attendance Reminders
                    </Label>
                    <input
                      id="attendance-reminders"
                      type="checkbox"
                      className="h-4 w-4"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="grade-updates"
                      className="text-sm font-normal"
                    >
                      Grade Updates
                    </Label>
                    <input
                      id="grade-updates"
                      type="checkbox"
                      className="h-4 w-4"
                      defaultChecked
                    />
                  </div>
                </div>
              </div>

              {/* Face Data Management */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Face Data
                </h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Update Face Data
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete Face Data
                  </Button>
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
      </div>
    </SidebarProvider>
  );
}

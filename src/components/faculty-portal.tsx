"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import ClassesManagement from "@/components/faculty/classes/ClassesManagement";
import ActiveSessions from "@/components/faculty/classes/ActiveSessions";
import AttendanceTab from '@/components/faculty/attendance/AttendanceTab';
import { classesAPI } from "@/lib/api";
import { checkAuth } from "@/lib/clientAuth";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AnnouncementsManager from "@/components/faculty/announcements/AnnouncementsManager";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  SidebarTrigger,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";

// --- Types used by the faculty portal (kept local during modularization) ---
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
  // Active schedule metadata from backend
  is_active?: boolean;
  current_schedule_id?: number | null;
  current_schedule_type?: string | null;
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

// Minimal NotificationMenu used in several portals
function NotificationMenu() {
  return (
    <div>
      <Button variant="ghost" size="icon" className="relative">
        <IconBell className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
      </Button>
    </div>
  );
}

// Minimal Sidebar user menu used in faculty portal
function SidebarUserMenu({ setSettingsOpen }: { setSettingsOpen: (open: boolean) => void }) {
  const router = useRouter();
  const { user } = useAuthContext();

  const displayName = (user && (user.firstName || user.username || user.email)) || 'User';
  const initial = String(displayName).charAt(0).toUpperCase() || 'U';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-green-500 text-white">{initial}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <span className="truncate font-medium">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">{user?.email ?? ''}</span>
              </div>
              <IconDots className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-green-500 text-white">{initial}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">{user?.email ?? ''}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <IconSettings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/auth/logout')}>
              <IconLogout className="w-4 h-4 mr-2" />
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
  const router = useRouter();

  // Navigation - initialize active tab from server-friendly source.
  // Use Next's `useSearchParams()` (works during SSR) so the server
  // render and initial client render match. We will read `window.location`
  // and `localStorage` later in a mount effect to handle hard reloads.
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "classes" | "attendance" | "reports" | "announcements"
  >(() => (searchParams?.get("tab") as
    | "dashboard"
    | "classes"
    | "attendance"
    | "reports"
    | "announcements") || "dashboard");

  // Persist the active tab in the URL so a browser refresh returns to the same tab.
  // Track whether we've reconciled the URL/localStorage into state on mount.
  const initialUrlSyncRef = React.useRef(false);

  // Ensure tab is restored on a full browser refresh where Next's
  // `useSearchParams` may not be populated immediately server-side.
  // Read from `window.location` on mount and apply the tab if present.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (
        t &&
        ["dashboard", "classes", "attendance", "reports", "announcements"].includes(t) &&
        t !== activeTab
      ) {
        setActiveTab(t as any);
      } else if (!t) {
        // If no explicit tab param, try localStorage fallback.
        try {
          const stored = window.localStorage.getItem("faculty_active_tab");
          if (
            stored &&
            ["dashboard", "classes", "attendance", "reports", "announcements"].includes(stored) &&
            stored !== activeTab
          ) {
            setActiveTab(stored as any);
          }
        } catch (e) {
          // ignore localStorage issues
        }
      }
    } catch (err) {
      // non-fatal
      console.warn("Failed to read tab from window.location", err);
    }
    initialUrlSyncRef.current = true;
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the active tab in the URL so a browser refresh returns to the same tab.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");

      // If the URL already has an explicit tab param, prefer it and
      // apply it to state rather than overwriting the URL. This prevents
      // a race where the component's initial state (from searchParams)
      // is `dashboard` and would replace a legitimate `?tab=classes` on
      // a hard refresh.
      // If we haven't yet reconciled the real tab from URL/localStorage on mount,
      // prefer to honor the present URL param (if any) and avoid persisting.
      if (!initialUrlSyncRef.current) {
        if (urlTab && ["dashboard", "classes", "attendance", "reports", "announcements"].includes(urlTab)) {
          if (urlTab !== activeTab) setActiveTab(urlTab as any);
        }
        return;
      }

      // If URL already matches desired tab, do nothing.
      if (urlTab === activeTab) return;

      params.set("tab", activeTab);
      const search = params.toString();
      const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
      // Use Next router replace so `useSearchParams()` and the App Router
      // internals stay in sync with the updated URL.
      try {
        if (router && typeof router.replace === "function") {
          // router.replace is async but we don't need to await it here.
          router.replace(newUrl as any);
        } else {
          window.history.replaceState(null, "", newUrl);
        }
      } catch (err) {
        // Fallback to history API if router.replace fails for any reason
        window.history.replaceState(null, "", newUrl);
      }
    } catch (err) {
      // non-fatal
      console.warn("Failed to persist active tab in URL", err);
    }
  }, [activeTab]);

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
      ["dashboard", "classes", "attendance", "reports", "announcements"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Ensure tab is restored on a full browser refresh where Next's
  // `useSearchParams` may not be populated immediately server-side.
  // Read from `window.location` on mount and apply the tab if present.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (
        t &&
        ["dashboard", "classes", "attendance", "reports", "announcements"].includes(t) &&
        t !== activeTab
      ) {
        setActiveTab(t as any);
      }
    } catch (err) {
      // non-fatal
      console.warn("Failed to read tab from window.location", err);
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  

  // Persist activeTab to localStorage as a resilient fallback for reloads
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("faculty_active_tab", activeTab);
      }
    } catch (err) {
      // ignore storage errors
    }
  }, [activeTab]);

  // Sheet and Drawer states
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startSessionOpen, setStartSessionOpen] = useState(false);
  const [manualAttendanceOpen, setManualAttendanceOpen] = useState(false);
  const [viewClassOpen, setViewClassOpen] = useState(false);
  const [editClassOpen, setEditClassOpen] = useState(false);
  const [enrollStudentOpen, setEnrollStudentOpen] = useState(false);
  const [viewStudentOpen, setViewStudentOpen] = useState(false);
  const [viewSessionOpen, setViewSessionOpen] = useState(false);

  // Selected items for viewing/editing
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSession, setSelectedSession] =
    useState<AttendanceSession | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [addingClass, setAddingClass] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  // Form states
  // Form states (create via backend: course_id required)
  const [newCourseId, setNewCourseId] = useState("");
  const [newClassRoom, setNewClassRoom] = useState("");
  const [newClassAcademicYear, setNewClassAcademicYear] = useState("");
  const [newClassSemester, setNewClassSemester] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");

  const [classes, setClasses] = useState<Class[]>([]);
  const { user } = useAuthContext();
  const announcementsRef = React.useRef<{ openNewAnnouncement?: () => void } | null>(null);

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

  // Load classes from backend for the current faculty user
  useEffect(() => {
    if (!user || !user.id) return;

    let mounted = true;
      const displayName = (user && (user.firstName || user.username || user.email)) || 'User';
      const initial = String(displayName).charAt(0).toUpperCase() || 'U';
    (async () => {
      try {
        // Ensure the user session is still valid before calling backend endpoints.
        // If the session is expired, redirect to login so server-side cookies
        // and ownership checks behave correctly (mirrors AdminPortal behavior).
        try {
          const ok = await checkAuth();
                    <AvatarFallback className="rounded-lg bg-green-500 text-white">{initial}</AvatarFallback>
            const redirectTo = encodeURIComponent(window.location.pathname || '/');
            router.push(`/auth/login?redirect=${redirectTo}`);
            return;
                    <span className="truncate font-medium">{displayName}</span>
        } catch (err) {
          // On network/auth check error, redirect to login as a safe fallback.
          const redirectTo = encodeURIComponent(window.location.pathname || '/');
          router.push(`/auth/login?redirect=${redirectTo}`);
          return;
        }

        setIsLoading(true);
        const backend = await classesAPI.listClassesForFaculty(Number(user.id));
        if (!mounted) return;
                      <AvatarFallback className="rounded-lg bg-green-500 text-white">{initial}</AvatarFallback>
        const mapped: Class[] = Array.isArray(backend)
          ? backend.map((c: any) => {
              const schedules: any[] = Array.isArray(c.schedules) ? c.schedules : [];
                      <span className="truncate font-medium">{displayName}</span>
              // Build a human-friendly schedule string
              const scheduleStr = schedules
                .map((s) => {
                  if (s.type === "normal") {
                    return `${s.day_of_week} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}`.trim();
                  }
                  if (s.type === "special") {
                    return `${s.date} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}`.trim();
                  }
                  return "";
                })
                .filter(Boolean)
                .join(", ");

              // Determine mode: Online / In-Person / Hybrid
              const modes = schedules.flatMap((s) => Array.isArray(s.modes) ? s.modes : []);
              const hasOnline = modes.some((m: string) => m.toLowerCase().includes("online"));
              const hasF2f = modes.some((m: string) => m.toLowerCase().includes("face") || m.toLowerCase().includes("f2f") || m.toLowerCase().includes("face_to_face"));
              const mode: Class["mode"] = hasOnline && hasF2f ? "Hybrid" : hasOnline ? "Online" : "In-Person";

              return {
                id: String(c.id),
                name: c.course_name ?? c.class_code ?? c.course_code ?? `Class ${c.id}`,
                code: c.class_code ?? c.course_code ?? "",
                schedule: scheduleStr || (c.room ? String(c.room) : ""),
                mode,
                // Active-schedule metadata
                is_active: Boolean(c.is_active),
                current_schedule_id: c.current_schedule_id ?? null,
                current_schedule_type: c.current_schedule_type ?? null,
                enrolledStudents: c.enrolled_students ?? c.students_count ?? 0,
                totalSessions: c.total_sessions ?? 0,
                completedSessions: c.completed_sessions ?? 0,
                attendanceRate: typeof c.attendance_rate === 'number' ? c.attendance_rate : (c.attendance_rate ? Number(c.attendance_rate) : 0),
                status: "Active",
                location: c.room ?? c.location ?? c.organization_name ?? undefined,
                description: c.description ?? undefined,
              } as Class;
            })
          : [];

        setClasses(mapped);
      } catch (err: any) {
        console.error("Failed to load classes for faculty:", err);
        toast({ title: "Failed to load classes", description: String(err?.message ?? err) });
      } finally {
        setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [user]);

  // Refresh a single class record and update local `classes` state.
  const refreshClassInState = async (classId: number) => {
    try {
      const d = await classesAPI.getMyClass(Number(classId));
      if (!d) return;
      const schedules: any[] = Array.isArray(d.schedules) ? d.schedules : [];
      const scheduleStr = schedules
        .map((s) => {
          if (s.type === "normal") {
            return `${s.day_of_week} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}`.trim();
          }
          if (s.type === "special") {
            return `${s.date} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}`.trim();
          }
          return "";
        })
        .filter(Boolean)
        .join(", ");

      const modes = schedules.flatMap((s) => Array.isArray(s.modes) ? s.modes : []);
      const hasOnline = modes.some((m: string) => m.toLowerCase().includes("online"));
      const hasF2f = modes.some((m: string) => m.toLowerCase().includes("face") || m.toLowerCase().includes("f2f") || m.toLowerCase().includes("face_to_face"));
      const mode: Class["mode"] = hasOnline && hasF2f ? "Hybrid" : hasOnline ? "Online" : "In-Person";

      const mapped: Class = {
        id: String(d.id),
        name: d.course_name ?? d.class_code ?? d.course_code ?? `Class ${d.id}`,
        code: d.class_code ?? d.course_code ?? "",
        schedule: scheduleStr || (d.room ? String(d.room) : ""),
        mode,
        is_active: Boolean(d.is_active),
        current_schedule_id: d.current_schedule_id ?? null,
        current_schedule_type: d.current_schedule_type ?? null,
        enrolledStudents: d.enrolled_students ?? d.students_count ?? 0,
        totalSessions: d.total_sessions ?? 0,
        completedSessions: d.completed_sessions ?? 0,
        attendanceRate: typeof d.attendance_rate === 'number' ? d.attendance_rate : (d.attendance_rate ? Number(d.attendance_rate) : 0),
        status: "Active",
        location: d.room ?? d.location ?? d.organization_name ?? undefined,
        description: d.description ?? undefined,
      } as Class;

      setClasses((prev) => {
        const found = prev.find((c) => c.id === String(classId));
        if (found) {
          return prev.map((c) => (c.id === String(classId) ? mapped : c));
        }
        // if not found, prepend
        return [mapped, ...prev];
      });
    } catch (err) {
      console.error('Failed to refresh class', err);
    }
  };

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
  function handleNav(tabId: typeof navigationItems[number]['id']) {
    // Optimistically switch tabs for snappy UI, then verify auth in background
    setActiveTab(tabId as any);

    checkAuth()
      .then((ok) => {
        if (!ok) {
          const redirectTo = encodeURIComponent(window.location.pathname || '/');
          router.push(`/auth/login?redirect=${redirectTo}`);
        }
      })
      .catch(() => {
        // ignore network errors here; don't block UI
      });
  }
  const handleAddClass = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newCourseId) {
      toast({
        title: "Error",
        description: "Course id is required",
        variant: "destructive",
      });
      return;
    }
    // Verify session before performing create operation.
    try {
      const ok = await checkAuth();
      if (!ok) {
        const redirectTo = encodeURIComponent(window.location.pathname || '/');
        router.push(`/auth/login?redirect=${redirectTo}`);
        return;
      }
    } catch (err) {
      const redirectTo = encodeURIComponent(window.location.pathname || '/');
      router.push(`/auth/login?redirect=${redirectTo}`);
      return;
    }

    setAddingClass(true);
    try {
      const payload: any = { course_id: Number(newCourseId) };
      if (newClassDescription) payload.description = newClassDescription;
      if (newClassRoom) payload.room = newClassRoom;
      if (newClassAcademicYear) payload.academic_year = newClassAcademicYear;
      if (newClassSemester) payload.semester = newClassSemester;

      const created = await classesAPI.createMyClass(payload);

      // Map backend-created class to local `Class` shape (same mapping as list effect)
      const schedules: any[] = Array.isArray(created.schedules) ? created.schedules : [];
      const scheduleStr = schedules
        .map((s) => {
          if (s.type === "normal") {
            return `${s.day_of_week} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}`.trim();
          }
          if (s.type === "special") {
            return `${s.date} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}`.trim();
          }
          return "";
        })
        .filter(Boolean)
        .join(", ");

      const modes = schedules.flatMap((s) => Array.isArray(s.modes) ? s.modes : []);
      const hasOnline = modes.some((m: string) => m.toLowerCase().includes("online"));
      const hasF2f = modes.some((m: string) => m.toLowerCase().includes("face") || m.toLowerCase().includes("f2f") || m.toLowerCase().includes("face_to_face"));
      const mode: Class["mode"] = hasOnline && hasF2f ? "Hybrid" : hasOnline ? "Online" : "In-Person";

      const mapped: Class = {
        id: String(created.id),
        name: created.course_name ?? created.class_code ?? created.course_code ?? `Class ${created.id}`,
        code: created.class_code ?? created.course_code ?? "",
        schedule: scheduleStr || (created.room ? String(created.room) : ""),
        mode,
        enrolledStudents: created.enrolled_students ?? created.students_count ?? 0,
        totalSessions: created.total_sessions ?? 0,
        completedSessions: created.completed_sessions ?? 0,
        attendanceRate: typeof created.attendance_rate === 'number' ? created.attendance_rate : (created.attendance_rate ? Number(created.attendance_rate) : 0),
        status: "Active",
        location: created.room ?? created.location ?? created.organization_name ?? undefined,
        description: created.description ?? undefined,
      } as Class;

      setClasses((prev) => [mapped, ...prev]);
      setAddClassOpen(false);

      // Reset form
      setNewCourseId("");
      setNewClassRoom("");
      setNewClassAcademicYear("");
      setNewClassSemester("");
      setNewClassDescription("");

      toast({ title: "Success", description: "Class created successfully" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to create class", description: String(err?.message ?? err) });
    } finally {
      setAddingClass(false);
    }
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
                        onClick={() => handleNav(item.id)}
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
                                onClick={() => announcementsRef.current?.openNewAnnouncement?.()}
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

                      <ActiveSessions
                        sessions={activeSessions}
                        variant="compact"
                        onEndSession={handleEndSession}
                        onStartSession={handleStartSession}
                      />
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

            {activeTab === "classes" && (
              <ClassesManagement onClassChanged={refreshClassInState} />
            )}

            {/* Attendance Management */}
            {activeTab === "attendance" && (
              <AttendanceTab
                activeSessions={activeSessions}
                onEndSession={handleEndSession}
                onStartSession={handleStartSession}
                onOpenManualAttendance={() => setManualAttendanceOpen(true)}
                onManualEdit={(session) => { setSelectedSession(session); setManualAttendanceOpen(true); }}
                onViewStudent={(student) => { setSelectedStudent((prev) => ({
                  id: student.id,
                  name: student.name,
                  email: student.email,
                  studentId: student.id,
                  classId: student.classId || selectedClass?.id || "",
                  enrollmentStatus: "Enrolled",
                  attendanceRate: 90,
                  totalSessions: 15,
                  presentSessions: 14,
                })); setViewStudentOpen(true); }}
                handleExportReport={handleExportReport}
              />
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
                    <p className="text-sm text-muted-foreground">Communicate with your students across all classes</p>
                  </div>
                  <Button onClick={() => announcementsRef.current?.openNewAnnouncement?.()}>
                    <IconPlus className="w-4 h-4 mr-2" />
                    New Announcement
                  </Button>
                </div>

                {/* Announcements Manager (handles list, create, view, edit) */}
                <AnnouncementsManager ref={announcementsRef} classes={classes} />
              </div>
            )}
          </div>
        </SidebarInset>

        

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

        

        

        
        {/* Manual attendance drawer removed. Attendance edits handled inline or via dedicated flow. */}
      </div>
    </SidebarProvider>
  );
}

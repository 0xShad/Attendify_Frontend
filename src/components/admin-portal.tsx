"use client";

import React, { useState, useMemo, useRef } from "react";
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
} from "@tabler/icons-react";
import { Trash2, Eye, Edit, User } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/data-table";
import { ReportsDataTable } from "@/components/reports-data-table";
import { LogsDataTable } from "@/components/logs-data-table";
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
} from "recharts";

interface User {
  id: string;
  name: string;
  role: string;
  status: string;
  lastActive?: string;
  email?: string;
  avatar?: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  userId: string;
  activity: string;
  status: "success" | "warning" | "error";
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
  color: string;
  trendData: number[];
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
              New login from IP 192.0.2.1
            </div>
            <div className="text-sm text-muted-foreground">
              Attendance report ready
            </div>
            <div className="text-sm text-muted-foreground">
              User Bob Smith added
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Separate component for sidebar user menu that can use useSidebar hook
function SidebarUserMenu({ setSettingsOpen }: { setSettingsOpen: (open: boolean) => void }) {
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
                <AvatarFallback className="rounded-lg bg-blue-500 text-white">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Admin User</span>
                <span className="text-muted-foreground truncate text-xs">
                  admin@attendify.com
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
                  <AvatarFallback className="rounded-lg bg-blue-500 text-white">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    Admin User
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    admin@attendify.com
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

export function AdminPortal() {
  const { toast } = useToast();

  // Navigation
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "reports" | "logs"
  >("dashboard");

  // Sheet and Dialog states
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Mock data
  const [users, setUsers] = useState<User[]>([
    {
      id: "U001",
      name: "Alice Johnson",
      role: "Faculty",
      status: "Active",
      email: "alice.johnson@attendify.com",
      lastActive: "2 minutes ago",
    },
    {
      id: "U002",
      name: "Bob Smith",
      role: "Student",
      status: "Active",
      email: "bob.smith@student.attendify.com",
      lastActive: "1 hour ago",
    },
    {
      id: "U003",
      name: "Carol Lee",
      role: "Admin",
      status: "Inactive",
      email: "carol.lee@attendify.com",
      lastActive: "3 days ago",
    },
  ]);

  // Reports data
  const [reports] = useState([
    {
      id: "RPT001",
      name: "Monthly Attendance Report",
      type: "Attendance Report",
      status: "Completed",
      createdDate: "2025-10-13",
      size: "2.3 MB",
      createdBy: "Admin User"
    },
    {
      id: "RPT002", 
      name: "User Activity Summary",
      type: "User Activity",
      status: "Processing",
      createdDate: "2025-10-13",
      size: "1.8 MB",
      createdBy: "System Admin"
    },
    {
      id: "RPT003",
      name: "System Performance Analysis",
      type: "System Performance", 
      status: "Completed",
      createdDate: "2025-10-12",
      size: "4.5 MB",
      createdBy: "Tech Lead"
    },
    {
      id: "RPT004",
      name: "Custom Dashboard Report",
      type: "Custom Report",
      status: "Failed",
      createdDate: "2025-10-12",
      size: null,
      createdBy: "Admin User"
    }
  ]);

  const [logs] = useState([
    {
      id: 1,
      timestamp: "2025-10-13 08:12",
      userId: "U001",
      activity: "Login Success",
      status: "success" as const,
      ipAddress: "192.168.1.100",
      details: "Successful authentication from desktop application"
    },
    {
      id: 2,
      timestamp: "2025-10-13 08:15",
      userId: "U002", 
      activity: "Attendance Submission",
      status: "success" as const,
      ipAddress: "192.168.1.101",
      details: "Attendance recorded for morning session"
    },
    {
      id: 3,
      timestamp: "2025-10-12 18:02",
      userId: "U003",
      activity: "Failed Login",
      status: "error" as const,
      ipAddress: "192.168.1.102", 
      details: "Invalid credentials - account locked after 3 attempts"
    },
    {
      id: 4,
      timestamp: "2025-10-11 09:44", 
      userId: "U002",
      activity: "Login Success",
      status: "success" as const,
      ipAddress: "192.168.1.101",
      details: "Mobile application login"
    },
    {
      id: 5,
      timestamp: "2025-10-13 14:30",
      userId: "U001",
      activity: "Password Change",
      status: "warning" as const,
      ipAddress: "192.168.1.100",
      details: "Password updated - security notification sent"
    }
  ]);

  // Reports
  const [reportTab, setReportTab] = useState("daily");

  // Attendance chart timeframe
  const [attendanceTimeframe, setAttendanceTimeframe] = useState("7days");

  // User filtering and search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // New user form
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [newRole, setNewRole] = useState("Student");

  // Navigation items
  const navigationItems = [
    { id: "dashboard", icon: IconHome, label: "Dashboard" },
    { id: "users", icon: IconUsers, label: "Users" },
    { id: "reports", icon: IconFileText, label: "Reports" },
    { id: "logs", icon: IconList, label: "System Logs" },
  ];

  // Enhanced Metrics
  const metricCards: MetricCard[] = useMemo(
    () => [
      {
        title: "Total Students",
        value: "1,234",
        change: "+12%",
        trend: "up",
        icon: IconUsers,
        color: "bg-blue-500",
        trendData: [1000, 1050, 1120, 1180, 1210, 1234],
      },
      {
        title: "Faculty Members",
        value: "89",
        change: "+5%",
        trend: "up",
        icon: IconSchool,
        color: "bg-emerald-500",
        trendData: [80, 82, 85, 86, 88, 89],
      },
      {
        title: "Attendance Rate",
        value: "95.2%",
        change: "+2.1%",
        trend: "up",
        icon: IconUserCheck,
        color: "bg-violet-500",
        trendData: [88, 91, 93, 94, 95, 95.2],
      },
      {
        title: "Active Sessions",
        value: "342",
        change: "-8%",
        trend: "down",
        icon: IconClockHour4,
        color: "bg-orange-500",
        trendData: [420, 395, 370, 360, 350, 342],
      },
    ],
    [users]
  );

  // Attendance data for different timeframes
  const attendanceData = useMemo(() => {
    const data = {
      "7days": {
        title: "Last 7 Days",
        chartData: [
          { name: "Mon", attendance: 85 },
          { name: "Tue", attendance: 92 },
          { name: "Wed", attendance: 88 },
          { name: "Thu", attendance: 95 },
          { name: "Fri", attendance: 90 },
          { name: "Sat", attendance: 94 },
          { name: "Sun", attendance: 96 },
        ],
      },
      month: {
        title: "Last 30 Days",
        chartData: [
          { name: "1", attendance: 88 },
          { name: "2", attendance: 91 },
          { name: "3", attendance: 89 },
          { name: "4", attendance: 93 },
          { name: "5", attendance: 87 },
          { name: "6", attendance: 95 },
          { name: "7", attendance: 92 },
          { name: "8", attendance: 89 },
          { name: "9", attendance: 94 },
          { name: "10", attendance: 90 },
          { name: "11", attendance: 93 },
          { name: "12", attendance: 88 },
          { name: "13", attendance: 91 },
          { name: "14", attendance: 96 },
          { name: "15", attendance: 89 },
        ],
      },
      year: {
        title: "Last 12 Months",
        chartData: [
          { name: "Jan", attendance: 89 },
          { name: "Feb", attendance: 91 },
          { name: "Mar", attendance: 88 },
          { name: "Apr", attendance: 93 },
          { name: "May", attendance: 90 },
          { name: "Jun", attendance: 95 },
          { name: "Jul", attendance: 92 },
          { name: "Aug", attendance: 88 },
          { name: "Sep", attendance: 94 },
          { name: "Oct", attendance: 91 },
          { name: "Nov", attendance: 89 },
          { name: "Dec", attendance: 93 },
        ],
      },
    };
    return data[attendanceTimeframe as keyof typeof data];
  }, [attendanceTimeframe]);

  // Chart configuration for shadcn chart component
  const chartConfig = {
    attendance: {
      label: "Attendance %",
      color: "hsl(217, 91%, 60%)",
    },
  };

  // Line chart configuration for user growth
  const lineChartConfig = {
    users: {
      label: "Active Users",
      color: "hsl(142, 76%, 36%)",
    },
    sessions: {
      label: "Sessions",
      color: "hsl(262, 83%, 58%)",
    },
  };

  // Sample data for line chart
  const lineChartData = useMemo(
    () => [
      { month: "Jan", users: 186, sessions: 80 },
      { month: "Feb", users: 305, sessions: 200 },
      { month: "Mar", users: 237, sessions: 120 },
      { month: "Apr", users: 373, sessions: 190 },
      { month: "May", users: 209, sessions: 130 },
      { month: "Jun", users: 314, sessions: 140 },
      { month: "Jul", users: 290, sessions: 160 },
      { month: "Aug", users: 420, sessions: 210 },
      { month: "Sep", users: 380, sessions: 180 },
      { month: "Oct", users: 450, sessions: 230 },
      { month: "Nov", users: 520, sessions: 250 },
      { month: "Dec", users: 600, sessions: 290 },
    ],
    []
  );

  // Filtered users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Handlers
  const handleAddUser = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newName || !newId) {
      toast({
        title: "Error",
        description: "Name and ID are required",
        variant: "destructive",
      });
      return;
    }

    setAddingUser(true);
    await new Promise((r) => setTimeout(r, 800));

    setUsers((prev) => [
      { id: newId, name: newName, role: newRole, status: "Active" },
      ...prev,
    ]);

    setAddingUser(false);
    setAddUserOpen(false);
    setNewName("");
    setNewId("");
    setNewRole("Student");

    toast({
      title: "Success",
      description: "User added successfully",
    });
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setGenerating(false);

    toast({
      title: "Success",
      description: "Report generated and exported",
    });
  };

  const loadDashboard = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleRefreshUsers = () => {
    toast({
      title: "Refreshing",
      description: "User data refreshed successfully",
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    toast({
      title: "Filters Reset",
      description: "All filters have been cleared",
    });
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setDeleteUserOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete));
      setDeleteUserOpen(false);
      setUserToDelete(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    }
  };

  React.useEffect(() => {
    loadDashboard();
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
              <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">
                Attendify
              </span>
            </div>
          </SidebarHeader>

          {/* Navigation Content (nav items are placed at the top) */}
          <SidebarContent className="px-4 flex-1 overflow-y-auto min-h-0">
            <SidebarGroup className="py-4">
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeTab === item.id}
                        onClick={() => setActiveTab(item.id as "dashboard" | "users" | "reports" | "logs")}
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

          {/* Sidebar Footer - Account & Settings (kept at bottom) */}
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
                          "Overview of system performance"}
                        {activeTab === "users" &&
                          "Manage system users and permissions"}
                        {activeTab === "reports" &&
                          "Generate and export reports"}
                        {activeTab === "logs" && "Monitor system activities"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Notifications - dropdown with glass effect */}
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
                    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                      {metricCards.map((metric, index) => (
                        <Card
                          key={index}
                          className="@container/card"
                          data-slot="card"
                        >
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
                          <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                              {metric.trend === "up" && (
                                <>
                                  Trending up this period{" "}
                                  <IconTrendingUp className="size-4" />
                                </>
                              )}
                              {metric.trend === "down" && (
                                <>
                                  Down this period{" "}
                                  <IconTrendingDown className="size-4" />
                                </>
                              )}
                              {metric.trend === "neutral" &&
                                "Stable performance"}
                            </div>
                            <div className="text-muted-foreground">
                              {metric.title === "Total Students" &&
                                "Student enrollment metrics"}
                              {metric.title === "Faculty Members" &&
                                "Active teaching staff"}
                              {metric.title === "Attendance Rate" &&
                                "Overall attendance performance"}
                              {metric.title === "Active Sessions" &&
                                "Current active sessions"}
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>

                    {/* Mobile-First Charts and Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                      {/* Attendance Chart */}
                      <Card className="lg:col-span-2 border shadow-sm bg-stone-50/40 supports-[backdrop-filter]:backdrop-blur-md border-stone-200/50">
                        <CardHeader className="pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <CardTitle className="text-lg">
                              Attendance Trend
                            </CardTitle>
                            <div className="flex gap-2">
                              <Button
                                variant={
                                  attendanceTimeframe === "7days"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setAttendanceTimeframe("7days")}
                              >
                                7 Days
                              </Button>
                              <Button
                                variant={
                                  attendanceTimeframe === "month"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setAttendanceTimeframe("month")}
                              >
                                Month
                              </Button>
                              <Button
                                variant={
                                  attendanceTimeframe === "year"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setAttendanceTimeframe("year")}
                              >
                                Year
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="px-6 pb-6">
                            <ChartContainer
                              config={chartConfig}
                              className="h-48 md:h-64 w-full"
                            >
                              <BarChart
                                accessibilityLayer
                                data={attendanceData.chartData}
                                margin={{
                                  top: 20,
                                  right: 10,
                                  left: 10,
                                  bottom: 20,
                                }}
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
                                  domain={[70, 100]}
                                  tickFormatter={(value) => `${value}%`}
                                  className="text-xs"
                                />
                                <ChartTooltip
                                  cursor={{
                                    fill: "hsl(var(--muted))",
                                    opacity: 0.1,
                                  }}
                                  content={<ChartTooltipContent />}
                                />
                                <Bar
                                  dataKey="attendance"
                                  fill="var(--color-attendance)"
                                  radius={[0, 0, 0, 0]}
                                  className="md:[&>*]:rx-1"
                                />
                              </BarChart>
                            </ChartContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recent Activity */}
                      <Card className="border shadow-sm bg-stone-50/40 supports-[backdrop-filter]:backdrop-blur-md border-stone-200/50">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg">
                            Recent Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {logs.slice(0, 5).map((log) => (
                              <div
                                key={log.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-stone-100/30 touch-feedback"
                              >
                                <div
                                  className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                                    log.status === "success"
                                      ? "bg-green-500"
                                      : log.status === "error"
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {log.activity}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {log.userId} • {log.timestamp}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Users Management */}
            {activeTab === "users" && (
              <div className="space-y-4 md:space-y-6">
                <DataTable
                  data={users.map((user, index) => ({
                    id: user.id,
                    name: user.name,
                    email: user.email || "",
                    role: user.role,
                    status: user.status,
                    lastActive: user.lastActive || "Never",
                    department: undefined, // This can be added to the User interface later
                  }))}
                />
              </div>
            )}

            {/* Reports */}
            {activeTab === "reports" && (
              <div className="space-y-4 md:space-y-6">
                <ReportsDataTable data={reports} />
              </div>
            )}

            {/* System Logs */}
            {activeTab === "logs" && (
              <div className="space-y-4 md:space-y-6">
                <LogsDataTable data={logs} />
              </div>
            )}
          </div>
        </SidebarInset>

        {/* Account Settings Drawer */}
        <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DrawerContent className="max-h-[90vh] mx-auto max-w-md">
            <DrawerHeader className="text-left">
              <DrawerTitle>Account Settings</DrawerTitle>
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
                      defaultValue="Admin User"
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      defaultValue="admin@attendify.com"
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+1 (555) 123-4567"
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input 
                      id="department" 
                      type="text" 
                      defaultValue="Administration"
                      className="mt-1" 
                    />
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Security
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                      id="current-password" 
                      type="password" 
                      placeholder="Enter current password"
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      placeholder="Enter new password"
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      placeholder="Confirm new password"
                      className="mt-1" 
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Preferences
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                    >
                      <option value="utc-5">Eastern Time (UTC-5)</option>
                      <option value="utc-6">Central Time (UTC-6)</option>
                      <option value="utc-7">Mountain Time (UTC-7)</option>
                      <option value="utc-8">Pacific Time (UTC-8)</option>
                    </select>
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
                    <Label htmlFor="email-notifications" className="text-sm font-normal">
                      Email Notifications
                    </Label>
                    <input
                      id="email-notifications"
                      type="checkbox"
                      className="h-4 w-4"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications" className="text-sm font-normal">
                      Push Notifications
                    </Label>
                    <input
                      id="push-notifications"
                      type="checkbox"
                      className="h-4 w-4"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="attendance-alerts" className="text-sm font-normal">
                      Attendance Alerts
                    </Label>
                    <input
                      id="attendance-alerts"
                      type="checkbox"
                      className="h-4 w-4"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-updates" className="text-sm font-normal">
                      System Updates
                    </Label>
                    <input
                      id="system-updates"
                      type="checkbox"
                      className="h-4 w-4"
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete this user? This action cannot be
                undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteUser}>
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}

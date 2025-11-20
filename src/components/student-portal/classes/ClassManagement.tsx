"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Video,
  Wifi,
  Eye,
  UserCheck,
  Megaphone,
  MoreVertical,
  BookOpen,
  Trash2,
  CheckCircle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StudentClasses from ".";
import ClassDetailsDrawer from "./ClassDetailsDrawer";
import ClassFilterDrawer from "./ClassFilterDrawer";
import AttendanceHistoryDrawer from "./AttendanceHistoryDrawer";
import JoinClassDrawer from "./JoinClassDrawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getModeIcon, getModeColor, getNextSessionTime } from "../utils";
import { useStudentClasses } from "./useStudentClasses";

interface EnrolledClass {
  id: string;
  name: string;
  code: string;
  instructor: string;
  instructorAvatar: string;
  schedule: string;
  mode: string;
  location?: string;
  nextSession: Date;
  attendanceRate: number;
  totalSessions: number;
  attendedSessions: number;
  status: string;
  credits: number;
  semester: string;
  description: string;
  syllabus: string;
  announcements: number;
  assignments: number;
  grade: string;
}

interface AttendanceRecord {
  id: string;
  sessionDate: Date;
  status: "Present" | "Absent" | "Late" | "Excused";
  sessionType: "Regular" | "Lab" | "Review";
  duration: number;
}

export default function ClassManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<EnrolledClass | null>(
    null
  );
  const [classDetailsOpen, setClassDetailsOpen] = useState(false);
  const [attendanceHistoryOpen, setAttendanceHistoryOpen] = useState(false);
  const [selectedAttendanceClass, setSelectedAttendanceClass] =
    useState<EnrolledClass | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<
    AttendanceRecord[]
  >([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  // Data & helpers now come from the shared hook
  const { enrolledClasses, activeSessions, generateAttendanceHistory, recentActivity, reload } = useStudentClasses();
  const [joinClassOpen, setJoinClassOpen] = useState(false);

  // Debug: log enrolledClasses to verify data is flowing
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug("[useStudentClasses] enrolledClasses:", enrolledClasses);
  }

  const router = useRouter();

  const handleStartAttendance = (session: any, mode: "face" | "online") => {
    router.push(`/student/attendance?classId=${session.classId}&sessionId=${session.id}&mode=${mode}`);
  };

  // Filter classes based on search and filters
  const filteredClasses = enrolledClasses
    .filter((cls) => {
      const q = searchQuery.trim().toLowerCase();

      // Search filter: check course_name, class_code, course_code and assigned faculty
      const title = (cls.course_name ?? cls.class_code ?? cls.course_code ?? "").toString();
      const code = (cls.class_code ?? cls.course_code ?? "").toString();
      const faculty = (cls.assigned_faculty_name ?? "").toString();

      const matchesSearch =
        q === "" ||
        title.toLowerCase().includes(q) ||
        code.toLowerCase().includes(q) ||
        faculty.toLowerCase().includes(q);

      // Status filter: use cls.status if present, else derive from is_active/session_active
      const derivedStatus = (cls.status ?? (cls.session_active ? "active" : cls.is_active ? "active" : "inactive")).toString();
      const matchesStatus = statusFilter === "all" || derivedStatus === statusFilter;

      // Mode filter: look at first schedule mode
      const modeVal = (cls.normal_schedules?.[0]?.modes?.[0] ?? cls.schedules?.[0]?.modes?.[0] ?? "").toString();
      const matchesMode = modeFilter === "all" || modeVal === modeFilter;

      return matchesSearch && matchesStatus && matchesMode;
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.course_name ?? a.class_code ?? "").toString().localeCompare((b.course_name ?? b.class_code ?? "").toString());
      if (sortBy === "instructor") return (a.assigned_faculty_name ?? "").toString().localeCompare((b.assigned_faculty_name ?? "").toString());
      if (sortBy === "status") return (a.status ?? (a.session_active ? "active" : a.is_active ? "active" : "inactive")).toString().localeCompare((b.status ?? (b.session_active ? "active" : b.is_active ? "active" : "inactive")).toString());
      return 0;
    });

  const handleViewDetails = (classItem: EnrolledClass) => {
    setSelectedClass(classItem);
    setClassDetailsOpen(true);
  };

  const handleViewAttendanceHistory = (classItem: EnrolledClass) => {
    setSelectedAttendanceClass(classItem);
    setAttendanceHistory(generateAttendanceHistory(classItem.id));
    setAttendanceHistoryOpen(true);
  };

  const handleDropClass = (classId: string) => {
    console.log(`Dropping class: ${classId}`);
    toast({
      title: "Drop Request Sent",
      description:
        "Your request to drop the class has been submitted for review.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4">
        {/* Search and Filter (page header already contains the main title) */}
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterDrawerOpen(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button size="sm" onClick={() => setJoinClassOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Join Class
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="enrolled" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enrolled">Enrolled Classes</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="space-y-4">
          <StudentClasses
            enrolledClasses={filteredClasses}
            activeSessions={activeSessions}
            onStartAttendance={handleStartAttendance}
            onViewDetails={handleViewDetails}
            onViewAttendanceHistory={handleViewAttendanceHistory}
            onDropClass={handleDropClass}
          />
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
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClassDetailsDrawer open={classDetailsOpen} onOpenChange={setClassDetailsOpen} selectedClass={selectedClass} />

      <ClassFilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        sortBy={sortBy}
        setSortBy={setSortBy}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        modeFilter={modeFilter}
        setModeFilter={setModeFilter}
      />

      <AttendanceHistoryDrawer
        open={attendanceHistoryOpen}
        onOpenChange={setAttendanceHistoryOpen}
        selectedAttendanceClass={selectedAttendanceClass}
        attendanceHistory={attendanceHistory}
      />
      <JoinClassDrawer
        open={joinClassOpen}
        onOpenChange={setJoinClassOpen}
        onJoinSuccess={() => {
          // reload classes after successful join and show toast
          try {
            reload && reload();
          } catch (e) {
            // ignore
          }
          toast({ title: 'Joined', description: 'Class joined successfully.' });
        }}
      />
    </div>
  );
}

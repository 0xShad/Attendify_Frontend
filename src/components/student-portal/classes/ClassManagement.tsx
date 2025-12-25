"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
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
// Input removed in favor of SearchBar
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
import SearchBar from "./SearchBar";
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
  // UI filter state (front-end only for now)
  const [courseId, setCourseId] = useState<string | number | null>(null);
  const [academicYear, setAcademicYear] = useState<string | null>(null);
  const [semester, setSemester] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<string | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState<string[]>([]);
  const [facultyId, setFacultyId] = useState<string | number | null>(null);
  const [activeNow, setActiveNow] = useState<boolean>(false);

  // Data & helpers now come from the shared hook
  const { enrolledClasses, activeSessions, generateAttendanceHistory, recentActivity, reload } = useStudentClasses();
  const [joinClassOpen, setJoinClassOpen] = useState(false);

  // Debug logging removed

  // Search debounce and remote results
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  const router = useRouter();

  const handleStartAttendance = (session: any, mode: "face" | "online") => {
    router.push(`/student/attendance?classId=${session.classId}&sessionId=${session.id}&mode=${mode}`);
  };

  // Do NOT perform front-end filtering while the user is adjusting filter controls.
  // Only use backend search results (when available) or the full enrolled list.
  const displayedClasses = searchResults !== null ? searchResults : enrolledClasses;

    // Perform remote search against the same-origin proxy /api/classes/mine
    const performSearch = async (q: string) => {
      const trimmed = String(q ?? "").trim();
      const hasFilters = Boolean(
        academicYear || semester || courseId != null || modeFilter || facultyId != null || (Array.isArray(dayOfWeek) && dayOfWeek.length > 0) || activeNow
      );

      // If there's no query and no other filters, clear remote results and don't call backend
      if (!trimmed && !hasFilters) {
        setSearchResults(null);
        setSearchError(null);
        setSearchLoading(false);
        return;
      }
      setSearchLoading(true);
      setSearchError(null);
      try {
          const params = new URLSearchParams();
          params.append('skip', '0');
          params.append('limit', '100');
          if (trimmed) params.append('query', trimmed);
          if (academicYear) params.append('academic_year', String(academicYear));
          if (semester) params.append('semester', String(semester));
          if (courseId != null) params.append('course_id', String(courseId));
          if (modeFilter) params.append('mode', String(modeFilter));
          if (facultyId != null) params.append('faculty_id', String(facultyId));
          // append day_of_week multiple times
          if (Array.isArray(dayOfWeek) && dayOfWeek.length > 0) {
            dayOfWeek.forEach((d) => params.append('day_of_week', d));
          }
          // include active_now only when user explicitly checked it
          if (activeNow) params.append('active_now', 'true');

          const url = `/api/classes/mine?${params.toString()}`;
          const res = await fetch(url, { method: 'GET', credentials: 'same-origin' });
        if (!res.ok) {
          const txt = await res.text().catch(() => res.statusText || '');
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!Array.isArray(json)) {
          setSearchResults([]);
        } else {
          setSearchResults(json);
        }
      } catch (err: any) {
        setSearchError(err?.message ?? String(err));
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    // Debounce effect for live searching
    useEffect(() => {
      // if empty query clear remote results
      if (!searchQuery || !String(searchQuery).trim()) {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        setSearchResults(null);
        setSearchError(null);
        setSearchLoading(false);
        return;
      }

      // schedule debounce
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        performSearch(searchQuery);
      }, 1500);

      return () => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
      };
    }, [searchQuery]);

    const handleImmediateSearch = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      performSearch(searchQuery);
    };

  const handleViewDetails = (classItem: EnrolledClass) => {
    setSelectedClass(classItem);
    setClassDetailsOpen(true);
  };

  const handleViewAttendanceHistory = (classItem: EnrolledClass) => {
    setSelectedAttendanceClass(classItem);
    setAttendanceHistory(generateAttendanceHistory(classItem.id));
    setAttendanceHistoryOpen(true);
  };



  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4">
        {/* Search and Filter (page header already contains the main title) */}
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <div className="flex-1 flex items-center gap-2">
            <SearchBar
              value={searchQuery}
              onChange={(v) => setSearchQuery(v)}
              onSearch={handleImmediateSearch}
              onClear={() => setSearchQuery("")}
              placeholder="Search classes..."
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterDrawerOpen(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="shrink-0">
            <Button size="sm" onClick={() => setJoinClassOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Join Class
            </Button>
          </div>
        </div>
      </div>

          <div className="space-y-4">
            <StudentClasses
              enrolledClasses={displayedClasses}
              activeSessions={activeSessions}
              onStartAttendance={handleStartAttendance}
              onViewDetails={handleViewDetails}
              onViewAttendanceHistory={handleViewAttendanceHistory}

              onAttendanceRecorded={() => { try { reload && reload(); } catch (e) { /* ignore */ } }}
            />
          </div>

      <ClassDetailsDrawer open={classDetailsOpen} onOpenChange={setClassDetailsOpen} selectedClass={selectedClass} />
      {/* derive options from loaded classes for the filter dropdowns (frontend-only for now) */}
      {(() => {
        const courseMap = new Map<string | number, { id: string | number; label: string }>();
        const facultyMap = new Map<string, { id: string | number; label: string }>();
        const years = new Set<string>();
        const semesters = new Set<string>();
        enrolledClasses.forEach((c: any) => {
          const cid = c.id ?? c.class_id ?? c.classCode ?? null;
          const label = c.course_name ?? c.class_code ?? c.course_code ?? String(cid);
          if (cid != null && !courseMap.has(String(cid))) courseMap.set(String(cid), { id: cid, label });
          const fid = c.assigned_faculty_id ?? c.faculty_id ?? null;
          const fname = c.assigned_faculty_name ?? c.faculty_name ?? null;
          if (fname && fid != null && !facultyMap.has(String(fid))) facultyMap.set(String(fid), { id: fid, label: fname });
          if (c.academic_year) years.add(String(c.academic_year));
          if (c.semester) semesters.add(String(c.semester));
        });
        const courseOptions = Array.from(courseMap.values());
        const facultyOptions = Array.from(facultyMap.values());
        const academicYearOptions = Array.from(years.values()).sort();
        const semesterOptions = Array.from(semesters.values()).sort();

        return (
          <ClassFilterDrawer
            open={filterDrawerOpen}
            onOpenChange={setFilterDrawerOpen}
            courseId={courseId}
            setCourseId={setCourseId}
            academicYear={academicYear}
            setAcademicYear={setAcademicYear}
            semester={semester}
            setSemester={setSemester}
            mode={modeFilter}
            setMode={setModeFilter}
            dayOfWeek={dayOfWeek}
            setDayOfWeek={setDayOfWeek}
            facultyId={facultyId}
            setFacultyId={setFacultyId}
            activeNow={activeNow}
            setActiveNow={setActiveNow}
            onApply={handleImmediateSearch}
            courseOptions={courseOptions}
            facultyOptions={facultyOptions}
            academicYearOptions={academicYearOptions}
            semesterOptions={semesterOptions}
          />
        );
      })()}

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

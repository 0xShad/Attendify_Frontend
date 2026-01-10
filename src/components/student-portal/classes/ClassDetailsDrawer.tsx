"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StudentsTab from "./StudentsTab";
import ScheduleTab from "./ScheduleTab";
import { Clock, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedClass?: any | null;
};

// NOTE: removed placeholder/dummy data — component now relies on `selectedClass` or fetched data

// Normalize API-shaped object into the UI-friendly shape used below
const normalizeClass = (c: any) => {
  if (!c) return null;
  const name = c.course_name ?? c.name ?? "Untitled Class";
  const code = c.class_code ?? c.code ?? c.course_code ?? "";
  const semester = c.semester ?? c.academic_year ?? "";
  const academic_year = c.academic_year ?? null;
  const credits = c.credits ?? c.credit_hours ?? 3;
  const instructor = c.assigned_faculty_name ?? c.instructor ?? "Instructor";
  const instructorAvatar = c.instructorAvatar ?? null;
  const program = c.program_name ?? null;
  const organization = c.organization_name ?? null;

  // Build a compact schedule summary: normal schedules first, then special schedules
  const formatTime = (t?: string) => (t ? t.replace(/:00$/, "") : "");
  const normalSummary = (c.normal_schedules || [])
    .map(
      (s: any) =>
        `${String(s.day_of_week).slice(0, 3)} ${formatTime(
          s.start_time
        )}-${formatTime(s.end_time)}${s.location ? ` • ${s.location}` : ""}`
    )
    .join(", ");
  const specialSummary = (c.special_schedules || [])
    .map(
      (s: any) =>
        `${s.date} ${formatTime(s.start_time)}-${formatTime(s.end_time)} @ ${
          s.location || ""
        }`
    )
    .join(", ");
  const schedule =
    normalSummary ||
    specialSummary ||
    (c.schedules && c.schedules.length ? c.schedules[0].date || "" : "");

  const location =
    c.room ?? c.location ?? c.normal_schedules?.[0]?.location ?? "";
  const mode =
    c.normal_schedules?.[0]?.modes?.[0] ?? c.schedules?.[0]?.modes?.[0] ?? "";
  const description = c.description ?? "";
  const attendedSessions =
    c.attendedSessions ??
    c.session_completed ??
    Math.round((c.attendance_rate ?? 0) / 10);
  const totalSessions = c.totalSessions ?? c.session_total ?? 10;
  const attendanceRate = Number(
    c.attendance_rate ?? c.attendanceRate ?? c.attendance_pct ?? 0
  );

  return {
    raw: c,
    id: c.id,
    name,
    code,
    credits,
    semester,
    academic_year,
    grade: c.grade ?? null,
    instructor,
    instructorAvatar,
    program,
    organization,
    schedule,
    location,
    mode,
    description,
    attendedSessions,
    totalSessions,
    attendanceRate,
    students_count: c.students_count ?? c.studentsCount ?? null,
    assigned_secretary_name:
      c.assigned_secretary_name ??
      c.assigned_secretary_name ??
      c.assigned_secretary ??
      null,
    assigned_faculty_name:
      c.assigned_faculty_name ?? c.assigned_faculty_name ?? null,
  };
};

export default function ClassDetailsDrawer({
  open,
  onOpenChange,
  selectedClass,
}: Props) {
  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);
  const cacheRef = React.useRef<Map<number | string, any>>(new Map());

  // Tab content moved to modular components

  React.useEffect(() => {
    if (!open) {
      setData(null);
      return;
    }

    // Determine a stable id for fetching (accept either `id` or `class_id`)
    const classId =
      (selectedClass && (selectedClass.id ?? selectedClass.class_id)) ?? null;

    // If no class id provided, fall back to using the provided selectedClass or null
    if (!classId) {
      setData(normalizeClass(selectedClass ?? null));
      return;
    }

    // If we have cached data for this class, use it
    const cached = cacheRef.current.get(classId);
    if (cached) {
      setData(normalizeClass(cached));
      return;
    }

    // Optimistically render basic info from the list item while fetching details
    if (selectedClass) setData(normalizeClass(selectedClass));
    else setData(null);

    const controller = new AbortController();
    const signal = controller.signal;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/classes/mine/${classId}`, { signal });
        if (!res.ok)
          throw new Error(`Failed to fetch class ${classId}: ${res.status}`);
        const json = await res.json();
        cacheRef.current.set(classId, json);
        setData(normalizeClass(json));
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("ClassDetailsDrawer: failed to load class details", err);
        // keep optimistic/placeholder data in case of error
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [open, selectedClass]);

  return (
    <Drawer open={open} onOpenChange={(v) => onOpenChange?.(v)}>
      <DrawerContent className="max-h-[90vh] mx-auto w-full max-w-2xl flex flex-col">
        <DrawerHeader className="text-left px-4 shrink-0">
          <DrawerTitle className="flex items-center gap-2">
            {data?.name ?? "Class Details"}
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarFallback className="text-base font-semibold">
                  {(data?.name || "U")
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-muted-foreground">
                  {data?.code ?? "—"}
                </div>
                <div className="font-semibold text-lg">
                  {data?.name ?? "Untitled Class"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {data?.program ? `${data.program}` : ""}
                  {data?.organization && data?.program ? " • " : ""}
                  {data?.organization ? data.organization : ""}
                </div>
                <div className="flex flex-col gap-1 mt-2 text-sm">
                  <div>
                    <span className="font-medium">Instructor:</span>{" "}
                    <span className="text-muted-foreground">
                      {data?.assigned_faculty_name ?? data?.instructor ?? "—"}
                    </span>
                  </div>
                  {data?.assigned_secretary_name && (
                    <div>
                      <span className="font-medium">Secretary:</span>{" "}
                      <span className="text-muted-foreground">
                        {data.assigned_secretary_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Academic year
                </div>
                <div className="font-medium text-sm">
                  {data?.academic_year ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Semester</div>
                <div className="font-medium text-sm">
                  {data?.semester ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Students</div>
                <div className="font-medium text-sm">
                  {data?.students_count ?? data?.raw?.students_count ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Attendance</div>
                <div
                  className={`font-medium text-sm ${
                    Number(data?.attendanceRate) >= 90
                      ? "text-green-600"
                      : Number(data?.attendanceRate) >= 75
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {data?.attendanceRate != null
                    ? `${Number(data.attendanceRate).toFixed(2)}%`
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {data?.schedule && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <div className="truncate">
                {data.schedule}
                {data.mode ? ` • ${data.mode}` : ""}
                {data.location ? ` • ${data.location}` : ""}
              </div>
            </div>
          )}
          {data?.description && (
            <div className="text-sm text-muted-foreground">
              {data.description}
            </div>
          )}

          <Tabs defaultValue="students">
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="pt-4">
              <StudentsTab classData={data} />
            </TabsContent>

            <TabsContent value="schedule" className="pt-4">
              <ScheduleTab classData={data} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Drawer can be closed by dragging; footer button removed intentionally */}
      </DrawerContent>
    </Drawer>
  );
}

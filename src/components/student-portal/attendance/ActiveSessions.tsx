"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Camera, AlertTriangle } from "lucide-react";
import AttendanceTake from "@/components/student-portal/attendance/TakeAttendance";
import { getMyClassSession } from "@/lib/api/classes";
import { useToast } from '@/hooks/use-toast';

type AttendanceSession = {
  id: string;
  classId: string;
  className: string;
  instructor: string;
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  mode: "Online" | "In-Person";
  location: string;
  coordinates?: { lat: number; lng: number };
  requiresFaceRecognition: boolean;
  allowOnlineMode: boolean;
  cutoffTime: number;
  studentsPresent: number;
  totalStudents: number;
  timeRemaining: number;
};

export default function ActiveSessions({
  currentLocation,
  isWithinLocationRange,
  handleStartAttendance,
  formatTimeRemaining,
}: {
  currentLocation: { lat: number; lng: number } | null;
  isWithinLocationRange: (session: AttendanceSession) => boolean;
  handleStartAttendance: (session: AttendanceSession, mode: "face" | "online") => void;
  formatTimeRemaining: (minutes: number) => string;
}) {
  const [classes, setClasses] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [checkingSession, setCheckingSession] = useState<string | null>(null);

  // reusable loader so we can refresh after recording
  const loadClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const mod = await import("@/lib/api/classes");
      const data = await mod.listMyClasses({ limit: 200 });
      // helpful debug: log backend response shape so we can see available fields
      // (remove or guard this in production)
      // eslint-disable-next-line no-console
      console.debug("ActiveSessions: listMyClasses response:", data);
      // Filter to only active classes
      const active = Array.isArray(data) ? data.filter((c: any) => c.is_active) : [];
      setClasses(active);
    } catch (err: any) {
      console.error("ActiveSessions: failed to load classes", err);
      setError(err?.message ? String(err.message) : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses().catch(() => {});
  }, []);

  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceSession, setAttendanceSession] = useState<any | null>(null);

  const list = classes ?? [];

  return (
    <div className="space-y-4">
      {loading && list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Loading Active Sessions</h3>
            <p className="text-muted-foreground text-center">Fetching active classes...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">Error loading classes: {error}</CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Sessions</h3>
            <p className="text-muted-foreground text-center">There are no active classes right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((cls: any) => {
            const sessionActive = Boolean(cls.session_active);
            const scheduled = Boolean(cls.is_active);

            const presentOrLate = Number(
              cls.session_present_or_late_count ??
              cls.session_present_or_late ??
              cls.present_or_late_count ??
              cls.session_present_count ??
              cls.present_count ??
              0
            );

            const present = Number(cls.session_present_count ?? cls.present_count ?? 0);
            const late = Number(cls.session_late_count ?? cls.late_count ?? 0);

            const studentsCount = Number(
              cls.students_count ??
              cls.studentsCount ??
              (Array.isArray(cls.students) ? cls.students.length : undefined) ??
              0
            ) || 0;

            const schedule = cls.next_schedule ?? (Array.isArray(cls.normal_schedules) && cls.normal_schedules[0]) ?? null;
            const startTime = schedule?.start_time ? String(schedule.start_time).slice(0,5) : "TBA";
            const endTime = schedule?.end_time ? String(schedule.end_time).slice(0,5) : "TBA";
            const date = schedule?.date ?? cls.date ?? new Date().toISOString().split("T")[0];

            const isNearby = (() => {
              const coords = (cls.coordinates ?? cls.next_schedule?.coordinates) ?? null;
              if (!coords) return true;
              return isWithinLocationRange({
                id: String(cls.active_session_id ?? cls.id),
                classId: String(cls.id),
                className: cls.course_name ?? cls.class_code ?? cls.course_code ?? cls.name ?? "",
                instructor: cls.assigned_faculty_name ?? cls.assigned_faculty ?? "",
                date,
                startTime,
                endTime,
                isActive: Boolean(cls.session_active),
                mode: (schedule?.modes && schedule.modes[0]) ? String(schedule.modes[0]) as any : (cls.f2f_activated ? "In-Person" : "Online"),
                location: schedule?.location ?? cls.room ?? "",
                coordinates: coords,
                requiresFaceRecognition: Boolean(cls.f2f_activated),
                allowOnlineMode: Boolean(cls.allowOnlineMode ?? cls.allow_online_mode ?? false),
                cutoffTime: Number(cls.cutoffTime ?? cls.cutoff_time ?? 10),
                studentsPresent: present,
                totalStudents: studentsCount,
                timeRemaining: Number(cls.timeRemaining ?? cls.time_remaining ?? 0),
              } as AttendanceSession);
            })();

            const progressPct = studentsCount > 0 ? Math.round((presentOrLate / studentsCount) * 10000) / 100 : 0;

            return (
              <Card key={cls.id} className={`${sessionActive ? "border-green-200 bg-green-50/30" : "border-gray-200"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {cls.course_name ?? cls.class_code ?? cls.course_code ?? cls.name}
                        {sessionActive ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                            Live
                          </Badge>
                        ) : scheduled ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Scheduled
                          </Badge>
                        ) : null}
                      </CardTitle>
                      <CardDescription>
                        {cls.assigned_faculty_name ?? cls.instructor ?? "Instructor"} • {date}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="shrink-0">{sessionActive ? "Live" : (scheduled ? "Scheduled" : "—")}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{startTime} - {endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{schedule?.location ?? cls.room ?? ""}</span>
                    </div>
                  </div>

                  {sessionActive && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Class Attendance</span>
                        <span>{presentOrLate}/{studentsCount} present</span>
                      </div>
                      <Progress value={progressPct} className="h-2" />
                    </div>
                  )}

                  {cls.f2f_activated && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className={`w-4 h-4 ${isNearby ? "text-green-500" : "text-red-500"}`} />
                      <span className={isNearby ? "text-green-700" : "text-red-700"}>
                        {isNearby ? "Within classroom range" : "Too far from classroom"}
                      </span>
                    </div>
                  )}

                  {sessionActive ? (
                    <div className="flex gap-2">
                      <Button onClick={async () => {
                        const classId = cls.id ?? cls.class_id ?? null;
                        if (!classId) {
                          toast({ title: 'Error', description: 'Missing class id', variant: 'destructive' });
                          return;
                        }

                        // indicate we're checking this session (used to disable repeated clicks)
                        setCheckingSession(String(classId));
                        try {
                            const resp = await getMyClassSession(Number(classId));
                            // if backend signals message that attendance already recorded, don't open modal
                            const msg = resp?.session_message ?? resp?.message ?? null;
                            const already = resp?.already_submitted ?? resp?.attendance_recorded ?? false;
                            if ((msg && /already submitted/i.test(String(msg))) || already) {
                              try { toast({ title: 'Attendance', description: String(msg || 'You have already submitted attendance for this session.' ) }); } catch (e) {}
                              return;
                            }

                            // Determine session modes. Prefer server-provided current_schedule_modes or current_schedule.modes
                            const modesRaw = Array.isArray(resp?.current_schedule_modes) && resp.current_schedule_modes.length > 0
                              ? resp.current_schedule_modes
                              : resp?.current_schedule?.modes ?? schedule?.modes ?? null;
                            const modes = Array.isArray(modesRaw) ? modesRaw.map((m: any) => String(m ?? '').toLowerCase()) : [];

                            // If session is face-to-face, trigger the face flow (external handler) instead of opening the online modal
                            if (modes.includes('face_to_face') || modes.includes('f2f') || modes.includes('face-to-face')) {
                              try {
                                const sessionObj = {
                                  class: resp?.class ?? cls,
                                  active_session_id: resp?.active_session_id ?? resp?.session_id ?? cls.active_session_id ?? cls.id,
                                  current_schedule: resp?.current_schedule ?? schedule,
                                  current_schedule_modes: resp?.current_schedule_modes ?? (schedule?.modes ?? null),
                                  session_active: resp?.session_active ?? sessionActive,
                                } as any;
                                handleStartAttendance(sessionObj, 'face');
                              } catch (e) {
                                try { toast({ title: 'Error', description: 'Failed to start face attendance', variant: 'destructive' }); } catch (ee) {}
                              }
                              return;
                            }

                            // Only open the TakeAttendance modal for online/hybrid modes
                            if (modes.includes('online') || modes.includes('hybrid')) {
                              setAttendanceSession(resp ?? {
                                class: cls,
                                active_session_id: cls.active_session_id ?? cls.id,
                                current_schedule: schedule,
                                current_schedule_modes: schedule?.modes ?? (cls.normal_schedules && cls.normal_schedules[0]?.modes) ?? null,
                                session_active: sessionActive,
                              });
                              setAttendanceOpen(true);
                            } else {
                              // Unknown or unsupported mode: inform the user
                              try { toast({ title: 'Attendance', description: msg ?? 'Attendance for this session is not available for your client.', variant: 'destructive' }); } catch (e) {}
                            }
                        } catch (err: any) {
                          const msg = err?.message ?? String(err);
                          try { toast({ title: 'Error', description: msg, variant: 'destructive' }); } catch (e) {}
                        } finally {
                          setCheckingSession(null);
                        }
                      }} className="flex-1" disabled={checkingSession === String(cls.id)}>
                        <Camera className="w-4 h-4 mr-2" />
                        Attendance
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Attendance not yet open</Badge>
                      <div className="text-xs text-muted-foreground mt-1">The session is scheduled now; attendance will open when the instructor starts it.</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Attendance modal (per-class) */}
      <AttendanceTake
        open={attendanceOpen}
        onOpenChange={(v: boolean) => {
          setAttendanceOpen(v);
          if (!v) setAttendanceSession(null);
        }}
        classItem={attendanceSession?.class}
        sessionInfo={attendanceSession}
        onRecorded={() => {
          // refresh list after a successful record
          loadClasses().catch(() => {});
        }}
      />
    </div>
  );
}
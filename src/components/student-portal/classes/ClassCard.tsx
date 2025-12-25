"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Eye, UserCheck, Clock, Calendar, MapPin } from "lucide-react";
import TakeAttendance from "./TakeAttendance";
import StartSessionDialog from "./StartSessionDialog";
import { useRouter } from "next/navigation";
import { getMyClassSession } from "@/lib/api/classes";
import { useToast } from "@/hooks/use-toast";
import { normalizeAttendanceRate, parseDateOnly, formatTime } from "@/lib/utils/format";
import type { EnrolledClass, ClassWithSchedules } from "./types";

export default function ClassCard({
  classItem,
  onViewDetails,
  onViewAttendanceHistory,
  onAttendanceRecorded,
}: {
  classItem: EnrolledClass | ClassWithSchedules;
  onViewDetails?: (c: EnrolledClass | ClassWithSchedules) => void;
  onViewAttendanceHistory?: (c: EnrolledClass | ClassWithSchedules) => void;
  onAttendanceRecorded?: (record?: any) => void;
}) {
  const [takeOpen, setTakeOpen] = React.useState(false);
  const [checkingSession, setCheckingSession] = React.useState(false);
  const [startDialogOpen, setStartDialogOpen] = React.useState(false);
  const [startDialogInitialSession, setStartDialogInitialSession] = React.useState<any | null>(null);
  const { toast } = useToast();
  const [sessionInfo, setSessionInfo] = React.useState<any | null>(null);
  const sessionEndedToday = Boolean((classItem as any).session_ended_today);
  const router = useRouter();
  // Safe helpers
  const studentsText = typeof classItem.students_count === "number" ? `${classItem.students_count} students` : "-";
  // Attendance % should be based on the student's sessions: session_completed / session_total
  const rawFraction = (Number(classItem.session_total ?? 0) > 0) ? (Number(classItem.session_completed ?? 0) / Number(classItem.session_total ?? 1)) : 0;
  const ratePct = normalizeAttendanceRate(rawFraction);
  const rateRounded = Math.round(ratePct * 100) / 100;

  // Normalize session counters from possible backend field names
  const sessionCompleted = Number(
    classItem.session_completed ?? classItem.sessionCompleted ?? classItem.attendedSessions ?? classItem.attended_sessions ?? 0
  );
  const sessionTotal = Number(
    classItem.session_total ?? classItem.sessionTotal ?? classItem.totalSessions ?? classItem.total_sessions ?? 0
  );

  // Derive a compact schedule-days string like "Mon, Wed, Fri" from available schedule fields
  // Prefer normal_schedules, then schedules, but also include special_schedules if present
  // Merge all schedule sources so we don't miss weekday entries present in either array
  const scheduleSources: any[] = [];
  if (Array.isArray(classItem.normal_schedules)) scheduleSources.push(...classItem.normal_schedules);
  if (Array.isArray(classItem.schedules)) scheduleSources.push(...classItem.schedules);
  if (Array.isArray(classItem.special_schedules)) scheduleSources.push(...classItem.special_schedules);
  const weekdayNames: string[] = [];
  const specialDates: string[] = [];
  if (Array.isArray(scheduleSources)) {
    scheduleSources.forEach((s: any) => {
      if (!s) return;
      // day_of_week as string or number
      if (s.day_of_week != null) {
        weekdayNames.push(String(s.day_of_week));
        return;
      }

      // common array fields
      if (s.days && Array.isArray(s.days)) {
        s.days.forEach((d: any) => weekdayNames.push(String(d)));
        return;
      }
      if (s.weekdays && Array.isArray(s.weekdays)) {
        s.weekdays.forEach((d: any) => weekdayNames.push(String(d)));
        return;
      }
      if (s.days_of_week && Array.isArray(s.days_of_week)) {
        s.days_of_week.forEach((d: any) => weekdayNames.push(String(d)));
        return;
      }

      // sometimes schedules include a nested repeat or rule
      if (s.repeat && Array.isArray(s.repeat.days)) {
        s.repeat.days.forEach((d: any) => weekdayNames.push(String(d)));
        return;
      }

      // comma-separated string of days
      if (s.days && typeof s.days === 'string' && s.days.includes(',')) {
        s.days.split(',').map((x: string) => x.trim()).forEach((d: any) => weekdayNames.push(String(d)));
        return;
      }

      // If there is a specific date, add to specialDates and also derive weekday
      if (s.date) {
        const dt = parseDateOnly(String(s.date));
        if (dt) {
          specialDates.push(dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }));
          // derive weekday from date (0=Sun..6=Sat)
          const wk = dt.getDay();
          // map 0-6 to weekday names
          const map = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          weekdayNames.push(map[wk]);
        } else {
          specialDates.push(String(s.date));
        }
        return;
      }

      // last resort: if object has numeric day field
      if (typeof s.day === 'number') {
        weekdayNames.push(String(s.day));
        return;
      }
    });
  }

  

  const shortDay = (val: string) => {
    const v = String(val).trim();
    const lower = v.toLowerCase();
    if (/mon/i.test(lower)) return 'Mon';
    if (/tue/i.test(lower)) return 'Tue';
    if (/wed/i.test(lower)) return 'Wed';
    if (/thu/i.test(lower)) return 'Thu';
    if (/fri/i.test(lower)) return 'Fri';
    if (/sat/i.test(lower)) return 'Sat';
    if (/sun/i.test(lower)) return 'Sun';
    const n = Number(v);
    if (!Number.isNaN(n) && n >= 1 && n <= 7) {
      return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][n-1];
    }
    return '';
  };

  const fullDay = (val: string) => {
    const v = String(val).trim();
    const lower = v.toLowerCase();
    if (/mon/i.test(lower)) return 'Monday';
    if (/tue/i.test(lower)) return 'Tuesday';
    if (/wed/i.test(lower)) return 'Wednesday';
    if (/thu/i.test(lower)) return 'Thursday';
    if (/fri/i.test(lower)) return 'Friday';
    if (/sat/i.test(lower)) return 'Saturday';
    if (/sun/i.test(lower)) return 'Sunday';
    const n = Number(v);
    if (!Number.isNaN(n) && n >= 1 && n <= 7) {
      return ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][n-1];
    }
    return '';
  };

  let scheduleDays = Array.from(new Set(weekdayNames.map(fullDay))).filter(Boolean);

  // If no weekdays found from schedules, try inferring from next_schedule.day_of_week
  if (scheduleDays.length === 0 && classItem.next_schedule && classItem.next_schedule.day_of_week) {
    const inferred = fullDay(String(classItem.next_schedule.day_of_week));
    if (inferred) scheduleDays = [inferred];
  }

  const scheduleDaysStr = scheduleDays.length ? scheduleDays.join(', ') : '';
  const scheduleSpecialStr = specialDates.length ? specialDates.join(', ') : '';

  // Development logs removed

  // Compute next occurrence from schedules (returns {date: Date, start_time, end_time, weekdayName} or null)
  const parseTimeToParts = (t?: string | null) => {
    if (!t) return null;
    const m = String(t).match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return { hours: Number(m[1]), minutes: Number(m[2]) };
  };

  const dayNameToIndex = (val: string) => {
    const v = String(val).trim().toLowerCase();
    if (/sun/i.test(v)) return 0;
    if (/mon/i.test(v)) return 1;
    if (/tue/i.test(v)) return 2;
    if (/wed/i.test(v)) return 3;
    if (/thu/i.test(v)) return 4;
    if (/fri/i.test(v)) return 5;
    if (/sat/i.test(v)) return 6;
    const n = Number(v);
    if (!Number.isNaN(n)) return n % 7; // map 1..7 -> 1..0 pattern (7 -> 0)
    return null;
  };

  const now = new Date();

  const candidates: Array<{date: Date; start?: string; end?: string}> = [];

  // if classItem.next_schedule has a date or start_time, prefer it as a candidate
  if (classItem.next_schedule) {
    const nd = parseDateOnly(classItem.next_schedule.date ?? null);
    if (nd) {
      // attach start/end time if present
      const p = parseTimeToParts(classItem.next_schedule.start_time);
      if (p) {
        nd.setHours(p.hours, p.minutes, 0, 0);
      }
      candidates.push({ date: nd, start: classItem.next_schedule.start_time, end: classItem.next_schedule.end_time });
    } else if (classItem.next_schedule.day_of_week) {
      const idx = dayNameToIndex(String(classItem.next_schedule.day_of_week));
      const tp = parseTimeToParts(classItem.next_schedule.start_time);
      if (idx != null) {
        const delta = (idx - now.getDay() + 7) % 7 || 7; // next occurrence (if today, use next week)
        const d = new Date(now);
        d.setDate(now.getDate() + delta);
        if (tp) d.setHours(tp.hours, tp.minutes, 0, 0);
        candidates.push({ date: d, start: classItem.next_schedule.start_time, end: classItem.next_schedule.end_time });
      }
    }
  }

  // scan scheduleSources for date-specific or weekly entries
  if (Array.isArray(scheduleSources)) {
    scheduleSources.forEach((s: any) => {
      if (!s) return;
      if (s.date) {
        const dt = parseDateOnly(String(s.date));
        if (dt) {
          const tp = parseTimeToParts(s.start_time ?? s.startTime ?? null);
          if (tp) dt.setHours(tp.hours, tp.minutes, 0, 0);
          candidates.push({ date: dt, start: s.start_time ?? s.startTime, end: s.end_time ?? s.endTime });
          return;
        }
      }
      // weekly entries
      const fields = ['day_of_week','day','weekday','week_day'];
      for (const f of fields) {
        if (s[f] != null) {
          const idx = dayNameToIndex(String(s[f]));
          if (idx != null) {
            const tp = parseTimeToParts(s.start_time ?? s.startTime ?? null);
            let delta = (idx - now.getDay() + 7) % 7;
            // if same day and start time already passed, advance a week
            if (delta === 0 && tp) {
              const todayStart = new Date(now);
              todayStart.setHours(tp.hours, tp.minutes, 0, 0);
              if (todayStart <= now) delta = 7;
            }
            const d = new Date(now);
            d.setDate(now.getDate() + delta);
            if (tp) d.setHours(tp.hours, tp.minutes, 0, 0);
            candidates.push({ date: d, start: s.start_time ?? s.startTime, end: s.end_time ?? s.endTime });
          }
        }
      }
      // arrays of days
      if (Array.isArray(s.days) || Array.isArray(s.weekdays) || Array.isArray(s.days_of_week)) {
        const arr = s.days ?? s.weekdays ?? s.days_of_week;
        arr.forEach((dVal: any) => {
          const idx = dayNameToIndex(String(dVal));
          if (idx != null) {
            const tp = parseTimeToParts(s.start_time ?? s.startTime ?? null);
            let delta = (idx - now.getDay() + 7) % 7;
            if (delta === 0 && tp) {
              const todayStart = new Date(now);
              todayStart.setHours(tp.hours, tp.minutes, 0, 0);
              if (todayStart <= now) delta = 7;
            }
            const d = new Date(now);
            d.setDate(now.getDate() + delta);
            if (tp) d.setHours(tp.hours, tp.minutes, 0, 0);
            candidates.push({ date: d, start: s.start_time ?? s.startTime, end: s.end_time ?? s.endTime });
          }
        });
      }
    });
  }

  // choose the earliest candidate in the future
  const futureCandidates = candidates.filter(c => c.date && c.date.getTime() >= now.getTime());
  futureCandidates.sort((a,b) => a.date.getTime() - b.date.getTime());
  const next = futureCandidates.length ? futureCandidates[0] : (candidates.length ? candidates.sort((a,b)=>a.date.getTime()-b.date.getTime())[0] : null);

  const renderNextLine = () => {
    if (next && next.date) {
      const d = next.date;
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Manila' });
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
      const start = next.start ? formatTime(next.start) : '';
      const end = next.end ? formatTime(next.end) : '';
      const timeStr = start && end ? `${start} - ${end}` : (start || end || 'TBA');
      return `${weekday}, ${dateStr} — ${timeStr} (${weekday})`;
    }
    return null;
  };

  // Compact Next display: "November 28 - 01:00 PM (Friday)"
  const formatNextCompact = (candidate: {date: Date; start?: string | null; end?: string | null} | null) => {
    if (!candidate || !candidate.date) return null;
    const d = candidate.date;
    const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'Asia/Manila' });
    // prefer candidate.start, fallback to classItem.next_schedule.start_time
    const startRaw = candidate.start ?? classItem.next_schedule?.start_time;
    const timeStr = startRaw ? new Date(d.getTime()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }) : 'TBA';
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Manila' });
    return `${dateStr} - ${timeStr} (${weekday})`;
  };

  const nextCompact = formatNextCompact(next ?? null) || (classItem.next_schedule && (() => {
    const nd = parseDateOnly(classItem.next_schedule?.date as any);
    if (nd) {
      const dateStr = nd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'Asia/Manila' });
      const timeStr = classItem.next_schedule?.start_time ? nd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }) : 'TBA';
      const weekday = nd.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Manila' });
      return `${dateStr} - ${timeStr} (${weekday})`;
    }
    return null;
  })()) || null;

  // Only show Attendance when the class is active and the active schedule's modes
  // include either "online" or "hybrid" (case-insensitive). If `current_schedule_modes`
  // is missing or not an array, do not show the button.
  // Derive active schedule modes from the server-provided `current_schedule_modes` if present.
  // If empty, attempt to find the schedule matching `current_schedule_id` across available
  // schedule arrays (`normal_schedules`, `special_schedules`, `schedules`) and use its `modes`.
  const activeScheduleModes: string[] = (() => {
    try {
      if (Array.isArray(classItem?.current_schedule_modes) && classItem.current_schedule_modes.length > 0) {
        return classItem.current_schedule_modes.map((m: any) => String(m ?? '').toLowerCase()).filter(Boolean);
      }

      const allSchedules = [
        ...(Array.isArray(classItem?.normal_schedules) ? classItem.normal_schedules : []),
        ...(Array.isArray(classItem?.special_schedules) ? classItem.special_schedules : []),
        ...(Array.isArray(classItem?.schedules) ? classItem.schedules : []),
      ];

      const cid = classItem?.current_schedule_id;
      if (cid != null) {
        const found = allSchedules.find((s: any) => s && (s.id === cid || String(s.id) === String(cid)));
        if (found && Array.isArray(found.modes) && found.modes.length) {
          return found.modes.map((m: any) => String(m ?? '').toLowerCase()).filter(Boolean);
        }
      }

      // Fallback: pick the first schedule that has modes defined
      for (const s of allSchedules) {
        if (s && Array.isArray(s.modes) && s.modes.length) {
          return s.modes.map((m: any) => String(m ?? '').toLowerCase()).filter(Boolean);
        }
      }

      return [];
    } catch (e) {
      return [];
    }
  })();

  // Top-level rule: if `session_active` is explicitly false, do NOT show the Attendance button.
  // Otherwise, show it when the class is active + schedule supports online/hybrid, or when
  // this device is a secretary and F2F scanning is enabled for the class.
  const showAttendanceButton = Boolean(
    classItem?.session_active !== false && (
      (classItem?.is_active && Array.isArray(activeScheduleModes) && activeScheduleModes.some((mode) => mode === 'online' || mode === 'hybrid'))
      || (classItem?.is_secretary && Boolean(classItem?.f2f_activated))
    )
  );

  return (
    <>
      <Card key={classItem.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{classItem.class_code ?? classItem.course_code ?? ""}</Badge>
              <div className="text-muted-foreground text-xs">{classItem.program_name ?? classItem.organization_name ?? ""}</div>
            </div>
            <CardTitle className="text-lg line-clamp-2 mt-1">{classItem.course_name ?? classItem.class_code ?? `Class ${classItem.id}`}</CardTitle>
            <CardDescription className="mt-1 text-sm">{classItem.description ?? ""}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-sm font-medium">{studentsText}</div>
            {classItem.session_active ? (
              <Badge className="bg-red-50 text-red-600">Session Live</Badge>
            ) : classItem.is_active ? (
              <Badge className="bg-green-50 text-green-700">Active</Badge>
            ) : (
              <Badge className="bg-muted/10">Inactive</Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                    {classItem.is_secretary ? (
                      <DropdownMenuItem
                        onClick={() => { if (!sessionEndedToday) setStartDialogOpen(true); }}
                        disabled={sessionEndedToday}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {sessionEndedToday ? 'Session Ended' : 'Start Session'}
                      </DropdownMenuItem>
                    ) : null}
                <DropdownMenuItem onClick={() => onViewDetails && onViewDetails(classItem)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewAttendanceHistory && onViewAttendanceHistory(classItem)}>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Attendance History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center justify-center w-4 h-4">
                  <Clock className="w-4 h-4 text-muted-foreground" style={{ display: 'inline-block' }} />
                </span>
              <div>
                <div className="text-sm">
                  <div className="font-medium whitespace-normal md:whitespace-nowrap">Next : {nextCompact ?? 'TBA'}</div>
                </div>

                {/* (moved) schedule days will show under the Calendar row */}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {typeof MapPin === 'function' ? (
                <MapPin className="w-4 h-4 text-muted-foreground" />
              ) : (
                <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              )}
              <span className="truncate">{classItem.room ?? classItem.next_schedule?.location ?? ""}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                {scheduleDaysStr ? scheduleDaysStr : (scheduleSpecialStr ? scheduleSpecialStr : 'No schedule')}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {/* session summary removed from here — attendance bar is in the footer */}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="w-full">
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="font-medium">Sessions</span>
                <span className="text-xs text-muted-foreground">{`${sessionCompleted}/${sessionTotal}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>
                  {classItem.session_insight ?? (rateRounded >= 100 ? "Perfect" : rateRounded >= 90 ? "Excellent" : rateRounded >= 80 ? "Good" : rateRounded >= 70 ? "Below Average" : rateRounded >= 50 ? "Critical" : "Critical")}
                </Badge>
                <span>{rateRounded}%</span>
              </div>
            </div>
            <div className="mt-1">
              <Progress value={rateRounded} className="h-2" />
            </div>
          </div>

          <div>
            {showAttendanceButton ? (
              <Button
                onClick={async () => {
                  // Prevent double clicks
                  if (checkingSession) return;
                  setCheckingSession(true);
                  try {
                    const resp = await getMyClassSession(Number(classItem.id));
                    // The endpoint returns top-level fields including `is_active` and
                    // `current_schedule` (object) or `current_schedule_id` and schedule lists.
                    const isActive = !!resp?.is_active;
                    const sessionActive = !!resp?.session_active;
                    const sessionMessage = typeof resp?.session_message === 'string' ? String(resp.session_message) : null;

                    // Determine schedule modes early so we can use them for decision logic
                    const modesRaw = (Array.isArray(resp?.current_schedule_modes) && resp.current_schedule_modes.length > 0)
                      ? resp.current_schedule_modes
                      : resp?.current_schedule?.modes ?? [];
                    const modes = Array.isArray(modesRaw) ? modesRaw.map((m: any) => String(m ?? '').toLowerCase()) : [];

                    // Determine whether this session is effectively face-to-face (either backend flag or schedule mode)
                    const isF2FMode = Boolean(resp?.f2f_activated) || modes.includes('face_to_face') || modes.includes('face-to-face') || modes.includes('f2f');

                    // Respect explicit server-side `session_ended_today` flag.
                    // If the backend reports the session was ended today, do not allow
                    // opening the StartSessionDialog even if an active session id exists.
                    const sessionEndedFlag = Boolean(resp?.session_ended_today ?? resp?.sessionEndedToday ?? (classItem as any)?.session_ended_today);
                    if (sessionEndedFlag) {
                      // Prefer a helpful message instead of opening the dialog.
                      toast({ title: 'Session ended', description: 'Attendance session for this class has already ended today.', variant: 'destructive' });
                      return;
                    }

                    // If backend reports the user already submitted attendance, normally surface that and don't open the modal.
                    // However, allow secretary devices when the session is face-to-face so the secretary can still open
                    // the StartSessionDialog (pre-populated) and scan students.
                    if (sessionMessage && sessionMessage.toLowerCase().includes('already submitted')) {
                      if (!(classItem.is_secretary && isF2FMode)) {
                        toast({ title: 'Attendance submitted', description: sessionMessage, variant: 'default' });
                        return;
                      }
                      // else: secretary + f2F mode -> fallthrough to open scanner
                    }

                    // Allowed for students: only when schedule supports online or hybrid modes.
                    // For secretaries, allow when session is face-to-face so they can scan attendees.
                    const allowed = isActive && sessionActive && (modes.some((m: string) => m === 'online' || m === 'hybrid') || (classItem.is_secretary && isF2FMode));
                    if (allowed) {
                          // If this device is a secretary and the server says f2f scanning is activated,
                          // open the StartSessionDialog pre-populated so the secretary can scan without
                          // going through setup/creation steps.
                          if (classItem.is_secretary && isF2FMode) {
                            // Build an initialSession object to tell StartSessionDialog that
                            // a session already exists and F2F scanning should be used.
                            const initial = Object.assign({}, resp ?? {});
                            // Ensure the dialog sees F2F activated and an `id` the camera handler can use.
                            initial.f2f_activated = true;
                            initial.id = initial.active_session_id ?? initial.session_id ?? initial.id ?? null;
                            setStartDialogInitialSession(initial);
                            setStartDialogOpen(true);
                          } else {
                            // preserve the server-provided session payload for the modal (student flow)
                            setSessionInfo(resp ?? null);
                            setTakeOpen(true);
                          }
                        } else {
                      // Provide clearer feedback depending on why access is denied
                      if (!sessionActive) {
                        const msg = resp?.session_message ?? 'There is no open session for this class schedule right now.';
                        toast({ title: 'No active session', description: msg, variant: 'destructive' });
                      } else if (!isActive) {
                        toast({ title: 'Class not active', description: 'This class is not currently active.', variant: 'destructive' });
                      } else {
                        toast({ title: 'Attendance unavailable', description: 'This class is not currently available for online attendance.', variant: 'destructive' });
                      }
                    }
                  } catch (err: any) {
                    const msg = err?.message ? String(err.message) : String(err);
                    toast({ title: 'Unable to check session', description: msg, variant: 'destructive' });
                  } finally {
                      setCheckingSession(false);
                    }
                }}
                className="w-full"
                disabled={checkingSession}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {checkingSession ? 'Checking...' : 'Attendance'}
              </Button>
            ) : null}
          </div>
        </div>
      </CardFooter>
    </Card>

      <TakeAttendance
        open={takeOpen}
        onOpenChange={(v) => {
          setTakeOpen(v);
          if (!v) setSessionInfo(null);
        }}
        classItem={classItem}
        sessionInfo={sessionInfo}
        onRecorded={onAttendanceRecorded}
      />
      <StartSessionDialog
        open={startDialogOpen}
        onOpenChange={(v) => {
          setStartDialogOpen(v);
          if (!v) setStartDialogInitialSession(null);
        }}
        classId={classItem.id}
        classCode={classItem.class_code ?? classItem.course_code}
        isSecretary={classItem.is_secretary}
        initialSession={startDialogInitialSession}
        onCreated={(session) => {
          try { setSessionInfo(session ?? null); } catch (e) {}
          try { toast({ title: 'Session started', description: 'A new session was created.' }); } catch (e) {}
          try { router.refresh(); } catch (e) {}
          try { if (typeof window !== 'undefined') window.dispatchEvent(new Event('classes:updated')); } catch (e) {}
        }}
      />
    </>
  );
}


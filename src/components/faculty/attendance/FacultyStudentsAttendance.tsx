"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RefreshCw } from 'lucide-react';
import resolveAvatarUrl from '@/lib/utils/resolveAvatarUrl';
import { getAttendanceLogsStudents } from '@/lib/api/attendance';

type Session = {
  id: string;
  className: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'scheduled' | 'completed';
  presentCount: number;
  totalStudents: number;
};

type AttendanceLog = {
  id: number;
  class_id: number;
  class_code?: string | null;
  course_id?: number | null;
  course_name?: string | null;
  program_id?: number | null;
  program_name?: string | null;
  session_id?: number | null;
  profile_id: number;
  status: string;
  timestamp?: string | null;
  remarks?: string | null;
  match_info?: any;
  mode?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
};

function formatMode(mode?: string | null): string {
  if (!mode) return '—';
  const s = String(mode).trim();
  if (!s) return '—';
  if (s.toLowerCase() === 'f2f') return 'F2F';
  // Replace underscores/dashes with spaces, then Title Case each word
  const parts = s.replace(/[_-]+/g, ' ').split(/\s+/).filter(Boolean);
  return parts.map(w => (/[0-9]/.test(w) ? w.toUpperCase() : (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))).join(' ');
}

function formatStatus(status?: string | null): string {
  if (!status) return '—';
  const s = String(status).trim();
  if (!s) return '—';
  // common normalization: map known short values to nicer labels
  const lower = s.toLowerCase();
  if (lower === 'f2f') return 'F2F';
  if (lower === 'present') return 'Present';
  if (lower === 'late') return 'Late';
  if (lower === 'excused') return 'Excused';
  if (lower === 'absent') return 'Absent';
  // Title case for other values, replace _ and - with spaces
  return s.replace(/[_-]+/g, ' ').split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export default function FacultyStudentsAttendance({
  // keep legacy props to avoid breaking callers — we focus on fetching logs instead
  sessions = [],
  onStart = (s: Session) => {},
  onEnd = (id: string) => {},
  classId,
  sessionId,
  profileId,
  pageSize = 20,
}: {
  sessions?: Session[];
  onStart?: (session: Session) => void;
  onEnd?: (id: string) => void;
  classId?: number;
  sessionId?: number;
  profileId?: number;
  pageSize?: number;
}) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);
  const limit = pageSize;

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getAttendanceLogsStudents({ skip, limit, class_id: classId, session_id: sessionId, profile_id: profileId });
        if (!mounted) return;
        setLogs(Array.isArray(res) ? res as AttendanceLog[] : []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || String(err));
        setLogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [skip, limit, classId, sessionId, profileId, refreshToken]);

  const handlePrev = () => setSkip(Math.max(0, skip - limit));
  const handleNext = () => setSkip(skip + limit);

  const showingFrom = logs.length === 0 ? 0 : skip + 1;
  const showingTo = skip + logs.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Student Attendance Logs</CardTitle>
            <CardDescription>Attendance of students in your assigned classes</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" aria-label="Refresh attendance logs" onClick={() => { setSkip(0); setRefreshToken((p) => p + 1); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading attendance logs…</div>
        ) : error ? (
          <div className="text-sm text-destructive">Error: {error}</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No attendance logs found.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => {
              const avatarSrc = resolveAvatarUrl(l.avatar_url) ?? undefined;
              const initial = l.full_name && l.full_name.length > 0 ? l.full_name[0] : String(l.profile_id).slice(-1);
              return (
                <div key={l.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
                    <Avatar className="h-9 w-9">
                      {avatarSrc ? (
                        <AvatarImage src={avatarSrc} alt={l.full_name ?? `Profile ${l.profile_id}`} />
                      ) : (
                        <AvatarFallback>{initial}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{l.full_name ?? `Profile #${l.profile_id}`}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {l.program_name ? <div className="font-medium text-xs">{l.program_name}</div> : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-1 w-full md:w-auto mt-2 md:mt-0">
                    <div className="flex items-center gap-4 flex-wrap md:flex-nowrap w-full md:w-auto">
                      <div className="text-sm text-muted-foreground">{formatMode(l.mode)}</div>
                      <div className="text-sm">
                        <Badge variant="secondary">{formatStatus(l.status)}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</div>
                    </div>

                    <div className="text-xs text-muted-foreground truncate text-left md:text-right w-full md:w-auto">{l.class_code ?? `Class ${l.class_id}`}{l.course_name ? ` • ${l.course_name}` : ''}</div>

                    <div className="w-full md:w-36 text-xs text-muted-foreground truncate text-left md:text-right">{l.remarks ?? ''}</div>

                    <div className="hidden md:block text-xs text-muted-foreground truncate text-right">{l.match_info ? JSON.stringify(l.match_info).slice(0, 80) : ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">Showing {showingFrom}–{showingTo}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handlePrev} disabled={skip === 0}>Prev</Button>
            <Button size="sm" onClick={handleNext} disabled={logs.length < limit}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

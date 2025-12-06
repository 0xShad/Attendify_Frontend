"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAttendanceLogs } from '@/lib/api/attendance';

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
};

function formatMode(mode?: string | null): string {
  if (!mode) return '—';
  const s = String(mode).trim();
  if (!s) return '—';
  if (s.toLowerCase() === 'f2f') return 'F2F';
  return s.replace(/[_-]+/g, ' ').split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function formatStatus(status?: string | null): string {
  if (!status) return '—';
  const s = String(status).trim();
  if (!s) return '—';
  const lower = s.toLowerCase();
  if (lower === 'present') return 'Present';
  if (lower === 'late') return 'Late';
  if (lower === 'excused') return 'Excused';
  if (lower === 'absent') return 'Absent';
  return s.replace(/[_-]+/g, ' ').split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export default function FacultyMyAttendanceHistory({ classId, profileId, pageSize = 10 }: { classId?: number; profileId?: number; pageSize?: number }) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const limit = pageSize;

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getAttendanceLogs({ skip, limit, class_id: classId, profile_id: profileId });
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
  }, [skip, limit, classId, profileId]);

  const handlePrev = () => setSkip(Math.max(0, skip - limit));
  const handleNext = () => setSkip(skip + limit);

  const showingFrom = logs.length === 0 ? 0 : skip + 1;
  const showingTo = skip + logs.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Recent attendance records</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading attendance history…</div>
        ) : error ? (
          <div className="text-sm text-destructive">Error: {error}</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No attendance records found.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{l.class_code ?? `Class ${l.class_id}`}{l.course_name ? ` • ${l.course_name}` : ''}</div>
                  <div className="text-xs text-muted-foreground">{l.program_name ?? ''} {l.timestamp ? `• ${new Date(l.timestamp).toLocaleString()}` : ''}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">{formatMode(l.mode)}</div>
                  <div className="text-sm"><Badge variant="secondary">{formatStatus(l.status)}</Badge></div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
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

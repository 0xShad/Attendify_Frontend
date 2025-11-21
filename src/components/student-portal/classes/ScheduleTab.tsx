"use client";

import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Schedule = {
  id: number;
  type: "normal" | "special";
  day_of_week?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  modes?: string[];
};

export default function ScheduleTab({ classData }: { classData?: any }) {
  const [rows, setRows] = React.useState<Schedule[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const cacheRef = React.useRef<Map<number | string, Schedule[]>>(new Map());

  React.useEffect(() => {
    const classId = classData?.raw?.id ?? classData?.id ?? null;
    if (!classId) {
      setRows([]);
      return;
    }

    const cached = cacheRef.current.get(classId);
    if (cached) {
      setRows(cached);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/classes/mine/${classId}/schedules`, { signal });
        if (!res.ok) throw new Error(`Failed to load schedules: ${res.status}`);
        const json = await res.json();

        // Filter out special schedules that are already done (date < today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mapped: Schedule[] = (json || []).filter((s: any) => {
          if (s.type === 'special' && s.date) {
            try {
              const d = new Date(s.date + 'T00:00:00');
              d.setHours(0,0,0,0);
              return d.getTime() >= today.getTime();
            } catch (e) {
              return true;
            }
          }
          return true;
        }).map((s: any) => ({
          id: s.id,
          type: s.type,
          day_of_week: s.day_of_week ?? null,
          date: s.date ?? null,
          start_time: s.start_time ?? null,
          end_time: s.end_time ?? null,
          location: s.location ?? null,
          modes: Array.isArray(s.modes) ? s.modes : [],
        }));

        const getWeekdayIndex = (sch: Schedule) => {
          // Monday -> 0, Tuesday -> 1, ... Sunday -> 6. Unknown -> 99
          if (sch.type === 'normal' && sch.day_of_week) {
            const d = String(sch.day_of_week).toLowerCase().slice(0, 3);
            switch (d) {
              case 'mon': return 0;
              case 'tue': return 1;
              case 'wed': return 2;
              case 'thu': return 3;
              case 'fri': return 4;
              case 'sat': return 5;
              case 'sun': return 6;
            }
          }
          if (sch.date) {
            try {
              const dt = new Date(sch.date + 'T00:00:00');
              const jsDay = dt.getDay(); // 0 Sun .. 6 Sat
              return (jsDay + 6) % 7; // shift so Monday=0, Sunday=6
            } catch (e) {
              return 99;
            }
          }
          return 99;
        };

        // Sort mapped schedules by weekday Monday -> Sunday
        mapped.sort((a, b) => getWeekdayIndex(a) - getWeekdayIndex(b));

        cacheRef.current.set(classId, mapped);
        setRows(mapped);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('ScheduleTab: failed to load schedules', err);
        setError('Failed to load schedules');
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [classData?.raw?.id, classData?.id]);

  const fmtTime = (t?: string | null) => (t ? String(t).replace(/:00$/, '') : 'TBA');

  const dayLabel = (s: Schedule) => {
    if (s.type === 'normal') return s.day_of_week ?? '—';
    if (s.date) {
      try {
        return new Date(s.date).toLocaleDateString(undefined, { weekday: 'long' });
      } catch (e) {
        return s.date;
      }
    }
    return '—';
  };

  const toProperCase = (input?: string | null) => {
    if (!input) return '';
    // replace underscores/hyphens with spaces, split, capitalize each word
    return String(input)
      .replace(/[_-]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-3">
      <Card>
        <div className="p-2">
          {loading && rows.length === 0 ? (
            <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading schedules...</div>
          ) : error ? (
            <div className="p-4 text-sm text-red-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No schedules found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Type</TableHead>
                    <TableHead className="font-medium">Day</TableHead>
                    <TableHead className="font-medium">Start Time</TableHead>
                    <TableHead className="font-medium">End Time</TableHead>
                    <TableHead className="font-medium">Location</TableHead>
                    <TableHead className="font-medium">Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{toProperCase(r.type)}</TableCell>
                      <TableCell className="text-sm">{dayLabel(r)}</TableCell>
                      <TableCell className="text-sm">{fmtTime(r.start_time)}</TableCell>
                      <TableCell className="text-sm">{fmtTime(r.end_time)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.location ?? '—'}</TableCell>
                      <TableCell className="text-sm">{(r.modes || []).map(m => toProperCase(m)).join(', ') || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

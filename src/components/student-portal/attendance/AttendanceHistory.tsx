"use client";
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type AttendanceRecord = {
  id: number;
  class_id: number;
  class_code?: string | null;
  course_id?: number | null;
  course_name?: string | null;
  session_id: number;
  profile_id: number;
  status: string; // server uses lowercase like 'present','late'
  timestamp: string;
  remarks?: string | null;
  match_info?: any | null;
  mode?: string | null;
};

export default function AttendanceHistory() {
  const [logs, setLogs] = React.useState<AttendanceRecord[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0); // zero-based
  const [limit, setLimit] = React.useState(20);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const mod = await import("@/lib/api/attendance");
        const data = await mod.getAttendanceLogs({ skip: page * limit, limit });
        if (!mounted) return;
        // Expect an array of log objects as per backend spec
        const items = Array.isArray(data) ? data.slice() : [];
        // Sort newest-first by timestamp (robust to missing/invalid timestamps)
        items.sort((a: any, b: any) => {
          const ta = a && a.timestamp ? Date.parse(a.timestamp) : 0;
          const tb = b && b.timestamp ? Date.parse(b.timestamp) : 0;
          return tb - ta;
        });
        // If we requested a page that has no items and we're not on the first page,
        // step back one page so the UI doesn't show an empty page.
        if (items.length === 0 && page > 0) {
          setPage((p) => Math.max(0, p - 1));
        } else {
          setLogs(items);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('Failed to load attendance logs', err);
        setError(err?.message ? String(err.message) : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [page, limit]);

  const renderStatus = (s: string) => {
    const low = String(s || '').toLowerCase();
    if (low === 'present' || low === 'presented') return 'Present';
    if (low === 'late') return 'Late';
    if (low === 'absent') return 'Absent';
    if (low === 'excused') return 'Excused';
    return (low || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attendance</CardTitle>
        <CardDescription>Your attendance record for the past sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading ? (
            <div className="p-6 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading attendance history...
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-600">Error loading attendance history: {error}</div>
          ) : (!logs || logs.length === 0) ? (
            <div className="p-6 text-sm text-muted-foreground">No attendance records found.</div>
          ) : (
            logs.map((record) => (
              <div
                key={String(record.id)}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-2"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      record.status === 'present'
                        ? 'bg-green-500'
                        : record.status === 'late'
                        ? 'bg-yellow-500'
                        : record.status === 'absent'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div className="text-sm min-w-0">
                    <div className="font-medium">{record.class_code ?? `Class ${record.class_id}`}</div>
                    {record.course_name ? (
                      <div className="font-medium text-muted-foreground">{record.course_name}</div>
                    ) : null}
                    <div className="text-xs text-muted-foreground">
                      {record.timestamp ? new Date(record.timestamp).toLocaleDateString() : '—'}
                      {record.mode ? ` • ${String(record.mode).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm w-full sm:w-auto">
                  <div className="font-medium">{renderStatus(record.status)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(record.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          )}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}>
                Prev
              </Button>
              <Button size="sm" onClick={() => setPage((p) => p + 1)} disabled={loading || (logs !== null && logs.length < limit)}>
                Next
              </Button>
              <div className="text-sm text-muted-foreground ml-3">Page {page + 1}</div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Per page</label>
              <select
                value={String(limit)}
                onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
                className="text-sm bg-transparent border rounded px-2 py-1"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

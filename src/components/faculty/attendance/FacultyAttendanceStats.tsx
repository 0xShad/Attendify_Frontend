"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { getFacultyDashboard, FacultyDashboard } from '@/lib/api/analytics';
import { Badge } from '@/components/ui/badge';

export default function FacultyAttendanceStats() {
  const [data, setData] = useState<FacultyDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getFacultyDashboard();
        if (!mounted) return;
        setData(res);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fmtRate = (v: number | null | undefined) => (v == null ? '-' : `${Math.round((v * 100) * 10) / 10}%`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>Attendance summary</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading dashboard…</div>
        ) : error ? (
          <div className="text-sm text-destructive">Error: {error}</div>
        ) : !data ? (
          <div className="text-sm text-muted-foreground">No data</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <div className="text-sm text-muted-foreground">Assigned Classes</div>
                <div className="font-medium text-lg">{data.assigned_classes_count}</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm text-muted-foreground">My Attendance Rate</div>
                <div className="font-medium text-lg">{fmtRate(data.my_attendance?.attendance_rate)}</div>
                <div className="text-xs text-muted-foreground">{data.my_attendance?.total_logs ?? 0} logs</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm text-muted-foreground">Overall Student Rate</div>
                <div className="font-medium text-lg">{fmtRate(data.overall_students?.attendance_rate)}</div>
                <div className="text-xs text-muted-foreground">{data.overall_students?.total_logs ?? 0} logs</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-2 border rounded">
                <div className="text-sm text-muted-foreground">My Attendance Breakdown</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground">Present or Late</div>
                    <div className="font-medium">{data.my_attendance.present_or_late}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground">Late</div>
                    <div className="font-medium">{data.my_attendance.late}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground">Absent</div>
                    <div className="font-medium">{data.my_attendance.absent}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground">Excused</div>
                    <div className="font-medium">{data.my_attendance.excused}</div>
                  </div>
                </div>
              </div>

              <div className="p-2 border rounded">
                <div className="text-sm text-muted-foreground">Overall Students Breakdown</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground">Present or Late</div>
                    <div className="font-medium">{data.overall_students.present_or_late}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground">Late</div>
                    <div className="font-medium">{data.overall_students.late}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground">Absent</div>
                    <div className="font-medium">{data.overall_students.absent}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground">Excused</div>
                    <div className="font-medium">{data.overall_students.excused}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Students by Class</h4>
              <div className="overflow-auto rounded border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left p-2 text-xs uppercase">Class</th>
                      <th className="text-left p-2 text-xs uppercase">Enrolled</th>
                      <th className="text-left p-2 text-xs uppercase">Logs</th>
                      <th className="text-left p-2 text-xs uppercase">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students_by_class.map((c) => (
                      <tr key={String(c.class_id)} className="hover:bg-muted/10">
                        <td className="p-2 align-top">
                          <div className="font-medium">{c.class_code ?? `Class ${c.class_id}`}</div>
                          <div className="text-xs text-muted-foreground">{c.course_name ?? ''}</div>
                        </td>
                        <td className="p-2 align-top">{c.enrolled_count ?? '-'}</td>
                        <td className="p-2 align-top">{c.total_logs}</td>
                        <td className="p-2 align-top">{c.attendance_rate == null ? '-' : `${Math.round((c.attendance_rate * 100) * 10) / 10}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

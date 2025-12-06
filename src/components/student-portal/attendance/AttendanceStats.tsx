"use client";
"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type SummaryRow = {
  total_logs: number;
  present_or_late: number;
  late: number;
  absent: number;
  excused: number;
  attendance_rate: number | null;
};

export default function AttendanceStats() {
  const [data, setData] = React.useState<{ overview?: SummaryRow; this_week?: SummaryRow; this_month?: SummaryRow } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const mod = await import('@/lib/api/analytics');
        const res = await mod.getAttendanceSummary();
        if (!mounted) return;
        setData(res);
      } catch (err: any) {
        if (!mounted) return;
        console.error('Failed to load attendance summary', err);
        setError(err?.message ? String(err.message) : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const renderCard = (title: string, row?: SummaryRow | null) => (
    <Card>
      <CardContent>
        <div className="text-sm text-muted-foreground">{title}</div>
        {row ? (
          <div className="mt-2">
            <div className="text-2xl font-bold">{row.attendance_rate === null ? '—' : `${(row.attendance_rate * 100).toFixed(1)}%`}</div>
            <div className="text-sm text-muted-foreground mt-2">
              <div>Total: {row.total_logs}</div>
              <div>Present/Late: {row.present_or_late} (Late: {row.late})</div>
              <div>Absent: {row.absent} • Excused: {row.excused}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">—</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>Summary statistics</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-6 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading summary...
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">Error loading summary: {error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {renderCard('Overview', data?.overview ?? null)}
            {renderCard('This Week', data?.this_week ?? null)}
            {renderCard('This Month', data?.this_month ?? null)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

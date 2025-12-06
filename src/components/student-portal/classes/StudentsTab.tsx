        "use client";

import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserCheck, Loader2 } from "lucide-react";
import resolveAvatarUrl from '@/lib/utils/resolveAvatarUrl';

type Student = {
  id: number;
  name: string | null;
  studentId: string;
  attendancePct?: number | null;
  avatarUrl?: string | null;
};

export default function StudentsTab({ classData, students }: { classData?: any; students?: Student[] }) {
  const [rows, setRows] = React.useState<Student[]>(students ?? []);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const cacheRef = React.useRef<Map<number | string, Student[]>>(new Map());
  const [failedAvatarIds, setFailedAvatarIds] = React.useState<Record<number, boolean>>({});

  React.useEffect(() => {
    const classId = classData?.raw?.id ?? classData?.id ?? null;
    if (!classId) {
      // if callers passed `students` prop, use it; otherwise clear
      setRows(students ?? []);
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
        const res = await fetch(`/api/classes/mine/${classId}/enrollees`, { signal });
        if (!res.ok) throw new Error(`Failed to load enrollees: ${res.status}`);
        const json = await res.json();
        // json is an array of Enrollee
        const mapped: Student[] = (json || []).map((e: any) => {
          const resolved = resolveAvatarUrl(e.avatar_url ?? null);
          return {
            id: e.id,
            name: e.full_name ?? null,
            studentId: String(e.profile_id ?? e.user_id ?? e.id),
            attendancePct: typeof e.attendance_rate === 'number' ? Number(Number(e.attendance_rate).toFixed(2)) : null,
            avatarUrl: resolved ?? null,
          };
        });
        cacheRef.current.set(classId, mapped);
        setRows(mapped);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("StudentsTab: failed to load enrollees", err);
        setError("Failed to load enrolled students");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [classData?.raw?.id, classData?.id, students]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">Enrolled students</div>
        </div>
        <div className="text-sm text-muted-foreground">
          {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading</span> : rows.length}
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="p-6 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading enrolled students...
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No enrolled students.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Student</TableHead>
                <TableHead className="font-medium">Student ID</TableHead>
                <TableHead className="font-medium">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        {s.avatarUrl && !failedAvatarIds[s.id] ? (
                          <AvatarImage src={s.avatarUrl ?? undefined} alt={s.name ?? "avatar"} onError={() => setFailedAvatarIds((p) => ({ ...p, [s.id]: true }))} />
                        ) : (
                          <AvatarFallback>{(s.name || "?").split(" ").map((n) => n?.[0]).slice(0, 2).join("")}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-sm">{s.name ?? "Unknown"}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.studentId}</TableCell>
                  <TableCell className="text-sm">{`${Number(s.attendancePct ?? 0).toFixed(2)}%`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

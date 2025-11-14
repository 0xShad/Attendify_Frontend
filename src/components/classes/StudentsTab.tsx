"use client";

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { IconTrash } from "@tabler/icons-react";
import DeleteEnrolleeDialog from "./DeleteEnrolleeDialog";
import { useToast } from "@/hooks/use-toast";
import { classesAPI } from "@/lib/api/classes";
import AddStudentDialog from "./AddStudentDialog";

type Props = {
  classId?: number | null;
};

type Enrollee = {
  id: number;
  profile_id: number | null;
  user_id: number | null;
  full_name: string | null;
  enrollment_date: string | null;
  avatar_url?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString();
  } catch (e) {
    return String(value);
  }
}

export default function StudentsTab({ classId }: Props) {
  const { toast } = useToast();
  const [enrollees, setEnrollees] = useState<Enrollee[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [enrolleeToDelete, setEnrolleeToDelete] = useState<Enrollee | null>(null);
  const [failedAvatarIds, setFailedAvatarIds] = useState<Record<number, boolean>>({});

  const raw = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";
  const BACKEND_ORIGIN = String(raw).replace(/\/api\/(v\d+|v1)\/?$/i, "");
  // Debug: expose resolved origin for troubleshooting avatar requests
  React.useEffect(() => {
    console.debug("StudentsTab BACKEND_ORIGIN:", BACKEND_ORIGIN);
  }, [BACKEND_ORIGIN]);

  function resolveAvatarUrl(u?: string | null) {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    // normalize leading slash
    if (u.startsWith('/')) return `${BACKEND_ORIGIN}${u}`;
    return `${BACKEND_ORIGIN}/${u}`;
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!classId) return;
      setLoading(true);
      try {
        const data = await classesAPI.listEnrolleesForClass(Number(classId));
        // Debug: log raw and resolved avatar URLs for troubleshooting
        try {
          (Array.isArray(data) ? data : []).forEach((en: any) => {
            const rawUrl = en?.avatar_url ?? null;
            const resolved = resolveAvatarUrl(rawUrl);
            console.debug(`Enrollee avatar: id=${en?.id} raw=${String(rawUrl)} resolved=${String(resolved)}`);
          });
        } catch (e) {
          console.debug('StudentsTab avatar debug failed', e);
        }
        if (cancelled) return;
        setEnrollees(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Failed to load enrollees:", err);
        if (!cancelled) toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [classId, toast]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Students</h3>
        <div>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} disabled={!classId}>
            Add Student
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="max-h-[40vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">Loading students…</TableCell>
                </TableRow>
              )}

              {!loading && enrollees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">No students found for this class.</TableCell>
                </TableRow>
              )}

              {!loading && enrollees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="w-12">
                    <div className="w-8 h-8">
                      <Avatar>
                        {e.avatar_url && !failedAvatarIds[e.id] ? (
                          <AvatarImage src={String(resolveAvatarUrl(e.avatar_url))} alt={e.full_name ?? 'avatar'} onError={() => { console.debug(`Avatar load failed for enrollee ${e.id} -> ${String(resolveAvatarUrl(e.avatar_url))}`); setFailedAvatarIds((p) => ({ ...p, [e.id]: true })); }} />
                        ) : (
                          <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">{(e.full_name || "").split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() || '—'}</AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell>{e.full_name ?? "—"}</TableCell>
                  <TableCell className="font-mono">{formatDate(e.enrollment_date)}</TableCell>
                  <TableCell className="text-right">
                    <button title="Remove" className="p-1 rounded hover:bg-gray-100 text-rose-600" onClick={() => {
                      setEnrolleeToDelete(e);
                      setDeleteOpen(true);
                    }}>
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <DeleteEnrolleeDialog open={deleteOpen} onOpenChange={setDeleteOpen} classId={classId} enrollee={enrolleeToDelete ? { id: enrolleeToDelete.id, full_name: enrolleeToDelete.full_name } : null} onDeleted={(id) => {
        // remove locally
        setEnrollees((p) => p.filter((x) => x.id !== id));
        setEnrolleeToDelete(null);
      }} />
      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} classId={classId} onAdded={() => {
        // refresh list after adding
        (async () => {
          setLoading(true);
          try {
            const data = await classesAPI.listEnrolleesForClass(Number(classId));
            setEnrollees(Array.isArray(data) ? data : []);
          } catch (err: any) {
            console.error(err);
          } finally {
            setLoading(false);
          }
        })();
      }} />
    </div>
  );
}

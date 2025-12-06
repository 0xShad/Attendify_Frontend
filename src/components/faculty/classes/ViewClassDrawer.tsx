"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { classesAPI } from "@/lib/api/classes";
import type { Class } from "@/components/classes/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StudentsTab from "@/components/faculty/classes/StudentsTab";
import SchedulesTab from "@/components/faculty/classes/SchedulesTab";
import RequestedExcusesTab from "@/components/faculty/classes/RequestedExcusesTab";

type Props = {
  open: boolean;
  classId?: number | null;
  // for compatibility with callers in `faculty` namespace that pass the selected class object
  selectedClass?: any;
  // two closing patterns supported: onClose() or onOpenChange(boolean)
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  // Optional: notify parent when class data changed (e.g. schedules updated)
  onClassChanged?: (classId: number) => void;
};

export default function ViewClassDrawer({ open, classId, selectedClass: selClass, onClose, onOpenChange, onClassChanged }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<Partial<Class> | null>(null);

  React.useEffect(() => {
    let mounted = true;

    // If a selectedClass object was provided (faculty callers), derive data from it and skip backend fetch.
    if (!open) {
      setData(null);
      return () => {
        mounted = false;
      };
    }

    if (selClass) {
      // Map selectedClass (CardClassItem) to Partial<Class>
      const mapped: any = {
        id: selClass.id ? Number(selClass.id) : undefined,
        class_code: selClass.class_code ?? selClass.code ?? null,
        course_id: selClass.course_id != null ? Number(selClass.course_id) : null,
        course_code: selClass.course_code ?? null,
        course_name: selClass.course_name ?? null,
        description: selClass.description ?? null,
        room: selClass.room ?? null,
        assigned_faculty_id: selClass.assigned_faculty_id ?? null,
        assigned_faculty_name: selClass.assigned_faculty_name ?? null,
        academic_year: selClass.academic_year ?? null,
        semester: selClass.semester ?? null,
        students_count: selClass.enrolledStudents ?? selClass.students_count ?? undefined,
        program_id: selClass.program_id ?? null,
        program_name: selClass.program_name ?? null,
        organization_id: selClass.organization_id ?? null,
        organization_name: selClass.organization_name ?? null,
        // assigned secretary info (faculty-local card shape may include secretary or secretary_name)
        assigned_secretary: selClass.assigned_secretary ?? selClass.secretary_id ?? selClass.secretary?.id ?? null,
        assigned_secretary_name: selClass.assigned_secretary_name ?? selClass.secretary_name ?? selClass.secretary?.name ?? null,
        // pass through schedules if present
        // @ts-ignore
        schedules: selClass.schedules ?? undefined,
      };
        setData(mapped as Partial<Class>);

        // If a selectedClass was provided, still attempt to fetch the
        // faculty-scoped full object in the background so enriched fields
        // like `assigned_secretary_name`, `schedules`, and rates are present.
        (async () => {
          try {
            if (!mounted) return;
            // Only fetch if we have an id to query
            const sid = mapped.id;
            if (sid != null) {
              console.debug('ViewClassDrawer: selClass provided — fetching faculty-scoped class', { sid });
              const full = await classesAPI.getMyClass(Number(sid)).catch(() => null);
              if (!mounted || !full) return;
              const normalized: any = {
                id: Number(full.id),
                class_code: full.class_code ?? null,
                course_id: full.course_id != null ? Number(full.course_id) : null,
                course_code: full.course_code ?? null,
                course_name: full.course_name ?? null,
                description: full.description ?? null,
                room: full.room ?? null,
                assigned_faculty_id: full.assigned_faculty_id != null ? Number(full.assigned_faculty_id) : full.assigned_faculty?.id != null ? Number(full.assigned_faculty.id) : null,
                assigned_faculty_name: full.assigned_faculty_name ?? full.assigned_faculty?.name ?? null,
                academic_year: full.academic_year ?? null,
                semester: full.semester ?? null,
                students_count: full.students_count ?? mapped.students_count ?? undefined,
                program_id: full.program_id != null ? Number(full.program_id) : null,
                program_name: full.program_name ?? null,
                organization_id: full.organization_id != null ? Number(full.organization_id) : mapped.organization_id ?? null,
                organization_name: full.organization_name ?? null,
                assigned_secretary: full.assigned_secretary != null ? Number(full.assigned_secretary) : full.secretary_id != null ? Number(full.secretary_id) : full.secretary?.id != null ? Number(full.secretary.id) : mapped.assigned_secretary ?? null,
                assigned_secretary_name: full.assigned_secretary_name ?? full.secretary_name ?? full.secretary?.name ?? mapped.assigned_secretary_name ?? null,
                schedules: full.schedules ?? mapped.schedules ?? undefined,
              };
              setData(normalized as Partial<Class>);
            }
          } catch (err) {
            // ignore background fetch failures — retain mapped data
            console.debug('ViewClassDrawer: background getMyClass failed', err);
          }
        })();

        return () => { mounted = false; };
    }

    if (!classId) {
      setData(null);
      return () => { mounted = false; };
    }

    setLoading(true);
    (async () => {
      try {
        // Prefer the faculty-scoped endpoint which enriches faculty-owned
        // class objects (includes `assigned_secretary_name`) so try that
        // first and fall back to the public `getClass` when not available.
        let d: any = null;
        // Temporary debug: confirm we're executing the fetch branch
        try {
          console.debug('ViewClassDrawer: attempting to load class via faculty-scoped endpoint', { classId, selClassProvided: !!selClass });
        } catch (__) {}
        try {
          console.debug('ViewClassDrawer: calling classesAPI.getMyClass', Number(classId));
          d = await classesAPI.getMyClass(Number(classId));
          console.debug('ViewClassDrawer: classesAPI.getMyClass returned', d && d.id ? { id: d.id } : d);
        } catch (e) {
          // not accessible via `mine` or errored — fall back to public endpoint
          try {
            console.debug('ViewClassDrawer: getMyClass failed, falling back to classesAPI.getClass', { err: e });
            d = await classesAPI.getClass(Number(classId));
            console.debug('ViewClassDrawer: classesAPI.getClass returned', d && d.id ? { id: d.id } : d);
          } catch (e2) {
            throw e2;
          }
        }
        if (!mounted) return;
        // normalize similar to list normalization
        const normalized: any = {
          id: Number(d.id),
          class_code: d.class_code ?? null,
          course_id: d.course_id != null ? Number(d.course_id) : null,
          course_code: d.course_code ?? null,
          course_name: d.course_name ?? null,
          description: d.description ?? null,
          room: d.room ?? null,
          assigned_faculty_id:
            d.assigned_faculty_id != null
              ? Number(d.assigned_faculty_id)
              : d.assigned_faculty?.id != null
              ? Number(d.assigned_faculty.id)
              : null,
          assigned_faculty_name: d.assigned_faculty_name ?? d.assigned_faculty?.name ?? null,
          academic_year: d.academic_year ?? null,
          semester: d.semester ?? null,
          students_count: d.students_count ?? undefined,
          program_id: d.program_id != null ? Number(d.program_id) : null,
          program_name: d.program_name ?? null,
          organization_id: d.organization_id != null ? Number(d.organization_id) : null,
          organization_name: d.organization_name ?? null,
          // assigned secretary (when provided by backend)
          assigned_secretary: d.assigned_secretary != null ? Number(d.assigned_secretary) : d.secretary_id != null ? Number(d.secretary_id) : d.secretary?.id != null ? Number(d.secretary.id) : null,
          assigned_secretary_name: d.assigned_secretary_name ?? d.secretary_name ?? d.secretary?.name ?? null,
        };
        setData(normalized as Partial<Class>);
      } catch (err) {
        console.error("Failed to load class", err);
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, classId, selClass]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { if (onOpenChange) onOpenChange(false); if (onClose) onClose(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>View Class</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto max-h-[70vh] sm:max-h-[60vh]">
          {loading ? (
            <div>Loading…</div>
          ) : data ? (
            <>
              {/* Header summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div className="space-y-2">
                  <div>
                    <Label>Class code</Label>
                    <Input readOnly value={data.class_code ?? ""} />
                  </div>
                  <div>
                    <Label>Course</Label>
                    <Input readOnly value={(data.course_code ? `${data.course_code} — ` : "") + (data.course_name ?? "")} />
                  </div>
                  <div>
                    <Label>Program</Label>
                    <Input readOnly value={data.program_name ?? ""} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label>Organization</Label>
                    <Input readOnly value={data.organization_name ?? ""} />
                  </div>
                  <div>
                    <Label>Room</Label>
                    <Input readOnly value={data.room ?? ""} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Academic year</Label>
                      <Input readOnly value={data.academic_year ?? ""} />
                    </div>
                    <div>
                      <Label>Semester</Label>
                      <Input readOnly value={data.semester ?? ""} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Instructor</Label>
                  <Input readOnly value={data.assigned_faculty_name ?? (data.assigned_faculty_id ? `Faculty #${data.assigned_faculty_id}` : "")} />
                </div>
                <div>
                  <Label>Secretary</Label>
                  <Input
                    readOnly
                    value={(data as any).assigned_secretary_name ?? ((data as any).assigned_secretary != null ? `Secretary #${(data as any).assigned_secretary}` : "Not Assigned Yet")}
                  />
                </div>
              </div>

              <div className="mb-3">
                <Label>Description</Label>
                <Input readOnly value={data.description ?? ""} />
              </div>

              {/* Tabs */}
              <div className="w-full">
                <Tabs defaultValue="students">
                <TabsList>
                  <TabsTrigger value="students">Students</TabsTrigger>
                  <TabsTrigger value="schedules">Schedules</TabsTrigger>
                  <TabsTrigger value="requested-excuses">Requested Excuses</TabsTrigger>
                </TabsList>
                <TabsContent value="students">
                  <div className="pt-2">
                    <StudentsTab classId={data.id ?? undefined} />
                  </div>
                </TabsContent>
                <TabsContent value="schedules">
                  <div className="pt-2">
                    <SchedulesTab classId={data.id ?? undefined} onClassChanged={onClassChanged} />
                  </div>
                </TabsContent>
                <TabsContent value="requested-excuses">
                  <div className="pt-2">
                    <RequestedExcusesTab classId={data.id ?? undefined} />
                  </div>
                </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <div>No class selected</div>
          )}
        </div>

        
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { classesAPI } from "@/lib/api/classes";
import type { Class } from "./types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StudentsTab from "./StudentsTab";
import SchedulesTab from "./SchedulesTab";

type Props = {
  open: boolean;
  classId?: number | null;
  onClose: () => void;
};

export default function ViewClassDrawer({ open, classId, onClose }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<Partial<Class> | null>(null);

  React.useEffect(() => {
    let mounted = true;
    if (!open || !classId) {
      setData(null);
      return () => {
        mounted = false;
      };
    }
    setLoading(true);
    (async () => {
      try {
        const d = await classesAPI.getClass(Number(classId));
        if (!mounted) return;
        // normalize similar to list normalization
        const normalized: Partial<Class> = {
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
        };
        setData(normalized);
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
  }, [open, classId]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
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

              <div className="mb-3">
                <Label>Instructor</Label>
                <Input readOnly value={data.assigned_faculty_name ?? (data.assigned_faculty_id ? `Faculty #${data.assigned_faculty_id}` : "")} />
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
                </TabsList>
                <TabsContent value="students">
                  <div className="pt-2">
                    <StudentsTab classId={data.id ?? undefined} />
                  </div>
                </TabsContent>
                <TabsContent value="schedules">
                  <div className="pt-2">
                    <SchedulesTab classId={data.id ?? undefined} />
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

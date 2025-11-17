"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconLoader2, IconDeviceFloppy } from "@tabler/icons-react";
import { useToast } from "@/hooks/use-toast";
import { classesAPI } from "@/lib/api/classes";
import { coursesAPI } from "@/lib/api/courses";
import type { ClassItem as CardClassItem } from "./ClassCard";

interface EditClassDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass: CardClassItem | null;
  // Optional course list so the drawer can show the same course select as CreateClassDrawer
  courses?: Array<{
    id: number | string;
    code?: string;
    name?: string;
    title?: string;
    program_id?: number | null;
    program_name?: string | null;
    organization_id?: number | null;
    organization_name?: string | null;
  }>;
  coursesLoading?: boolean;
  onReloadCourses?: () => void;
  onSave?: (updated: any) => void; // optional callback after successful update
}

const EditClassDrawer: React.FC<EditClassDrawerProps> = ({
  open,
  onOpenChange,
  selectedClass,
  courses,
  coursesLoading,
  onReloadCourses,
  onSave,
}) => {
  const { toast } = useToast();

  // Mirror CreateClassDrawer fields so UI is identical
  const [programFilter, setProgramFilter] = useState<string>("__all__");
  const [courseId, setCourseId] = useState<string>("");
  const [createNewCourse, setCreateNewCourse] = useState<boolean>(false);
  const [newCourseCode, setNewCourseCode] = useState<string>("");
  const [newCourseName, setNewCourseName] = useState<string>("");
  const [newCourseDescription, setNewCourseDescription] = useState<string>("");
  const [newCourseProgramId, setNewCourseProgramId] = useState<string>("");

  const [room, setRoom] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  
  const [assignedSecretary, setAssignedSecretary] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [localCourses, setLocalCourses] = useState<typeof courses>(() => (courses ?? []) as any);
  const [localCoursesLoading, setLocalCoursesLoading] = useState(false);

  // Use provided courses prop if available; otherwise use localCourses fetched here
  const effectiveCourses = (Array.isArray(courses) && courses.length > 0) ? courses : localCourses;

  // Derive program options from effective courses (same algorithm as CreateClassDrawer)
  const programOptions = useMemo(() => {
    if (!Array.isArray(effectiveCourses)) return [] as Array<{ id: string; name: string }>;
    const map = new Map<string, string>();
    for (const c of effectiveCourses) {
      const pid = c.program_id !== undefined && c.program_id !== null ? String(c.program_id) : "__none__";
      const pname = c.program_name ?? (c.program_id ? `Program ${c.program_id}` : "(No program)");
      if (!map.has(pid)) map.set(pid, pname);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [effectiveCourses]);

  const filteredCourses = useMemo(() => {
    if (!Array.isArray(effectiveCourses)) return [] as typeof effectiveCourses;
    if (programFilter === "__all__") return effectiveCourses;
    if (programFilter === "__none__") return effectiveCourses.filter((c) => c.program_id === undefined || c.program_id === null);
    return effectiveCourses.filter((c) => String(c.program_id) === programFilter);
  }, [effectiveCourses, programFilter]);

  // If the parent didn't pass courses, fetch them the same way CreateClassDrawer does
  useEffect(() => {
    if (Array.isArray(courses) && courses.length > 0) return;
    let mounted = true;
    setLocalCoursesLoading(true);
    (async () => {
      try {
        const opts = await coursesAPI.getCourseOptionsForMe();
        const normalizedCourses = Array.isArray(opts)
          ? opts.map((c: any) => ({
              id: Number(c.id),
              code: c.code,
              name: c.name,
              program_id: c.program_id ?? null,
              program_name: c.program_name ?? null,
              organization_id: c.organization_id ?? null,
              organization_name: c.organization_name ?? null,
            }))
          : [];
        if (mounted) setLocalCourses(normalizedCourses as any);
      } catch (err: any) {
        console.info("course options for current user unavailable", err?.message ?? err);
        if (mounted) setLocalCourses([] as any);
      } finally {
        if (mounted) setLocalCoursesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courses]);

  useEffect(() => {
    if (!selectedClass) return;
    // When the drawer opens we should prefer the authenticated "mine" endpoint
    // because it returns enriched fields (assigned_secretary_name, students_count, attendance_rate, schedules)
    let mounted = true;
    const doPrefill = async () => {
      setInitialLoading(true);
      try {
        const data = await classesAPI.getMyClass(Number(selectedClass.id)).catch(() => null);
        const src = data ?? selectedClass;
        if (!mounted) return;
        setProgramFilter(src.program_id ? String(src.program_id) : "__all__");
        setCourseId(src.course_id ? String(src.course_id) : "");
        setRoom(src.room ?? "");
        setAcademicYear(src.academic_year ?? "");
        setSemester(src.semester ?? "");
        setDescription(src.description ?? "");
        // status field removed from edit form
        setAssignedSecretary(src.assigned_secretary ? String(src.assigned_secretary) : "");

        // Prefill inline-created course if present
        if (src.new_course) {
          const nc = src.new_course;
          setCreateNewCourse(true);
          setNewCourseCode(nc.code ?? "");
          setNewCourseName(nc.name ?? "");
          setNewCourseDescription(nc.description ?? "");
          setNewCourseProgramId(nc.program_id ? String(nc.program_id) : "");
        } else {
          setCreateNewCourse(false);
          setNewCourseCode("");
          setNewCourseName("");
          setNewCourseDescription("");
          setNewCourseProgramId("");
        }
      } catch (err: any) {
        console.error("Failed to load class details", err);
        toast({ title: "Failed to load class details", description: String(err?.message ?? err), variant: "destructive" });
        // fallback to provided selectedClass
        setProgramFilter(selectedClass.program_id ? String(selectedClass.program_id) : "__all__");
        setCourseId(selectedClass.course_id ? String(selectedClass.course_id) : "");
        setRoom(selectedClass.room ?? "");
        setAcademicYear(selectedClass.academic_year ?? "");
        setSemester(selectedClass.semester ?? "");
        setDescription(selectedClass.description ?? "");
        // status field removed from edit form
        setAssignedSecretary((selectedClass as any).assigned_secretary ? String((selectedClass as any).assigned_secretary) : "");
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };

    // Only fetch when the drawer is open (to avoid extra network calls)
    if ((selectedClass as any) && (selectedClass as any).id) {
      void doPrefill();
    }

    return () => {
      mounted = false;
    };
  }, [selectedClass]);

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      // Build payload similar to CreateClassDrawer but for update
      const payload: any = {
        course_id: courseId ? Number(courseId) : undefined,
        room: room || null,
        academic_year: academicYear || null,
        semester: semester || null,
        description: description || null,
        // status removed
        assigned_secretary: assignedSecretary ? Number(assignedSecretary) : null,
      };

      if (createNewCourse) {
        payload.new_course = {
          code: newCourseCode || null,
          name: newCourseName || null,
          description: newCourseDescription || null,
          program_id: newCourseProgramId ? Number(newCourseProgramId) : null,
        };
        // When creating a new course inline we should not send course_id
        delete payload.course_id;
      }

      const updated = await classesAPI.updateClass(Number(selectedClass.id), payload as any);
      toast({ title: "Class updated", description: `Updated class ${updated?.class_code ?? updated?.course_name ?? selectedClass.id}` });
      onSave?.(updated);
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Update failed", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Edit Class</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          <div>
            <Label htmlFor="program-filter">Program</Label>
            <div className="mb-2">
              <Select
                value={programFilter}
                onValueChange={(v) => {
                  setProgramFilter(v);
                  if (v === "__all__" || v === "__none__") setNewCourseProgramId("");
                }}
              >
                <SelectTrigger id="program-filter" disabled={Boolean(coursesLoading) || programOptions.length === 0}>
                  <SelectValue placeholder={programOptions.length > 0 ? 'Filter by program (optional)' : 'All programs'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All programs</SelectItem>
                  {programOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <div className="flex-none">
                <Label htmlFor="course-id">Course</Label>
                <Select value={courseId} onValueChange={(v) => setCourseId(v)}>
                  <SelectTrigger id="course-id" className="w-72" disabled={createNewCourse || Boolean(coursesLoading) || !(filteredCourses && filteredCourses.length > 0)}>
                    <SelectValue
                      placeholder={
                        coursesLoading
                          ? "Loading courses..."
                          : filteredCourses && filteredCourses.length > 0
                          ? "Select a course"
                          : "No courses available"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(filteredCourses) && filteredCourses.length > 0 ? (
                      filteredCourses.map((c) => (
                        <SelectItem key={String(c.id)} value={String(c.id)}>
                          {c.code && c.name
                            ? `${c.code} - ${c.name}`
                            : c.code
                            ? String(c.code)
                            : c.name ?? c.title ?? String(c.id)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__no_courses__" disabled>
                        No courses available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="edit-create-new-course"
                  type="checkbox"
                  checked={createNewCourse}
                  onChange={(e) => {
                    const checked = Boolean(e.target.checked);
                    setCreateNewCourse(checked);
                    if (checked) setCourseId("");
                  }}
                  className="checkbox"
                />
                <label htmlFor="edit-create-new-course" className="text-sm">Create a new course inline</label>
              </div>
            </div>

            {createNewCourse ? (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="new-course-code">Course Code</Label>
                  <Input id="new-course-code" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} placeholder="e.g., CS999" />
                </div>
                <div>
                  <Label htmlFor="new-course-name">Course Name</Label>
                  <Input id="new-course-name" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} placeholder="e.g., Special Topics in CS" />
                </div>
                <div>
                  <Label htmlFor="new-course-description">Course Description (optional)</Label>
                  <Textarea id="new-course-description" value={newCourseDescription} onChange={(e) => setNewCourseDescription(e.target.value)} rows={2} />
                </div>
                <div>
                  <Label htmlFor="new-course-program">Program ID (optional)</Label>
                  <Input id="new-course-program" value={newCourseProgramId} onChange={(e) => setNewCourseProgramId(e.target.value)} placeholder="e.g., 5" />
                </div>
              </div>
            ) : null}
            <div className="mt-2 text-sm text-muted-foreground">
              {coursesLoading ? <span>Loading course options…</span> : null}
            </div>
          </div>

          <div>
            <Label htmlFor="class-room">Room (optional)</Label>
            <Input id="class-room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g., Room 202" />
          </div>

          <div>
            <Label htmlFor="class-academic-year">Academic Year (optional)</Label>
            <Input id="class-academic-year" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g., 2025-2026" />
          </div>

          <div>
            <Label htmlFor="class-semester">Semester (optional)</Label>
            <Input id="class-semester" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g., Fall" />
          </div>

          <div>
            <Label htmlFor="class-description">Description (optional)</Label>
            <Textarea id="class-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          {/* status field removed */}

          <div>
            <Label htmlFor="class-secretary">Assigned Secretary (profile id)</Label>
            <Input id="class-secretary" value={assignedSecretary} onChange={(e) => setAssignedSecretary(e.target.value)} placeholder="e.g., 123" />
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <IconLoader2 className="w-4 h-4 mr-2 animate-spin" /> : <IconDeviceFloppy className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default EditClassDrawer;

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IconLoader2, IconDeviceFloppy } from "@tabler/icons-react";
import { useToast } from "@/hooks/use-toast";
import { classesAPI } from "@/lib/api/classes";
import { coursesAPI } from "@/lib/api/courses";
import { checkAuth } from "@/lib/clientAuth";
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
  const router = useRouter();

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
  const [classCode, setClassCode] = useState<string | null>(null);
  const [generateClassCode, setGenerateClassCode] = useState<boolean>(false);

  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [localCourses, setLocalCourses] = useState<typeof courses>(() => (courses ?? []) as any);
  const [localCoursesLoading, setLocalCoursesLoading] = useState(false);
  const [enrollees, setEnrollees] = useState<Array<any>>([]);
  const [enrolleesLoading, setEnrolleesLoading] = useState(false);

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
    // When the drawer opens we should prefill from the authenticated "mine" endpoint
    // so do the fetch whenever the drawer becomes open for this selected class.
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
        setClassCode(src.class_code ?? null);
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
        setClassCode((selectedClass as any).class_code ?? null);
        // status field removed from edit form
        setAssignedSecretary((selectedClass as any).assigned_secretary ? String((selectedClass as any).assigned_secretary) : "");
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };

    // Only fetch when the drawer is open for this class
    if (open && (selectedClass as any) && (selectedClass as any).id) {
      void doPrefill();
    }

    return () => {
      mounted = false;
    };
  }, [selectedClass, open]);

  // Fetch enrollees for secretary selection when class selected
  useEffect(() => {
    if (!selectedClass) return;
    let mounted = true;
    setEnrolleesLoading(true);
    (async () => {
      try {
        const list = await classesAPI.getMyClassEnrollees(Number(selectedClass.id)).catch(() => []);
        if (!mounted) return;
        setEnrollees(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.error('Failed to load enrollees', err);
        toast({ title: 'Failed to load students', description: String(err?.message ?? err) });
        if (mounted) setEnrollees([]);
      } finally {
        if (mounted) setEnrolleesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedClass]);

  const handleSave = async () => {
    if (!selectedClass) return;

    // Verify session before saving class
    try {
      const ok = await checkAuth();
      if (!ok) {
        const redirectTo = encodeURIComponent(window.location.pathname || '/');
        router.push(`/auth/login?redirect=${redirectTo}`);
        return;
      }
    } catch (err) {
      const redirectTo = encodeURIComponent(window.location.pathname || '/');
      router.push(`/auth/login?redirect=${redirectTo}`);
      return;
    }

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

      const updatedRaw = await classesAPI.updateMyClass(Number(selectedClass.id), payload as any, { generate_class_code: generateClassCode });
      // Normalize backend response to the frontend `ClassItem` shape so parent list updates correctly
      const normalized = {
        id: String(updatedRaw?.id ?? selectedClass.id),
        course_id: updatedRaw?.course_id ?? undefined,
        class_code: updatedRaw?.class_code ?? null,
        course_code: updatedRaw?.course_code ?? null,
        course_name: updatedRaw?.course_name ?? null,
        program_id: updatedRaw?.program_id ?? null,
        program_name: updatedRaw?.program_name ?? null,
        organization_id: updatedRaw?.organization_id ?? null,
        organization_name: updatedRaw?.organization_name ?? null,
        description: updatedRaw?.description ?? null,
        room: updatedRaw?.room ?? null,
        assigned_faculty_id: updatedRaw?.assigned_faculty_id ?? null,
        assigned_faculty_name: updatedRaw?.assigned_faculty_name ?? null,
        academic_year: updatedRaw?.academic_year ?? null,
        semester: updatedRaw?.semester ?? null,
        schedules: Array.isArray(updatedRaw?.schedules) ? updatedRaw.schedules : [],
        enrolledStudents: updatedRaw?.enrolled_students ?? updatedRaw?.students_count ?? 0,
        attendanceRate: typeof updatedRaw?.attendance_rate === 'number' ? updatedRaw.attendance_rate : (updatedRaw?.attendance_rate ? Number(updatedRaw.attendance_rate) : 0),
        status: updatedRaw?.status ?? 'Active',
      } as any;

      // If class_code changed, show a special message indicating previous -> current
      const prevClassCode = classCode;
      if (prevClassCode && normalized?.class_code && String(prevClassCode) !== String(normalized.class_code)) {
        toast({ title: "Class code updated", description: `Class ${prevClassCode} → ${normalized.class_code} has been updated.` });
      } else {
        toast({ title: "Class updated", description: `Updated class ${normalized?.class_code ?? normalized?.course_name ?? selectedClass.id}` });
      }
      // refresh classCode if server generated one
      setClassCode(normalized?.class_code ?? null);
      // Clear transient checkboxes so ticks don't persist between edits
      setGenerateClassCode(false);
      setCreateNewCourse(false);
      onSave?.(normalized);
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
            <div>
              <Label>Class Code</Label>
              <div className="mt-1 flex items-center gap-3">
                <Input readOnly value={classCode ?? "(none)"} className="w-48" />
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="checkbox" checked={generateClassCode} onChange={(e) => setGenerateClassCode(Boolean(e.target.checked))} />
                  <span className="text-sm">Generate new class code</span>
                </label>
              </div>
            </div>
          </div>
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
                {coursesLoading || localCoursesLoading ? <span>Loading course options…</span> : null}
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

          {/* Secretary selection: show enrollees similar to EnrollStudentDrawer */}
          <div>
            <Label>Assign Secretary</Label>
            <div className="max-h-44 overflow-y-auto border rounded-lg p-2 space-y-2 mt-2">
              {enrolleesLoading ? (
                <div className="text-sm text-muted-foreground">Loading students…</div>
              ) : enrollees && enrollees.length > 0 ? (
                enrollees.map((s: any) => (
                  <div key={String(s.profile_id ?? s.id)} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">{(s.full_name || '').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{s.full_name ?? `Profile ${s.profile_id ?? s.id}`}</div>
                        <div className="text-xs text-muted-foreground">{s.enrollment_date ?? ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {String(assignedSecretary) === String(s.profile_id) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600">Selected</span>
                          <Button size="sm" variant="ghost" onClick={() => setAssignedSecretary("")}>Clear</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setAssignedSecretary(String(s.profile_id))}>
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No enrolled students available</div>
              )}
            </div>

            {/* manual entry removed; select from enrolled students only */}
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

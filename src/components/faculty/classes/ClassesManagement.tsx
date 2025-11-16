"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { classesAPI } from "@/lib/api/classes";
import { coursesAPI } from "@/lib/api/courses";
import { useAuthContext } from "@/contexts/AuthContext";
import MyClasses, { ClassItem } from "./MyClasses";
import CreateClassDrawer from "./CreateClassDrawer";
import ViewClassDrawer from "./ViewClassDrawer";
import EditClassDrawer from "./EditClassDrawer";
import EnrollStudentDrawer from "./EnrollStudentDrawer";

export default function ClassesManagement() {
  const { toast } = useToast();
  const { user } = useAuthContext();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<
    Array<{
      id: number;
      code?: string;
      name?: string;
      program_id?: number | null;
      program_name?: string | null;
      organization_id?: number | null;
      organization_name?: string | null;
    }
  >>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Drawer / selection state
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [viewClassOpen, setViewClassOpen] = useState(false);
  const [editClassOpen, setEditClassOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  // Create form states (faculty drawer expects these props)
  const [newCourseId, setNewCourseId] = useState("");
  const [newClassRoom, setNewClassRoom] = useState("");
  const [newClassAcademicYear, setNewClassAcademicYear] = useState("");
  const [newClassSemester, setNewClassSemester] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [addingClass, setAddingClass] = useState(false);
  // Inline course creation states
  const [createNewCourse, setCreateNewCourse] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [newCourseProgramId, setNewCourseProgramId] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await classesAPI.listMyClasses();
        if (!mounted) return;
        const normalized: ClassItem[] = Array.isArray(data)
          ? data.map((d: any) => ({
              id: String(d.id),
              name: d.course_name ?? d.class_code ?? `Class ${d.id}`,
              code: d.class_code ?? "",
              schedule: Array.isArray(d.schedules) ? d.schedules.map((s: any) => s.type === 'normal' ? `${s.day_of_week} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}` : (s.type === 'special' ? `${s.date} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}` : '')).filter(Boolean).join(", ") : (d.room ?? ""),
              mode: "In-Person",
              enrolledStudents: d.enrolled_students ?? d.students_count ?? 0,
              totalSessions: d.total_sessions ?? 0,
              completedSessions: d.completed_sessions ?? 0,
              attendanceRate: typeof d.attendance_rate === 'number' ? d.attendance_rate : (d.attendance_rate ? Number(d.attendance_rate) : 0),
              status: "Active",
              location: d.room ?? d.location ?? undefined,
            }))
          : [];
        setClasses(normalized);
      } catch (err: any) {
        console.error("Failed to load faculty classes", err);
        toast({ title: "Failed to load classes", description: String(err?.message ?? err) });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);
  // Load course options separately so the Create drawer can render a dropdown.
  useEffect(() => {
    let mounted = true;

    (async () => {
      setCoursesLoading(true);
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
        if (mounted) setCourses(normalizedCourses);
      } catch (err: any) {
        console.info("course options for current user unavailable", err?.message ?? err);
        if (mounted) setCourses([]);
        toast({ title: "Courses unavailable", description: String(err?.message ?? err) });
      } finally {
        if (mounted) setCoursesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Also fetch when the Create drawer opens (retry if no options yet)
  useEffect(() => {
    if (!addClassOpen) return;
    if (courses && courses.length > 0) return; // already have options
    let mounted = true;
    (async () => {
      setCoursesLoading(true);
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
        if (mounted) setCourses(normalizedCourses);
      } catch (err) {
        if (mounted) setCourses([]);
      } finally {
        if (mounted) setCoursesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [addClassOpen]);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await classesAPI.listMyClasses();
      const normalized: ClassItem[] = Array.isArray(data)
        ? data.map((d: any) => ({
            id: String(d.id),
            name: d.course_name ?? d.class_code ?? `Class ${d.id}`,
            code: d.class_code ?? "",
            schedule: Array.isArray(d.schedules) ? d.schedules.map((s: any) => s.type === 'normal' ? `${s.day_of_week} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}` : (s.type === 'special' ? `${s.date} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}` : '')).filter(Boolean).join(", ") : (d.room ?? ""),
            mode: "In-Person",
            enrolledStudents: d.enrolled_students ?? d.students_count ?? 0,
            totalSessions: d.total_sessions ?? 0,
            completedSessions: d.completed_sessions ?? 0,
            attendanceRate: typeof d.attendance_rate === 'number' ? d.attendance_rate : (d.attendance_rate ? Number(d.attendance_rate) : 0),
            status: "Active",
            location: d.room ?? d.location ?? undefined,
          }))
        : [];
      setClasses(normalized);
    } catch (err: any) {
      console.error("Failed to refresh classes", err);
      toast({ title: "Failed to refresh classes", description: String(err?.message ?? err) });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!createNewCourse && !newCourseId) {
      toast({ title: "Validation", description: "Course id is required", variant: "destructive" });
      return;
    }
    if (createNewCourse) {
      if (!newCourseCode || !newCourseName) {
        toast({ title: "Validation", description: "New course code and name are required", variant: "destructive" });
        return;
      }
      if (!newCourseProgramId) {
        toast({ title: "Validation", description: "Program selection is required when creating a new course", variant: "destructive" });
        return;
      }
    }
    setAddingClass(true);
    try {
      const payload: any = {};
      if (createNewCourse) {
        // Create the course first via Courses API, then use its id when creating the class.
        const nc: any = { code: newCourseCode, name: newCourseName };
        if (newCourseDescription) nc.description = newCourseDescription;
        nc.program_id = Number(newCourseProgramId);
        const createdCourse = await coursesAPI.createCourse(nc);
        // Ensure we have an id
        if (!createdCourse || (createdCourse && (createdCourse.id === undefined || createdCourse.id === null))) {
          throw new Error('Failed to create course');
        }
        payload.course_id = Number(createdCourse.id);
      } else {
        payload.course_id = Number(newCourseId);
      }
      if (newClassDescription) payload.description = newClassDescription;
      if (newClassRoom) payload.room = newClassRoom;
      if (newClassAcademicYear) payload.academic_year = newClassAcademicYear;
      if (newClassSemester) payload.semester = newClassSemester;
      const created = await classesAPI.createMyClass(payload);
      const displayName = created?.class_code
        ? `${created.class_code}${created.course_name ? ` — ${created.course_name}` : ''}`
        : (created?.course_name ?? created?.name ?? `Class ${created?.id ?? ''}`);
      toast({ title: "Class created", description: `Created class ${displayName ? `"${displayName}"` : ''}` });
      // prepend to list
      setClasses((prev) => [{
        id: String(created.id),
        name: created.course_name ?? created.class_code ?? `Class ${created.id}`,
        code: created.class_code ?? "",
        schedule: created.room ?? "",
        mode: "In-Person",
        enrolledStudents: created.enrolled_students ?? created.students_count ?? 0,
        totalSessions: created.total_sessions ?? 0,
        completedSessions: created.completed_sessions ?? 0,
        attendanceRate: typeof created.attendance_rate === 'number' ? created.attendance_rate : (created.attendance_rate ? Number(created.attendance_rate) : 0),
        status: "Active",
        location: created.room ?? created.location ?? undefined,
      }, ...prev]);
      setAddClassOpen(false);
      // reset form
      setNewCourseId("");
      setNewClassRoom("");
      setNewClassAcademicYear("");
      setNewClassSemester("");
      setNewClassDescription("");
      // reset inline course fields
      setCreateNewCourse(false);
      setNewCourseCode("");
      setNewCourseName("");
      setNewCourseDescription("");
      setNewCourseProgramId("");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Create failed", description: String(err?.message ?? err) });
    } finally {
      setAddingClass(false);
    }
  };

  return (
    <div className="space-y-4">
      <MyClasses
        classes={classes}
        setAddClassOpen={setAddClassOpen}
        setSelectedClass={(c) => setSelectedClass(c)}
        setViewClassOpen={setViewClassOpen}
        setEditClassOpen={setEditClassOpen}
        setEnrollStudentOpen={setEnrollOpen}
        handleStartSession={(classId: string) => { /* noop for now */ }}
      />

      <CreateClassDrawer
        open={addClassOpen}
        onOpenChange={setAddClassOpen}
        newCourseId={newCourseId}
        setNewCourseId={setNewCourseId}
        newClassRoom={newClassRoom}
        setNewClassRoom={setNewClassRoom}
        newClassAcademicYear={newClassAcademicYear}
        setNewClassAcademicYear={setNewClassAcademicYear}
        newClassSemester={newClassSemester}
        setNewClassSemester={setNewClassSemester}
        newClassDescription={newClassDescription}
        setNewClassDescription={setNewClassDescription}
        courses={courses}
        coursesLoading={coursesLoading}
        onReloadCourses={() => {
          void (async () => {
            setCoursesLoading(true);
            try {
              const opts = await coursesAPI.getCourseOptionsForMe();
              const normalizedCourses = Array.isArray(opts) ? opts.map((c: any) => ({ id: Number(c.id), code: c.code, name: c.name })) : [];
              setCourses(normalizedCourses);
            } catch (err) {
              setCourses([]);
            } finally {
              setCoursesLoading(false);
            }
          })();
        }}
        // inline course props
        createNewCourse={createNewCourse}
        setCreateNewCourse={setCreateNewCourse}
        newCourseCode={newCourseCode}
        setNewCourseCode={setNewCourseCode}
        newCourseName={newCourseName}
        setNewCourseName={setNewCourseName}
        newCourseDescription={newCourseDescription}
        setNewCourseDescription={setNewCourseDescription}
        newCourseProgramId={newCourseProgramId}
        setNewCourseProgramId={setNewCourseProgramId}
        addingClass={addingClass}
        onAddClass={handleAddClass}
      />

      <ViewClassDrawer
        open={viewClassOpen}
        onOpenChange={setViewClassOpen}
        selectedClass={selectedClass}
        onOpenEnroll={() => setEnrollOpen(true)}
        onViewStudent={() => {}}
      />

      <EditClassDrawer
        open={editClassOpen}
        onOpenChange={setEditClassOpen}
        selectedClass={selectedClass}
        onSave={(updated) => {
          // update in-place
          setClasses((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
          setEditClassOpen(false);
        }}
      />

      <EnrollStudentDrawer
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        onEnrollStudent={() => { void refresh(); setEnrollOpen(false); }}
        onManualEnroll={() => { void refresh(); setEnrollOpen(false); }}
      />
    </div>
  );
}

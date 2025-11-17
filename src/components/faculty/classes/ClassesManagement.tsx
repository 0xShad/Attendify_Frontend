"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { classesAPI } from "@/lib/api/classes";
import { coursesAPI } from "@/lib/api/courses";
import { useAuthContext } from "@/contexts/AuthContext";
import MyClasses from "./MyClasses";
import type { ClassItem } from "./ClassCard";
import CreateClassDrawer from "./CreateClassDrawer";
import ViewClassDrawer from "./ViewClassDrawer";
import EditClassDrawer from "./EditClassDrawer";
import EnrollStudentDrawer from "./EnrollStudentDrawer";
import SearchBar from "./SearchBar";
import ClassesFilters from "./ClassesFilters";

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

  // Local search & filter UI state (client-side only; no backend yet)
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<any>({});

  // Debounce refs for search
  const searchDebounceRef = useRef<number | null>(null);
  const firstSearchRun = useRef(true);

  useEffect(() => {
    // initial load: fetch without filters
    void (async () => {
      await fetchClasses();
    })();
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
            course_id: d.course_id ?? undefined,
            class_code: d.class_code ?? null,
            course_code: d.course_code ?? null,
            course_name: d.course_name ?? null,
            program_id: d.program_id ?? null,
            program_name: d.program_name ?? null,
            organization_id: d.organization_id ?? null,
            organization_name: d.organization_name ?? null,
            description: d.description ?? null,
            room: d.room ?? null,
            assigned_faculty_id: d.assigned_faculty_id ?? null,
            assigned_faculty_name: d.assigned_faculty_name ?? null,
            academic_year: d.academic_year ?? null,
            semester: d.semester ?? null,
            schedules: Array.isArray(d.schedules) ? d.schedules : [],
            enrolledStudents: d.enrolled_students ?? d.students_count ?? 0,
            attendanceRate: typeof d.attendance_rate === 'number' ? d.attendance_rate : (d.attendance_rate ? Number(d.attendance_rate) : 0),
            status: d.status ?? 'Active',
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
      // prepend to list using the new ClassItem shape
      setClasses((prev) => [{
        id: String(created.id),
        course_id: created.course_id ?? undefined,
        class_code: created.class_code ?? null,
        course_code: created.course_code ?? null,
        course_name: created.course_name ?? null,
        program_id: created.program_id ?? null,
        program_name: created.program_name ?? null,
        organization_id: created.organization_id ?? null,
        organization_name: created.organization_name ?? null,
        description: created.description ?? null,
        room: created.room ?? null,
        assigned_faculty_id: created.assigned_faculty_id ?? null,
        assigned_faculty_name: created.assigned_faculty_name ?? null,
        academic_year: created.academic_year ?? null,
        semester: created.semester ?? null,
        schedules: [],
        enrolledStudents: created.enrolled_students ?? created.students_count ?? 0,
        attendanceRate: typeof created.attendance_rate === 'number' ? created.attendance_rate : (created.attendance_rate ? Number(created.attendance_rate) : 0),
        status: created.status ?? 'Active',
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

  // Build API params from local filters
  const buildParamsFromFilters = (f: any = {}) => {
    const params: any = {};
    if (f.organization) {
      const v = String(f.organization);
      if (v && v !== "all") params.organization_id = Number(v);
    }
    if (f.program) {
      const v = String(f.program);
      if (v && v !== "all") params.program_id = Number(v);
    }
    if (f.course_option) {
      const v = String(f.course_option);
      if (v && v !== "all") params.course_id = Number(v);
    }
    if (f.academic_year) params.academic_year = String(f.academic_year);
    if (f.semester && String(f.semester) !== "all") params.semester = String(f.semester);
    if (f.room) params.room = String(f.room);
    if (f.instructor) {
      const v = String(f.instructor);
      if (v && v !== "all") params.assigned_faculty_id = Number(v);
    }
    if (f.class_code) params.class_code = String(f.class_code);
    return params;
  };

  // Centralized fetch routine that calls the backend and normalizes results
  const fetchClasses = async (opts: any = {}) => {
    setLoading(true);
    try {
      const params = { ...buildParamsFromFilters(filters), ...opts };
      const data = await classesAPI.listMyClasses(params as any);
      const normalized: ClassItem[] = Array.isArray(data)
        ? data.map((d: any) => ({
            id: String(d.id),
            course_id: d.course_id ?? undefined,
            class_code: d.class_code ?? null,
            course_code: d.course_code ?? null,
            course_name: d.course_name ?? null,
            program_id: d.program_id ?? null,
            program_name: d.program_name ?? null,
            organization_id: d.organization_id ?? null,
            organization_name: d.organization_name ?? null,
            description: d.description ?? null,
            room: d.room ?? null,
            assigned_faculty_id: d.assigned_faculty_id ?? null,
            assigned_faculty_name: d.assigned_faculty_name ?? null,
            academic_year: d.academic_year ?? null,
            semester: d.semester ?? null,
            schedules: Array.isArray(d.schedules) ? d.schedules : [],
            enrolledStudents: d.enrolled_students ?? d.students_count ?? 0,
            attendanceRate: typeof d.attendance_rate === 'number' ? d.attendance_rate : (d.attendance_rate ? Number(d.attendance_rate) : 0),
            status: d.status ?? 'Active',
          }))
        : [];
      setClasses(normalized);
    } catch (err: any) {
      console.error("Failed to load faculty classes", err);
      toast({ title: "Failed to load classes", description: String(err?.message ?? err) });
    } finally {
      setLoading(false);
    }
  };

  // Immediate search handler (cancels any pending debounce and calls API)
  const handleSearchImmediate = (query?: string) => {
    // clear pending debounce
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    const q = String(query ?? searchQuery ?? "").trim();
    if (q) {
      void fetchClasses({ class_code: q });
    } else {
      void fetchClasses();
    }
  };

  // Debounce effect: wait 1.5s after typing stops to call backend search
  useEffect(() => {
    // skip the very first render (initial load already fetches)
    if (firstSearchRun.current) {
      firstSearchRun.current = false;
      return;
    }

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    const q = String(searchQuery ?? "").trim();
    searchDebounceRef.current = window.setTimeout(() => {
      if (q) {
        void fetchClasses({ class_code: q });
      } else {
        void fetchClasses();
      }
      searchDebounceRef.current = null;
    }, 1500);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [searchQuery]);

  // Compute filtered classes locally based on search and filters
  const filteredClasses = useMemo(() => {
    const q = String(searchQuery ?? "").trim().toLowerCase();
    return classes.filter((c) => {
      // Search matching (class code, course code, course name, description)
      if (q) {
        const hay = (
          String(c.class_code ?? "") + " " +
          String(c.course_code ?? "") + " " +
          String(c.course_name ?? "") + " " +
          String(c.description ?? "")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // Organization filter
      if (filters.organization) {
        if (String(filters.organization) !== "all" && String(c.organization_id ?? "") !== String(filters.organization)) return false;
      }
      // Program filter
      if (filters.program) {
        if (String(filters.program) !== "all" && String(c.program_id ?? "") !== String(filters.program)) return false;
      }
      // Course option (course id)
      if (filters.course_option) {
        if (String(filters.course_option) !== "all" && String(c.course_id ?? "") !== String(filters.course_option)) return false;
      }
      // Academic year
      if (filters.academic_year) {
        if (String(filters.academic_year) !== String(c.academic_year ?? "")) return false;
      }
      // Semester
      if (filters.semester) {
        if (String(filters.semester) !== "all" && String(filters.semester) !== String(c.semester ?? "")) return false;
      }
      // Room
      if (filters.room) {
        if (!String(c.room ?? "").toLowerCase().includes(String(filters.room).toLowerCase())) return false;
      }
      // Instructor (assigned_faculty_id)
      if (filters.instructor) {
        if (String(filters.instructor) !== "all" && String(c.assigned_faculty_id ?? "") !== String(filters.instructor)) return false;
      }

      return true;
    });
  }, [classes, searchQuery, filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <SearchBar
          value={searchQuery}
          onChange={(v) => setSearchQuery(v)}
          onSearch={() => {
            // perform immediate server-side search and cancel debounce
            handleSearchImmediate();
          }}
          onClear={() => { setSearchQuery(""); handleSearchImmediate(""); }}
        />
        <ClassesFilters
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          filters={filters}
          onFiltersChange={(f) => setFilters(f)}
          onClearFilters={() => { setFilters({}); void fetchClasses(); }}
          onApplyFilters={(f) => { setFilters(f); void fetchClasses(buildParamsFromFilters(f)); setFiltersOpen(false); }}
        />
      </div>
      <MyClasses
        classes={filteredClasses}
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

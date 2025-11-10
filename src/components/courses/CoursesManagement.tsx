"use client";

import React, { useEffect, useState } from "react";
import { IconBooks, IconDots, IconPlus } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CoursesHeader from "./CoursesHeader";
import CoursesTable from "./CoursesTable";
import AddCourseDrawer from "./AddCourseDrawer";
import EditCourseDrawer from "./EditCourseDrawer";
import ViewCourseDrawer from "./ViewCourseDrawer";
import DeleteCourseDialog from "./DeleteCourseDialog";
import type { Course, CourseFormData, ProgramOption, SchoolOption } from "./types";
import type { CoursesFilterValues } from "./CoursesFilters";
import { listSchools } from "@/lib/api/schools";
import { listPrograms } from "@/lib/api/programs";
import { coursesAPI, listCourses } from "@/lib/api/courses";
import { useToast } from "@/hooks/use-toast";

export function CoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  // track the term the user actually submitted (via Search button / Enter)
  const [searchSubmittedTerm, setSearchSubmittedTerm] = useState("");
  // filters matching `CoursesFilterValues` (code, name, program, min_classes, max_classes)
  const [filters, setFilters] = useState<CoursesFilterValues>({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [viewCourseOpen, setViewCourseOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CourseFormData>({
    code: "",
    name: "",
    program_name: "",
    program_id: undefined,
    school_id: undefined,
    school_name: undefined,
    description: "",
    prerequisites: [],
  });

  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const { toast } = useToast();
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    name: true,
    program: true,
    school: true,
    classes: true,
  });

  useEffect(() => {
    let mounted = true;
    setLoadingPrograms(true);
    listPrograms()
      .then((data) => {
        if (!mounted) return;
        // normalize to ProgramOption shape (id, code, name, description)
        const normalized = Array.isArray(data)
          ? data.map((p: any) => ({ id: Number(p.id), code: p.code, name: p.name, description: p.description, organization_id: p.organization_id }))
          : [];
        setPrograms(normalized);
      })
      .catch((err: any) => {
        console.error("Failed to load programs", err);
        toast({ title: "Failed to load programs", description: String(err?.message ?? err) });
      })
      .finally(() => setLoadingPrograms(false));
    return () => {
      mounted = false;
    };
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    setLoadingSchools(true);
    listSchools()
      .then((data) => {
        if (!mounted) return;
        // filter client-side for Academic type and normalize to SchoolOption (id, name)
        const normalized = Array.isArray(data)
          ? data.filter((s: any) => (s?.type ?? '').toString() === 'Academic').map((s: any) => ({ id: Number(s.id), name: s.name }))
          : [];
        setSchools(normalized);
      })
      .catch((err: any) => {
        console.error("Failed to load schools", err);
        toast({ title: "Failed to load schools", description: String(err?.message ?? err) });
      })
      .finally(() => setLoadingSchools(false));
    return () => {
      mounted = false;
    };
  }, [toast]);

  // Debounce: when user stops typing for 2s, auto-submit the search
  useEffect(() => {
    // If input cleared, clear submitted term immediately so list resets
    if (!searchTerm || !searchTerm.trim()) {
      setSearchSubmittedTerm("");
      return;
    }

    const id = setTimeout(() => {
      const trimmed = searchTerm.trim();
      setSearchSubmittedTerm((prev) => (prev === trimmed ? prev : trimmed));
    }, 1500);

    return () => clearTimeout(id);
  }, [searchTerm]);

  // Fetch courses from backend based on submitted search and filters
  useEffect(() => {
    let mounted = true;
    setLoadingCourses(true);
    const params: any = { skip: 0, limit: 100 };
    // call API: always use the unified GET /courses endpoint. If a submitted query exists, use 'query' (OR search on code/name). Otherwise list with other params.
    (async () => {
      try {
        const listParams: any = { skip: params.skip, limit: params.limit };
        if (searchSubmittedTerm && searchSubmittedTerm.trim()) {
          // use query param which does OR search on code or name
          listParams.query = searchSubmittedTerm.trim();
        } else if (filters.query && (filters.query ?? "").trim()) {
          // use query provided via Filters drawer (course field)
          listParams.query = (filters.query ?? "").trim();
        }
        // include organization (school) filter if present
        if (filters.school && filters.school !== "all") {
          const oid = parseInt(filters.school, 10);
          if (!isNaN(oid)) listParams.organization_id = oid;
        }
        if (filters.program && filters.program !== "all") {
          const pid = parseInt(filters.program, 10);
          if (!isNaN(pid)) listParams.program_id = pid;
        }
        if (filters.min_classes) {
          const v = parseInt(filters.min_classes, 10);
          if (!isNaN(v)) listParams.min_classes = v;
        }
        if (filters.max_classes) {
          const v = parseInt(filters.max_classes, 10);
          if (!isNaN(v)) listParams.max_classes = v;
        }
        const data = await listCourses(listParams);
        if (!mounted) return;
        // normalize backend shape to frontend Course[] if needed
        const normalized = Array.isArray(data)
          ? data.map((c: any) => ({
              id: Number(c.id),
              code: c.code,
              name: c.name,
              description: c.description ?? null,
              program_id: c.program_id ?? null,
              program_name: c.program_name ?? c.program ?? null,
              program_code: c.program_code ?? null,
              classes_count: typeof c.classes_count === 'number' ? c.classes_count : undefined,
              // include organization/school fields returned by the backend
              school_id: c.organization_id ?? undefined,
              school_name: c.organization_name ?? undefined,
              units: c.units ?? 0,
              hours: c.hours ?? 0,
              semester: c.semester ?? undefined,
              yearLevel: c.yearLevel ?? undefined,
              status: c.status ?? undefined,
              prerequisites: c.prerequisites ?? [],
            }))
          : [];
        setCourses(normalized);
      } catch (err: any) {
        console.error("Failed to load courses", err);
        toast({ title: "Failed to load courses", description: String(err?.message ?? err) });
      } finally {
        if (mounted) setLoadingCourses(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [searchSubmittedTerm, filters, toast]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase());
    // program filter may be undefined or a program id string
    let matchesProgram = true;
    if (filters.program && filters.program !== "all") {
      const pid = parseInt(filters.program, 10);
      if (!isNaN(pid)) matchesProgram = course.program_id === pid;
      else matchesProgram = (course.program_name ?? course.program_code ?? "") === filters.program;
    }
    // min/max classes client-side safety (in addition to server-side)
    if (filters.min_classes) {
      const min = parseInt(filters.min_classes, 10);
      if (!isNaN(min) && (typeof course.classes_count !== 'number' || course.classes_count < min)) return false;
    }
    if (filters.max_classes) {
      const max = parseInt(filters.max_classes, 10);
      if (!isNaN(max) && (typeof course.classes_count !== 'number' || course.classes_count > max)) return false;
    }
    return matchesSearch && matchesProgram;
  });

  // Open edit drawer with fresh data from backend for the given course
  async function openEditCourse(c: Course) {
    try {
      setLoadingCourses(true);
      const data: any = await coursesAPI.getCourse(c.id);
      // map backend Course object to CourseFormData and Course
      const mappedForm: CourseFormData = {
        code: data.code ?? "",
        name: data.name ?? "",
        program_name: data.program_name ?? data.program_code ?? "",
        program_id: data.program_id ?? undefined,
        school_id: data.organization_id ?? undefined,
        school_name: data.organization_name ?? undefined,
        description: data.description ?? "",
        prerequisites: data.prerequisites ?? [],
      };
      // Ensure the organization returned by the API is present in the schools list
      if (data.organization_id) {
        const orgId = Number(data.organization_id);
        setSchools((prev) => {
          const exists = (prev ?? []).some((s) => s.id === orgId);
          if (exists) return prev;
          // add the org at the front so it's more likely visible in long lists
          return [{ id: orgId, name: data.organization_name ?? `Organization ${orgId}` }, ...(prev ?? [])];
        });
      }
      // set form data after ensuring schools state is updated (state updates are batched)
      setFormData(mappedForm);
      const mappedCourse: Course = {
        id: Number(data.id),
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        program_id: data.program_id ?? null,
        program_name: data.program_name ?? data.program ?? null,
        program_code: data.program_code ?? null,
        classes_count: typeof data.classes_count === 'number' ? data.classes_count : 0,
        school_id: data.organization_id ?? undefined,
        school_name: data.organization_name ?? undefined,
        prerequisites: data.prerequisites ?? [],
      };
  setSelectedCourse(mappedCourse);
  // open the drawer on the next tick to allow Select to pick up the newly-added school option
  setTimeout(() => setEditCourseOpen(true), 0);
    } catch (err: any) {
      console.error("Failed to load course details", err);
      toast({ title: "Failed to load course", description: String(err?.message ?? err) });
    } finally {
      setLoadingCourses(false);
    }
  }

  // Open view drawer with fresh data from backend for the given course
  async function openViewCourse(c: Course) {
    try {
      setLoadingCourses(true);
      const data: any = await coursesAPI.getCourse(c.id);
      const mappedCourse: Course = {
        id: Number(data.id),
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        program_id: data.program_id ?? null,
        program_name: data.program_name ?? data.program ?? null,
        program_code: data.program_code ?? null,
        classes_count: typeof data.classes_count === 'number' ? data.classes_count : 0,
        units: data.units ?? 0,
        hours: data.hours ?? 0,
        semester: data.semester ?? undefined,
        yearLevel: data.yearLevel ?? undefined,
        status: data.status ?? undefined,
        school_id: data.organization_id ?? undefined,
        school_name: data.organization_name ?? undefined,
        prerequisites: data.prerequisites ?? [],
      };
      setSelectedCourse(mappedCourse);
      setViewCourseOpen(true);
    } catch (err: any) {
      console.error("Failed to load course details for view", err);
      toast({ title: "Failed to load course", description: String(err?.message ?? err) });
    } finally {
      setLoadingCourses(false);
    }
  }

  function handleAdd(created?: any) {
    // Called by AddCourseDrawer after it creates a course.
    if (!created) return;
    const toAdd: Course = {
      id: created.id ?? Date.now(),
      code: created.code,
      name: created.name,
      description: created.description ?? null,
      program_id: created.program_id ?? null,
      program_name: created.program_name ?? created.program ?? undefined,
      program_code: created.program_code ?? undefined,
      classes_count: typeof created.classes_count === 'number' ? created.classes_count : undefined,
      school_id: created.school_id ?? undefined,
      school_name: created.school_name ?? undefined,
      prerequisites: created.prerequisites ?? [],
    };
    setCourses((s) => [...s, toAdd]);
    setAddCourseOpen(false);
    setFormData({ code: "", name: "", program_name: "", program_id: undefined, school_id: undefined, school_name: undefined, description: "", prerequisites: [] });
  }

  function handleEditSave() {
    if (!selectedCourse) return;
    updateCourseHandler(selectedCourse.id, { ...formData });
  }

  function handleDeleteConfirm() {
    if (!selectedCourse) return;
    deleteCourseHandler(selectedCourse.id);
  }

  // Note: creation now performed inside AddCourseDrawer; handleAdd is called with created course.
  async function updateCourseHandler(id: number, payload: Partial<CourseFormData>) {
    try {
      // Build a minimal update payload matching the backend CourseUpdate schema
      const body: any = {};
      if (payload.code !== undefined) body.code = payload.code;
      if (payload.name !== undefined) body.name = payload.name;
      if (payload.description !== undefined) body.description = payload.description;
      if (payload.program_id !== undefined) body.program_id = payload.program_id;

      const updated = await coursesAPI.updateCourse(id, body);
      setCourses((s) => s.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      setEditCourseOpen(false);
      setSelectedCourse(null);
      toast({ title: "Course updated", description: `${updated.code ?? id} updated` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to update course", description: String(err?.message ?? err) });
    }
  }

  async function deleteCourseHandler(id: number) {
    try {
      await coursesAPI.deleteCourse(id);
      setCourses((s) => s.filter((c) => c.id !== id));
      setDeleteDialogOpen(false);
      setSelectedCourse(null);
      toast({ title: "Course deleted", description: `Course ${id} removed` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to delete course", description: String(err?.message ?? err) });
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Manage course curriculum and academic subjects</p>
        </div>
      </div>

      <CoursesHeader
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={() => setSearchSubmittedTerm(searchTerm)}
        onClearSearch={() => { setSearchTerm(""); setSearchSubmittedTerm(""); }}
  filters={filters}
  onFiltersChange={(f) => { setFilters(f); }}
  onClearFilters={() => { setFilters({}); }}
        onApplyFilters={() => { /* no-op: filters applied via state */ }}
        programs={programs}
        onAdd={() => setAddCourseOpen(true)}
        visibleColumns={visibleColumns}
        onToggleColumn={(k, v) => setVisibleColumns((s) => ({ ...s, [k]: v }))}
      />

      <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><IconBooks className="h-5 w-5" /> Courses ({filteredCourses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <CoursesTable visibleColumns={visibleColumns} courses={filteredCourses} onView={(c) => { openViewCourse(c); }} onEdit={(c) => { openEditCourse(c); }} onDelete={(c) => { setSelectedCourse(c); setDeleteDialogOpen(true); }} />
        </CardContent>
      </Card>

      {/* Summary cards omitted for brevity - keep original layout if needed */}

  <AddCourseDrawer open={addCourseOpen} onOpenChange={setAddCourseOpen} formData={formData} setFormData={setFormData} onAdd={handleAdd} programs={programs} schools={schools} />
  <EditCourseDrawer open={editCourseOpen} onOpenChange={setEditCourseOpen} formData={formData} setFormData={setFormData} onSave={handleEditSave} programs={programs} schools={schools} />
      <ViewCourseDrawer open={viewCourseOpen} onOpenChange={setViewCourseOpen} course={selectedCourse} onEditFromView={(d) => { setFormData(d); setViewCourseOpen(false); setEditCourseOpen(true); }} />
      <DeleteCourseDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} course={selectedCourse} onConfirm={handleDeleteConfirm} />
    </div>
  );
}

export default CoursesManagement;

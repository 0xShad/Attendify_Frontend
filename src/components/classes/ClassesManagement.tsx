"use client";

import React from "react";
import { useToast } from "@/hooks/use-toast";
import ClassesTable from "./ClassesTable";
import ClassesHeader from "./ClassesHeader";
import CreateClassDrawer from "./CreateClassDrawer";
import ViewClassDrawer from "./ViewClassDrawer";
import EditClassDrawer from "./EditClassDrawer";
import DeleteClassDialog from "./DeleteClassDialog";
import type { Class } from "./types";
import { classesAPI } from "@/lib/api/classes";

export default function ClassesManagement() {
  const { toast } = useToast();

  // Mock data for now — will wire to API next
  const [classes, setClasses] = React.useState<Class[]>([
    {
      id: 1001,
      // frontend-friendly section identifier (optional)
      code: "A",
      // links to Course
      course_id: 501,
      course_code: "CS101",
      course_name: "Introduction to Computer Science",
      description: "Fundamentals of programming and computation.",
      room: "Bldg 1 - Room 101",
      assigned_faculty_id: 201,
      assigned_faculty_name: "Dr. Ada Lovelace",
      academic_year: "2025-2026",
      semester: "1",
      students_count: 42,
      // denormalized optional fields
      program_id: 101,
      program_name: "Computer Science",
      organization_id: 11,
      organization_name: "School of Computing",
    },
    {
      id: 1002,
      code: "B",
      course_id: 502,
      course_code: "MTH201",
      course_name: "Calculus II",
      description: "Integral calculus and applications.",
      room: "Bldg 2 - Room 204",
      assigned_faculty_id: 202,
      assigned_faculty_name: "Prof. Isaac Newton",
      academic_year: "2025-2026",
      semester: "1",
      students_count: 36,
      program_id: 102,
      program_name: "Mathematics",
      organization_id: 12,
      organization_name: "School of Science",
    },
  ]);

    const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>({
      class_code: true,
      course_code: true,
      name: true,
    program: true,
    organization: true,
    instructor: true,
    room: true,
    academic_year: true,
    semester: true,
  });

  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchSubmittedTerm, setSearchSubmittedTerm] = React.useState("");
  const [filters, setFilters] = React.useState<import("./types").ClassesFilterValues>({});

  const onView = (c: Class) => {
    setViewClassId(Number(c.id));
    setViewOpen(true);
  };

  const onEdit = (c: Class) => {
    // preload class detail and option lists so the Edit modal shows fully-populated selects when opened
    (async () => {
      try {
        const d = await classesAPI.getClass(Number(c.id));
        const orgId = d.organization_id != null ? Number(d.organization_id) : undefined;
        const progId = d.program_id != null ? Number(d.program_id) : undefined;
        // fetch options scoped by organization/program where available
        let progOptions: any[] = [];
        let courseOptions: any[] = [];
        let facultyOptions: any[] = [];
        if (orgId != null) {
          try {
            const p = await (await import("@/lib/api/programs")).getProgramCodesByOrganization(orgId);
            progOptions = Array.isArray(p) ? p : [];
          } catch (_e) {
            progOptions = [];
          }
          try {
            const f = await (await import("@/lib/api/profiles")).listFacultyOptions(orgId);
            facultyOptions = Array.isArray(f) ? f : [];
          } catch (_e) {
            facultyOptions = [];
          }
        }
        if (progId != null) {
          try {
            const copts = await (await import("@/lib/api/courses")).getCourseOptions({ program_id: progId, organization_id: orgId });
            courseOptions = Array.isArray(copts) ? copts : [];
          } catch (_e) {
            courseOptions = [];
          }
        }

        setEditPreload({ classDetail: d, programOptions: progOptions, courseOptions, facultyOptions });
      } catch (err) {
        console.error("Failed to preload class for edit", err);
        toast({ title: "Failed to load class", description: String((err as any)?.message ?? err) });
        setEditPreload(null);
      } finally {
        setEditClassId(Number(c.id));
        setEditOpen(true);
      }
    })();
  };

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteClassId, setDeleteClassId] = React.useState<number | null>(null);
  const [deleteClassLabel, setDeleteClassLabel] = React.useState<string | null>(null);

  const onDelete = (c: Class) => {
    // open confirm dialog and pass class info
    setDeleteClassId(Number(c.id));
    setDeleteClassLabel(c.class_code ?? c.course_name ?? `Class ${c.id}`);
    setDeleteOpen(true);
  };

  const onDeleted = React.useCallback((id: number) => {
    // after deletion, refresh list to reflect server state
    void refreshClasses();
    // clear local delete state
    setDeleteClassId(null);
    setDeleteClassLabel(null);
    setDeleteOpen(false);
  }, []);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewClassId, setViewClassId] = React.useState<number | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editClassId, setEditClassId] = React.useState<number | null>(null);
  const [editPreload, setEditPreload] = React.useState<any | null>(null);
  const onCreateLocal = (payload: Partial<Class>) => {
    // After creation, refresh list from server to reflect authoritative state
    void refreshClasses();
  };

  // debounce searchTerm -> searchSubmittedTerm (auto submit after user stops typing)
  React.useEffect(() => {
    if (!searchTerm || !searchTerm.trim()) {
      setSearchSubmittedTerm("");
      return;
    }
    const id = setTimeout(() => {
      const t = searchTerm.trim();
      setSearchSubmittedTerm((prev) => (prev === t ? prev : t));
    }, 1500);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Fetch classes when submitted search or filters change
  React.useEffect(() => {
    // use the shared refresh function
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        await refreshClasses();
      } catch (err: any) {
        if (!mounted) return;
        console.error("Failed to load classes", err);
        toast({ title: "Failed to load classes", description: String(err?.message ?? err) });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [searchSubmittedTerm, filters, toast]);

  // refresh helper that fetches list from backend, normalizes, applies client filters and updates state
  async function refreshClasses() {
    const params: any = { skip: 0, limit: 200 };
    if ((filters as any).course_option) {
      const cid = parseInt(String((filters as any).course_option), 10);
      if (!isNaN(cid)) params.course_id = cid;
    }
    if ((filters as any).organization) {
      const oid = parseInt(String((filters as any).organization), 10);
      if (!isNaN(oid)) params.organization_id = oid;
    }
    if ((filters as any).program) {
      const pid = parseInt(String((filters as any).program), 10);
      if (!isNaN(pid)) params.program_id = pid;
    }
    if ((filters as any).instructor) {
      const fid = parseInt(String((filters as any).instructor), 10);
      if (!isNaN(fid)) params.assigned_faculty_id = fid;
    }
    if ((filters as any).room) {
      params.room = String((filters as any).room);
    }
    if ((filters as any).academic_year) params.academic_year = (filters as any).academic_year;
    if ((filters as any).semester) params.semester = (filters as any).semester;
    // send the submitted search term to the backend as a class_code filter so
    // server-side partial matching on class_code is applied. We still apply
    // client-side filtering for other fields (course_code/name/description).
    if (searchSubmittedTerm && searchSubmittedTerm.trim()) {
      params.class_code = searchSubmittedTerm.trim();
    }

    const data = await classesAPI.listClasses(params);
    const normalized: Class[] = Array.isArray(data)
      ? data.map((d: any) => ({
          id: Number(d.id),
          code: undefined,
          // map backend class_code (section identifier) into our frontend model
          class_code: d.class_code ?? null,
          course_id: d.course_id != null ? Number(d.course_id) : null,
          course_code: d.course_code ?? null,
          course_name: d.course_name ?? null,
          description: d.description ?? null,
          room: d.room ?? null,
          // backend may return assigned_faculty_id/name or an assigned_faculty object
          assigned_faculty_id: d.assigned_faculty_id != null ? Number(d.assigned_faculty_id) : (d.assigned_faculty?.id != null ? Number(d.assigned_faculty.id) : null),
          assigned_faculty_name: d.assigned_faculty_name ?? (d.assigned_faculty?.name ?? null),
          academic_year: d.academic_year ?? null,
          semester: d.semester ?? null,
          students_count: d.students_count ?? undefined,
          program_id: d.program_id != null ? Number(d.program_id) : null,
          program_name: d.program_name ?? null,
          organization_id: d.organization_id != null ? Number(d.organization_id) : null,
          organization_name: d.organization_name ?? null,
        }))
      : [];

    // client-side filtering
    const filtered = normalized.filter((c) => {
      if (searchSubmittedTerm && searchSubmittedTerm.trim()) {
        const q = searchSubmittedTerm.toLowerCase();
        const match = (c.class_code ?? "").toLowerCase().includes(q) || (c.course_code ?? "").toLowerCase().includes(q) || (c.course_name ?? "").toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.program && filters.program !== "all") {
        const pid = parseInt(String(filters.program), 10);
        if (!isNaN(pid)) {
          if ((c.program_id ?? null) !== pid) return false;
        } else {
          const key = (c.program_name ?? c.course_name ?? "").toLowerCase();
          if (!key.includes(String(filters.program).toLowerCase())) return false;
        }
      }
      if ((filters as any).organization && (filters as any).organization !== "all") {
        const oid = parseInt(String((filters as any).organization), 10);
        if (!isNaN(oid)) {
          if ((c.organization_id ?? null) !== oid) return false;
        } else {
          if (!((c.organization_name ?? "").toLowerCase().includes(String((filters as any).organization).toLowerCase()))) return false;
        }
      }
      if ((filters as any).query && String((filters as any).query).trim()) {
        const q = String((filters as any).query).toLowerCase();
        if (!((c.course_code ?? "").toLowerCase().includes(q) || (c.course_name ?? "").toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q))) return false;
      }
      return true;
    });

    setClasses(filtered);
    return filtered;
  }


  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
        <p className="text-muted-foreground">Manage class sections, schedules, and assignments</p>
      </div>

      <div className="space-y-4">
        <ClassesHeader
          searchValue={searchTerm}
          onSearchChange={(v) => setSearchTerm(v)}
          onSearch={() => setSearchSubmittedTerm(searchTerm.trim())}
          onClearSearch={() => { setSearchTerm(""); setSearchSubmittedTerm(""); }}
          filters={filters}
          onFiltersChange={(f) => setFilters(f)}
          onClearFilters={() => setFilters({})}
          onApplyFilters={() => { /* filters are applied via onFiltersChange; effect will refetch */ }}
          onAdd={() => setCreateOpen(true)}
          visibleColumns={visibleColumns}
          onToggleColumn={(k, v) => setVisibleColumns((s) => ({ ...s, [k]: v }))}
        />

        <ClassesTable
          classes={classes}
          visibleColumns={visibleColumns}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        {/* Create drawer (placeholder) */}
        <>
          {typeof window !== "undefined" ? (
            // lazy client-only import render
            <React.Suspense fallback={null}>
              {/* dynamic import not required; component is client */}
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              <CreateClassDrawer open={createOpen} onClose={() => setCreateOpen(false)} onCreate={onCreateLocal} />
            </React.Suspense>
          ) : null}
        </>
        {/* View drawer (read-only) */}
        <>
          {typeof window !== "undefined" ? (
            <React.Suspense fallback={null}>
              <ViewClassDrawer open={viewOpen} classId={viewClassId ?? undefined} onClose={() => { setViewOpen(false); setViewClassId(null); }} />
            </React.Suspense>
          ) : null}
        </>
        {/* Edit drawer (client-only) */}
        <>
          {typeof window !== "undefined" ? (
            <React.Suspense fallback={null}>
              <EditClassDrawer
                open={editOpen}
                classId={editClassId ?? undefined}
                preload={editPreload ?? undefined}
                onClose={() => { setEditOpen(false); setEditClassId(null); setEditPreload(null); }}
                onUpdate={() => { void refreshClasses(); }}
              />
            </React.Suspense>
          ) : null}
        </>
        {/* Delete confirmation dialog (client-only) */}
        <>
          {typeof window !== "undefined" ? (
            <React.Suspense fallback={null}>
              <DeleteClassDialog open={deleteOpen} classId={deleteClassId ?? undefined} classLabel={deleteClassLabel} onClose={() => { setDeleteOpen(false); setDeleteClassId(null); setDeleteClassLabel(null); }} onDeleted={onDeleted} />
            </React.Suspense>
          ) : null}
        </>
      </div>
    </div>
  );
}

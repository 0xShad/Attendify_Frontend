"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { listOrganizations, listFacultyOptions } from "@/lib/api/profiles";
import { getProgramCodesByOrganization } from "@/lib/api/programs";
import { getCourseOptions } from "@/lib/api/courses";
import { classesAPI } from "@/lib/api/classes";
import type { Class } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate?: (c: Partial<Class>) => void;
};

export default function CreateClassDrawer({ open, onClose, onCreate }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  // Form state (placeholders for dropdowns as requested)
  const [school, setSchool] = React.useState<string | undefined>(undefined);
  const [program, setProgram] = React.useState<string | undefined>(undefined);
  const [course, setCourse] = React.useState<string | undefined>(undefined);
  const [schoolsOptions, setSchoolsOptions] = React.useState<Array<{ id: number; name: string }>>([]);
  const [schoolsLoading, setSchoolsLoading] = React.useState(false);
  const [programOptions, setProgramOptions] = React.useState<Array<{ id: number; code: string; name?: string }>>([]);
  const [programsLoading, setProgramsLoading] = React.useState(false);
  const [programsError, setProgramsError] = React.useState<string | null>(null);
  const [courseOptions, setCourseOptions] = React.useState<Array<{ id: number; code?: string; name?: string }>>([]);
  const [coursesLoading, setCoursesLoading] = React.useState(false);
  const [coursesError, setCoursesError] = React.useState<string | null>(null);
  const [description, setDescription] = React.useState("");
  const [room, setRoom] = React.useState("");
  const [assignedFaculty, setAssignedFaculty] = React.useState<string | undefined>(undefined);
  const [facultyOptions, setFacultyOptions] = React.useState<Array<{ id: number; name: string }>>([]);
  const [facultiesLoading, setFacultiesLoading] = React.useState(false);
  const [facultiesError, setFacultiesError] = React.useState<string | null>(null);
  const [academicYear, setAcademicYear] = React.useState("");
  const [semester, setSemester] = React.useState<string | undefined>(undefined);

  const programDisabled = !school || school === "all" || school === "none" || school === "loading";
  const courseDisabled = !program || program === "all" || program === "none" || program === "loading";
  const facultyDisabled = !school || school === "all" || school === "none" || school === "loading" || facultiesLoading;

  // Form validity: require all fields except description
  const missingFields: string[] = [];
  if (!school) missingFields.push("School");
  if (!program) missingFields.push("Program");
  if (!course) missingFields.push("Course");
  if (!room || !room.trim()) missingFields.push("Room");
  if (!assignedFaculty) missingFields.push("Assigned faculty");
  if (!academicYear || !academicYear.trim()) missingFields.push("Academic year");
  if (!semester) missingFields.push("Semester");
  const canSubmit = missingFields.length === 0;

  // clear dependent selects when parent changes
  React.useEffect(() => {
    setProgram(undefined);
    setCourse(undefined);
  }, [school]);

  // when the drawer is opened for creation, ensure no school (or dependents) is pre-selected
  React.useEffect(() => {
    if (open) {
      setSchool(undefined);
      setProgram(undefined);
      setCourse(undefined);
      setAssignedFaculty(undefined);
    }
    // we only want this to run when `open` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // clear assigned faculty when school changes
  React.useEffect(() => {
    setAssignedFaculty(undefined);
  }, [school]);

  React.useEffect(() => {
    setCourse(undefined);
  }, [program]);

  // load course options when program (and organization) chosen
  React.useEffect(() => {
    let mounted = true;
    setCourseOptions([]);
    setCoursesError(null);
    if (!program) return;
    const params: any = { program_id: Number(program) };
    if (school) {
      const orgId = Number(school);
      if (!Number.isNaN(orgId) && orgId > 0) params.organization_id = orgId;
    }
    setCoursesLoading(true);
    (async () => {
      try {
        const res = await getCourseOptions(params as { program_id?: number; organization_id?: number });
        if (!mounted) return;
        setCourseOptions(Array.isArray(res) ? res : []);
      } catch (err: any) {
        if (!mounted) return;
        console.error("Failed to load course options", err);
        setCoursesError(err instanceof Error ? err.message : String(err));
        setCourseOptions([]);
      } finally {
        if (mounted) setCoursesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [program, school]);

  // load faculty options (scoped to organization if school selected)
  React.useEffect(() => {
    let mounted = true;
    setFacultyOptions([]);
    setFacultiesError(null);
    const paramsOrg = school ? Number(school) : undefined;
    setFacultiesLoading(true);
    (async () => {
      try {
        const res = await listFacultyOptions(paramsOrg);
        if (!mounted) return;
        setFacultyOptions(Array.isArray(res) ? res : []);
      } catch (err: any) {
        if (!mounted) return;
        console.error("Failed to load faculty options", err);
        setFacultiesError(err instanceof Error ? err.message : String(err));
        setFacultyOptions([]);
      } finally {
        if (mounted) setFacultiesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [school]);

  // load program codes when school (organization) is chosen
  React.useEffect(() => {
    let mounted = true;
    setProgramOptions([]);
    setProgramsError(null);
    if (!school) return;
    const orgId = Number(school);
    if (!orgId || Number.isNaN(orgId)) return;
    setProgramsLoading(true);
    (async () => {
      try {
        const res = await getProgramCodesByOrganization(orgId);
        if (!mounted) return;
        setProgramOptions(Array.isArray(res) ? res : []);
      } catch (err: any) {
        if (!mounted) return;
        console.error("Failed to load program codes", err);
        setProgramsError(err instanceof Error ? err.message : String(err));
        setProgramOptions([]);
      } finally {
        if (mounted) setProgramsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [school]);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      // Placeholder behavior: validate minimal fields, then emit created object to parent
      const payload: Partial<Class> = {
        // we only fill fields that make sense for initial creation placeholder
        organization_id: school ? Number(school) : undefined,
        program_id: program ? Number(program) : undefined,
        course_id: course ? Number(course) : undefined,
        description: description || undefined,
        room: room || undefined,
        assigned_faculty_id: assignedFaculty ? Number(assignedFaculty) : undefined,
        academic_year: academicYear || undefined,
        semester: semester || undefined,
      };

  // Call backend create endpoint
  const created = await classesAPI.createClass(payload as any);
  toast({ title: "Created", description: `Created class ${created.id ?? ''}` });
  // forward the created record to parent (may be normalized there)
  onCreate?.(created as Partial<Class>);
  onClose();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Create failed", description: String(err?.message ?? err) });
    } finally {
      setSubmitting(false);
    }
  };

  // load organizations (treated as schools) and filter by type = 'Academic'
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setSchoolsLoading(true);
      try {
        const data = await listOrganizations();
        if (!mounted) return;
        const acad = (Array.isArray(data) ? data : [])
          .filter((o: any) => {
            const t = o?.type ?? null;
            return t && String(t).toLowerCase() === "academic";
          })
          .map((o: any) => ({ id: Number(o.id), name: o.name }));
        setSchoolsOptions(acad);
      } catch (err: any) {
        console.error("Failed to load organizations", err);
        toast({ title: "Failed to load schools", description: String(err?.message ?? err) });
      } finally {
        if (mounted) setSchoolsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Class</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>School</Label>
            <Select onValueChange={(v) => setSchool(v)} value={school}>
              <SelectTrigger>
                <SelectValue placeholder={schoolsLoading ? "Loading schools..." : "Select a school"} />
              </SelectTrigger>
              <SelectContent>
                {schoolsLoading ? (
                  <SelectItem value="loading">Loading...</SelectItem>
                ) : (
                  <>
                    {schoolsOptions.length === 0 ? (
                      <SelectItem value="none">No academic schools found</SelectItem>
                    ) : (
                      schoolsOptions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Program</Label>
            <Select onValueChange={(v) => setProgram(v)} value={program} disabled={programDisabled || programsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={programsLoading ? "Loading programs..." : programDisabled ? "Select a school first" : "Select a program"} />
              </SelectTrigger>
              <SelectContent>
                {programsLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : programOptions.length > 0 ? (
                  programOptions.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.code}{p.name ? ` — ${p.name}` : ''}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>{programDisabled ? "Select a school first" : (programsError ? programsError : "No programs found")}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Course</Label>
            <Select onValueChange={(v) => setCourse(v)} value={course} disabled={courseDisabled || coursesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={coursesLoading ? "Loading courses..." : courseDisabled ? "Select a program first" : "Select a course"} />
              </SelectTrigger>
              <SelectContent>
                {courseDisabled ? (
                  <SelectItem value="disabled" disabled>Select a program first</SelectItem>
                ) : coursesLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : courseOptions.length > 0 ? (
                  courseOptions.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>{c.code ?? c.name ?? `Course ${c.id}`}{c.name ? ` — ${c.name}` : ''}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>{coursesError ? coursesError : "No courses found"}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>

          <div>
            <Label>Room</Label>
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Bldg 1 - Room 101" />
          </div>


          <div>
            <Label>Academic year</Label>
            <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g. 2025-2026" />
          </div>

          <div>
            <Label>Semester</Label>
            <Select onValueChange={(v) => setSemester(v)} value={semester}>
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="S">Summer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Assigned faculty</Label>
            <Select onValueChange={(v) => setAssignedFaculty(v)} value={assignedFaculty} disabled={facultyDisabled}>
              <SelectTrigger>
                <SelectValue placeholder={facultiesLoading ? "Loading faculty..." : (!school ? "Select a school first" : "Select faculty")} />
              </SelectTrigger>
              <SelectContent>
                {facultyDisabled && !facultiesLoading ? (
                  <SelectItem value="disabled" disabled>Select a school first</SelectItem>
                ) : facultiesLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : facultyOptions.length > 0 ? (
                  facultyOptions.map((f) => (
                    <SelectItem key={String(f.id)} value={String(f.id)}>{f.name ?? `Faculty ${f.id}`}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>{facultiesError ? facultiesError : "No faculty found"}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <div className="flex flex-col w-full">
              {/* Missing-fields message intentionally removed per UX request; submit remains disabled until required fields are filled */}
              <div className="flex items-center justify-end gap-2 w-full">
                <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={submitting || !canSubmit}>{submitting ? "Creating…" : "Create class"}</Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
classId?: number | null;
onClose: () => void;
onUpdate?: (c: Partial<Class>) => void;
preload?: {
classDetail?: any;
programOptions?: any[];
courseOptions?: any[];
facultyOptions?: any[];
} | null;
};

export default function EditClassDrawer({ open, classId, onClose, onUpdate, preload }: Props) {
const { toast } = useToast();
const [loading, setLoading] = React.useState(false);
const [submitting, setSubmitting] = React.useState(false);

// form state
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
const [classCode, setClassCode] = React.useState("");
const [assignedFaculty, setAssignedFaculty] = React.useState<string | undefined>(undefined);
const [facultyOptions, setFacultyOptions] = React.useState<Array<{ id: number; name: string }>>([]);
const [facultiesLoading, setFacultiesLoading] = React.useState(false);
const [facultiesError, setFacultiesError] = React.useState<string | null>(null);
const [academicYear, setAcademicYear] = React.useState("");
const [semester, setSemester] = React.useState<string | undefined>(undefined);

// when we programmatically set parent+child selects during load, suppress the
// effect that clears dependent selects. This prevents clearing program/course
// immediately after we set them.
const skipClearRef = React.useRef(false);

const programDisabled = !school || school === "all" || school === "none" || school === "loading";
const courseDisabled = !program || program === "all" || program === "none" || program === "loading";
const facultyDisabled = !school || school === "all" || school === "none" || school === "loading" || facultiesLoading;

// clear dependent selects when parent changes
React.useEffect(() => {
if (skipClearRef.current) return;
setProgram(undefined);
setCourse(undefined);
}, [school]);

React.useEffect(() => {
// if we're programmatically setting values (preload/load), skip clearing
if (skipClearRef.current) return;
setCourse(undefined);
}, [program]);

// clear assigned faculty when school changes
React.useEffect(() => {
// respect suppression when we're programmatically setting values during load
if (skipClearRef.current) return;
setAssignedFaculty(undefined);
}, [school]);

// load organizations (schools)
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

// load program codes when school chosen
React.useEffect(() => {
let mounted = true;
let timer: ReturnType<typeof setTimeout> | null = null;
setProgramOptions([]);
setProgramsError(null);
if (!school) return;
const orgId = Number(school);
if (!orgId || Number.isNaN(orgId)) return;

// use preload if provided for this organization
if (preload && preload.classDetail && Number(preload.classDetail.organization_id) === orgId) {
// defer to avoid mutating selects while open
timer = setTimeout(() => {
if (!mounted) return;
setProgramOptions(Array.isArray(preload.programOptions) ? preload.programOptions : []);
setProgramsLoading(false);
}, 0);
return () => {
mounted = false;
if (timer) clearTimeout(timer);
};
}

setProgramsLoading(true);
(async () => {
try {
const res = await getProgramCodesByOrganization(orgId);
if (!mounted) return;
// defer applying options to avoid mutating mounted SelectContent during commit
timer = setTimeout(() => {
    if (!mounted) return;
    setProgramOptions(Array.isArray(res) ? res : []);
}, 0);
                // programOptions fetched
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
if (timer) clearTimeout(timer);
};
}, [school, preload]);

// load courses when program (and organization) chosen
React.useEffect(() => {
let mounted = true;
let timer: ReturnType<typeof setTimeout> | null = null;
setCourseOptions([]);
setCoursesError(null);
if (!program) return;
const params: any = { program_id: Number(program) };
if (school) {
const orgId = Number(school);
if (!Number.isNaN(orgId) && orgId > 0) params.organization_id = orgId;
}

// use preload if provided for this program
if (preload && preload.classDetail && Number(preload.classDetail.program_id) === Number(program)) {
timer = setTimeout(() => {
if (!mounted) return;
setCourseOptions(Array.isArray(preload.courseOptions) ? preload.courseOptions : []);
setCoursesLoading(false);
}, 0);
return () => {
mounted = false;
if (timer) clearTimeout(timer);
};
}

setCoursesLoading(true);
(async () => {
try {
const res = await getCourseOptions(params as { program_id?: number; organization_id?: number });
if (!mounted) return;
timer = setTimeout(() => {
    if (!mounted) return;
    setCourseOptions(Array.isArray(res) ? res : []);
}, 0);
                // courseOptions fetched
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
if (timer) clearTimeout(timer);
};
}, [program, school, preload]);

// load faculty options (scoped to organization if school selected)
React.useEffect(() => {
let mounted = true;
let timer: ReturnType<typeof setTimeout> | null = null;
setFacultyOptions([]);
setFacultiesError(null);
const paramsOrg = school ? Number(school) : undefined;

// use preload if provided for this organization
if (preload && preload.classDetail && Number(preload.classDetail.organization_id) === paramsOrg) {
timer = setTimeout(() => {
if (!mounted) return;
setFacultyOptions(Array.isArray(preload.facultyOptions) ? preload.facultyOptions : []);
setFacultiesLoading(false);
}, 0);
return () => {
mounted = false;
if (timer) clearTimeout(timer);
};
}

setFacultiesLoading(true);
(async () => {
try {
const res = await listFacultyOptions(paramsOrg);
if (!mounted) return;
timer = setTimeout(() => {
    if (!mounted) return;
    setFacultyOptions(Array.isArray(res) ? res : []);
}, 0);
                // facultyOptions fetched
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
if (timer) clearTimeout(timer);
};
}, [school, preload]);

// load class detail when opened
React.useEffect(() => {
let mounted = true;
const timers: Array<ReturnType<typeof setTimeout>> = [];
if (!open || !classId) {
// reset form when not open
setLoading(false);
setDescription("");
setRoom("");
setAcademicYear("");
setSemester(undefined);
setSchool(undefined);
setProgram(undefined);
setCourse(undefined);
setAssignedFaculty(undefined);
setClassCode("");
return () => {
mounted = false;
};
}

// If preload is provided and matches this class, use it to populate immediately
if (preload && preload.classDetail && Number(preload.classDetail.id) === Number(classId)) {
const d = preload.classDetail;
const orgId = d.organization_id != null ? Number(d.organization_id) : undefined;
const progId = d.program_id != null ? Number(d.program_id) : undefined;
const courseId = d.course_id != null ? Number(d.course_id) : undefined;

// apply preloaded option arrays first so the Select can resolve the selected value
skipClearRef.current = true;
if (preload.programOptions) timers.push(setTimeout(() => { if (mounted) setProgramOptions(Array.isArray(preload.programOptions) ? preload.programOptions : []); }, 0));
if (preload.courseOptions) timers.push(setTimeout(() => { if (mounted) setCourseOptions(Array.isArray(preload.courseOptions) ? preload.courseOptions : []); }, 0));
if (preload.facultyOptions) timers.push(setTimeout(() => { if (mounted) setFacultyOptions(Array.isArray(preload.facultyOptions) ? preload.facultyOptions : []); }, 0));

            // preload applied (no-op log removed)

// now set selected values
setSchool(orgId != null ? String(orgId) : undefined);
setProgram(progId != null ? String(progId) : undefined);
setCourse(courseId != null ? String(courseId) : undefined);
setDescription(d.description ?? "");
setRoom(d.room ?? "");
setAssignedFaculty(d.assigned_faculty_id != null ? String(d.assigned_faculty_id) : (d.assigned_faculty?.id != null ? String(d.assigned_faculty.id) : undefined));
setAcademicYear(d.academic_year ?? "");
setSemester(d.semester ?? undefined);
setClassCode(d.class_code ?? "");
            // applied preload -> selected values set
// allow the school-change clearing effect to run again after the microtask
timers.push(setTimeout(() => {
skipClearRef.current = false;
}, 0));
return () => {
mounted = false;
timers.forEach((t) => clearTimeout(t));
};
}

setLoading(true);
(async () => {
try {
const d = await classesAPI.getClass(Number(classId));
if (!mounted) return;
// normalize and set form fields
const orgId = d.organization_id != null ? Number(d.organization_id) : undefined;
const progId = d.program_id != null ? Number(d.program_id) : undefined;
const courseId = d.course_id != null ? Number(d.course_id) : undefined;

// apply selected values first (we'll eagerly fetch option lists below)
skipClearRef.current = true;
setSchool(orgId != null ? String(orgId) : undefined);
setProgram(progId != null ? String(progId) : undefined);
setCourse(courseId != null ? String(courseId) : undefined);
// release the suppression in the next tick so dependent-clear won't wipe our values
setTimeout(() => { skipClearRef.current = false; }, 0);
setDescription(d.description ?? "");
setRoom(d.room ?? "");
setAssignedFaculty(d.assigned_faculty_id != null ? String(d.assigned_faculty_id) : (d.assigned_faculty?.id != null ? String(d.assigned_faculty.id) : undefined));
setAcademicYear(d.academic_year ?? "");
setSemester(d.semester ?? undefined);
setClassCode(d.class_code ?? "");

// eagerly load program options, course options and faculty options scoped to organization/program
if (orgId != null) {
    try {
    setProgramsLoading(true);
    const progs = await getProgramCodesByOrganization(orgId);
    if (mounted) timers.push(setTimeout(() => { if (mounted) setProgramOptions(Array.isArray(progs) ? progs : []); }, 0));
    } catch (err: any) {
    console.error("Failed to load program codes for edit", err);
    if (mounted) timers.push(setTimeout(() => { if (mounted) setProgramOptions([]); }, 0));
    } finally {
    if (mounted) setProgramsLoading(false);
    }

    try {
    setFacultiesLoading(true);
    const facs = await listFacultyOptions(orgId);
    if (mounted) timers.push(setTimeout(() => { if (mounted) setFacultyOptions(Array.isArray(facs) ? facs : []); }, 0));
    } catch (err: any) {
    console.error("Failed to load faculty options for edit", err);
    if (mounted) timers.push(setTimeout(() => { if (mounted) setFacultyOptions([]); }, 0));
    } finally {
    if (mounted) setFacultiesLoading(false);
    }
}

if (progId != null) {
    try {
    setCoursesLoading(true);
    const courses = await getCourseOptions({ program_id: progId, organization_id: orgId });
    if (mounted) timers.push(setTimeout(() => { if (mounted) setCourseOptions(Array.isArray(courses) ? courses : []); }, 0));
    } catch (err: any) {
    console.error("Failed to load course options for edit", err);
    if (mounted) timers.push(setTimeout(() => { if (mounted) setCourseOptions([]); }, 0));
    } finally {
    if (mounted) setCoursesLoading(false);
    }
}
} catch (err) {
console.error("Failed to load class", err);
toast({ title: "Failed to load class", description: String((err as any)?.message ?? err) });
} finally {
if (mounted) setLoading(false);
}
})();

return () => {
mounted = false;
timers.forEach((t) => clearTimeout(t));
};
}, [open, classId, preload, toast]);

    // programOptions/program state watcher removed (debug only)

// form validity: require same fields as create (except description optional)
const missingFields: string[] = [];
if (!school) missingFields.push("School");
if (!program) missingFields.push("Program");
if (!course) missingFields.push("Course");
if (!room || !room.trim()) missingFields.push("Room");
if (!assignedFaculty) missingFields.push("Assigned faculty");
if (!academicYear || !academicYear.trim()) missingFields.push("Academic year");
if (!semester) missingFields.push("Semester");
const canSubmit = missingFields.length === 0;

const onSubmit = async (e?: React.FormEvent) => {
e?.preventDefault();
if (!classId) return;
setSubmitting(true);
try {
const payload: Partial<Class> = {
organization_id: school ? Number(school) : undefined,
program_id: program ? Number(program) : undefined,
course_id: course ? Number(course) : undefined,
description: description || undefined,
room: room || undefined,
assigned_faculty_id: assignedFaculty ? Number(assignedFaculty) : undefined,
academic_year: academicYear || undefined,
semester: semester || undefined,
};
const updated = await classesAPI.updateClass(Number(classId), payload as any);
toast({ title: "Updated", description: `Updated class ${updated.id ?? ''}` });
onUpdate?.(updated as Partial<Class>);
onClose();
} catch (err: any) {
console.error("Update failed", err);
toast({ title: "Update failed", description: String(err?.message ?? err) });
} finally {
setSubmitting(false);
}
};

// derive display labels so SelectValue can show the selected label even when SelectContent items
// are not mounted (some Select implementations only mount items when opened).
const programLabel = React.useMemo(() => {
if (!program) return undefined;
const p = programOptions.find((x) => String(x.id) === String(program));
if (!p) return undefined;
return `${p.code}${p.name ? ` — ${p.name}` : ""}`;
}, [programOptions, program]);

    // Fallback label sources from preload/classDetail when SelectOptions are not present
    const programLabelFallback = React.useMemo(() => {
        if (!program) return undefined;
        const d = preload?.classDetail as any | undefined;
        if (!d) return undefined;
        const code = d.program_code ?? d.program_code_text ?? d.program_code_raw ?? undefined;
        const name = d.program_name ?? d.program_title ?? undefined;
        if (!code && !name) return undefined;
        return `${code ?? ""}${name ? ` — ${name}` : ""}`;
    }, [preload, program]);

const courseLabel = React.useMemo(() => {
if (!course) return undefined;
const c = courseOptions.find((x) => String(x.id) === String(course));
if (!c) return undefined;
return `${c.code ?? c.name ?? `Course ${c.id}`}${c.name ? ` — ${c.name}` : ""}`;
}, [courseOptions, course]);

    const courseLabelFallback = React.useMemo(() => {
        if (!course) return undefined;
        const d = preload?.classDetail as any | undefined;
        if (!d) return undefined;
        const code = d.course_code ?? d.course_code_text ?? undefined;
        const name = d.course_name ?? d.course_title ?? undefined;
        if (!code && !name) return undefined;
        return `${code ?? name ?? `Course ${d.course_id ?? ''}`}${name ? ` — ${name}` : ""}`;
    }, [preload, course]);

const facultyLabel = React.useMemo(() => {
if (!assignedFaculty) return undefined;
const f = facultyOptions.find((x) => String(x.id) === String(assignedFaculty));
return f ? (f.name ?? `Faculty ${f.id}`) : undefined;
}, [facultyOptions, assignedFaculty]);

    const facultyLabelFallback = React.useMemo(() => {
        if (!assignedFaculty) return undefined;
        const d = preload?.classDetail as any | undefined;
        if (!d) return undefined;
        // try assigned_faculty name on classDetail
        const af = d.assigned_faculty ?? d.assigned_faculty_name ?? undefined;
        if (!af) return undefined;
        return typeof af === "string" ? af : (af.name ?? `Faculty ${af.id ?? ''}`);
    }, [preload, assignedFaculty]);

return (
<Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
<DialogContent className="sm:max-w-xl">
<DialogHeader>
    <DialogTitle>Edit Class</DialogTitle>
</DialogHeader>

<form onSubmit={onSubmit} className="space-y-4">
    {loading ? (
    <div>Loading…</div>
    ) : (
    <>
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
                                    {program && !programLabel && programLabelFallback ? (
                                        <span className="ml-2 text-sm text-muted-foreground truncate">{programLabelFallback}</span>
                                    ) : null}
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
            {course && !courseLabel && courseLabelFallback ? (
                <span className="ml-2 text-sm text-muted-foreground truncate">{courseLabelFallback}</span>
            ) : null}
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
        <Label>Class code</Label>
        <Input readOnly value={classCode} />
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
            {assignedFaculty && !facultyLabel && facultyLabelFallback ? (
                <span className="ml-2 text-sm text-muted-foreground truncate">{facultyLabelFallback}</span>
            ) : null}
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
    </>
    )}

    <DialogFooter>
    <div className="flex flex-col w-full">
        <div className="flex items-center justify-end gap-2 w-full">
        <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting || !canSubmit}>{submitting ? "Updating…" : "Update class"}</Button>
        </div>
    </div>
    </DialogFooter>
</form>
</DialogContent>
</Dialog>
);
}

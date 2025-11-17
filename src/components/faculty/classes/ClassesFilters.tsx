"use client";

import React, { useEffect, useState } from "react";
import { IconFilter } from "@tabler/icons-react";
import { programsAPI } from "@/lib/api/programs";
import { coursesAPI } from "@/lib/api/courses";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import type { ClassesFilterValues } from "@/components/classes/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ClassesFilterValues | any;
  onFiltersChange: (f: ClassesFilterValues | any) => void;
  onClearFilters: () => void;
  onApplyFilters: (f: ClassesFilterValues | any) => void;
}

export function ClassesFilters({ open, onOpenChange, filters, onFiltersChange, onClearFilters, onApplyFilters }: Props) {
  const [programOptions, setProgramOptions] = useState<Array<{ id: number; code?: string; name?: string }>>([]);
  // full unfiltered course list (includes program_id) and displayed (scoped) list
  const [fullCourseOptions, setFullCourseOptions] = useState<Array<{ id: number; code?: string; name?: string; program_id?: number | null }>>([]);
  const [courseOptions, setCourseOptions] = useState<Array<{ id: number; code?: string; name?: string; program_id?: number | null }>>([]);
  const [localFilters, setLocalFilters] = useState<ClassesFilterValues | any>(() => ({ ...filters }));
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setLocalFilters({ ...filters });
    let mounted = true;

    programsAPI
      .getMyProgramOptions()
      .then((data: any) => {
        if (!mounted) return;
        if (!Array.isArray(data)) return setProgramOptions([]);
        const normalized = data.map((d: any, i: number) => ({ id: Number(d.id ?? i), code: d.code ?? String(d), name: d.name ?? d.code ?? String(d) }));
        setProgramOptions(normalized);
      })
      .catch((err) => console.error("Failed to load program codes", err));

    // Load top-level course options (unscoped) and program codes
    coursesAPI
      .getCourseOptions()
      .then((data: any) => {
        if (!mounted) return;
        const normalized = Array.isArray(data)
          ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name, program_id: d.program_id ?? null }))
          : [];
        setFullCourseOptions(normalized);
        setCourseOptions(normalized);
      })
      .catch((err) => console.error("Failed to load course options", err));

    try {
      const progId = filters.program ? parseInt(String(filters.program), 10) : undefined;
      if (progId && !isNaN(progId) && mounted) {
        // scope locally if we already have fullCourseOptions
        // otherwise the initial fetch above will set courseOptions
        setCourseOptions((prev) => fullCourseOptions.filter((c) => Number(c.program_id) === Number(progId)));
      }
    } catch (err) {
      console.error("Error initializing scoped filters on open", err);
    }

    // Additionally, fetch a sample of classes to derive academic year and semester options
    try {
      void (async () => {
        try {
          const cls = await import("@/lib/api/classes").then(m => m.classesAPI.listMyClasses({ limit: 200 }));
          if (!mounted || !Array.isArray(cls)) return;
          const years = new Set<string>();
          const sems = new Set<string>();
          cls.forEach((it: any) => {
            if (it?.academic_year) years.add(String(it.academic_year));
            if (it?.semester) sems.add(String(it.semester));
          });
          setYearOptions(Array.from(years).sort());
          setSemesterOptions(Array.from(sems).sort());
        } catch (e) {
          // ignore
        }
      })();
    } catch (err) {
      // ignore
    }

    return () => {
      mounted = false;
    };
  }, [open]);

  // No organization scoping required; backend does not need organization_id from UI

  useEffect(() => {
    // scope courses locally based on selected program OR the programs the user belongs to
    if (!fullCourseOptions || fullCourseOptions.length === 0) return;

    const selectedPid = localFilters.program ? parseInt(String(localFilters.program), 10) : undefined;

    // build list of allowed program ids: selected program if present, otherwise all programs returned for the user
    const userProgramIds = Array.isArray(programOptions) ? programOptions.map((p) => Number(p.id)) : [];
    let allowedProgramIds: number[] = [];
    if (selectedPid && !isNaN(selectedPid)) {
      allowedProgramIds = [selectedPid];
    } else if (userProgramIds.length > 0) {
      allowedProgramIds = userProgramIds;
    }

    if (allowedProgramIds.length === 0) {
      // no selected program and user has no programs — show no courses
      setCourseOptions([]);
      return;
    }

    setCourseOptions(fullCourseOptions.filter((c) => allowedProgramIds.includes(Number(c.program_id))));
  }, [localFilters.program, fullCourseOptions, programOptions]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm"><IconFilter className="h-4 w-4 mr-2" />Filter</Button>
      </DrawerTrigger>
      <DrawerContent className="px-6 pb-6">
        <DrawerHeader className="px-0">
          <DrawerTitle>Filter Classes</DrawerTitle>
          <DrawerDescription>Filter classes by program, school or course</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Organization filter removed — backend does not require organization_id from UI */}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Program</Label>
            <Select value={localFilters.program ?? "all"} onValueChange={(v) => setLocalFilters((prev: any) => ({ ...prev, program: v === "all" ? undefined : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programOptions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{(p.code ? `${p.code} - ` : '') + (p.name ?? p.code ?? '')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Course (code or name)</Label>
            <Select value={(localFilters as any).course_option ?? "all"} onValueChange={(v) => {
              if (v === "all") {
                setLocalFilters((prev: any) => ({ ...prev, course_option: undefined, query: undefined }));
              } else {
                const found = courseOptions.find((c) => String(c.id) === String(v));
                setLocalFilters((prev: any) => ({ ...prev, course_option: String(v), query: found?.code ?? found?.name ?? undefined }));
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courseOptions.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.code ? `${c.code} - ${c.name ?? c.code}` : c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Academic Year</Label>
            <Select value={localFilters.academic_year ?? "all"} onValueChange={(v) => setLocalFilters((prev: any) => ({ ...prev, academic_year: v === "all" ? undefined : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Semester</Label>
            <Select value={localFilters.semester ?? "all"} onValueChange={(v) => setLocalFilters((prev: any) => ({ ...prev, semester: v === "all" ? undefined : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {/* prefer server-derived semester options if available, otherwise fall back */}
                {(semesterOptions && semesterOptions.length > 0 ? semesterOptions : ["1", "2", "S"]).map((s) => (
                  <SelectItem key={s} value={String(s)}>{String(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room filter removed — not supported by this endpoint */}

          {/* Instructor filter removed — backend does not support filtering by instructor here */}

        </div>
        <DrawerFooter className="px-0 pt-4">
          <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
            <Button variant="outline" className="flex-1" onClick={() => { setLocalFilters({}); onClearFilters(); }}>Clear Filters</Button>
            <DrawerClose asChild>
              <Button className="flex-1" onClick={() => { const payload = { ...localFilters }; onFiltersChange(payload); onApplyFilters(payload); }}>Apply Filters</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default ClassesFilters;

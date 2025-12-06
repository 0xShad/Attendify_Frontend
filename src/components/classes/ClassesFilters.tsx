"use client";

import React, { useEffect, useState } from "react";
import { IconFilter } from "@tabler/icons-react";
import { programsAPI } from "@/lib/api/programs";
import { coursesAPI } from "@/lib/api/courses";
import { listFacultyOptions } from "@/lib/api/profiles";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import type { ClassesFilterValues } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ClassesFilterValues;
  onFiltersChange: (f: ClassesFilterValues) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

export function ClassesFilters({ open, onOpenChange, filters, onFiltersChange, onClearFilters, onApplyFilters }: Props) {
  const [organizations, setOrganizations] = useState<Array<{ id: number; name: string }>>([]);
  const [programOptions, setProgramOptions] = useState<Array<{ id: number; code?: string; name?: string }>>([]);
  const [courseOptions, setCourseOptions] = useState<Array<{ id: number; code?: string; name?: string }>>([]);
  const [facultyOptions, setFacultyOptions] = useState<Array<{ id: number; name?: string }>>([]);
  const [localFilters, setLocalFilters] = useState<ClassesFilterValues>(() => ({ ...filters }));

  // initialize when drawer opens
  useEffect(() => {
    if (!open) return;
    setLocalFilters({ ...filters });
    let mounted = true;

    programsAPI
      .getOrganizationOptions()
      .then((data: any) => {
        if (!mounted) return;
        const normalized = Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), name: d.name })) : [];
        // filter to Academic organizations only if `type` exists
        setOrganizations(normalized);
      })
      .catch((err) => console.error("Failed to load organizations for class filters", err));

    // load global program codes (optional)
    programsAPI
      .getProgramCodes()
      .then((data: any) => {
        if (!mounted) return;
        if (!Array.isArray(data)) return setProgramOptions([]);
        const normalized = data.map((d: any, i: number) => {
          if (typeof d === "string") return { id: i, code: String(d), name: String(d) };
          return { id: Number(d.id ?? i), code: d.code ?? String(d), name: d.name ?? d.code ?? String(d) };
        });
        setProgramOptions(normalized);
      })
      .catch((err) => console.error("Failed to load program codes", err));

    // initial course options
    coursesAPI
      .getCourseOptions()
      .then((data: any) => {
        if (!mounted) return;
        setCourseOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name })) : []);
      })
      .catch((err) => console.error("Failed to load course options", err));

    // initial faculty options (unscoped)
    listFacultyOptions()
      .then((data: any) => {
        if (!mounted) return;
        setFacultyOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), name: d.name })) : []);
      })
      .catch((err) => console.error("Failed to load faculty options", err));

    // If filters already include organization or program (reopening with selections),
    // fetch scoped option lists so children selects are populated when drawer opens.
    try {
      const orgId = filters.organization ? parseInt(String(filters.organization), 10) : undefined;
      const progId = filters.program ? parseInt(String(filters.program), 10) : undefined;

      if (orgId && !isNaN(orgId)) {
        programsAPI
          .getProgramCodesByOrganization(orgId)
          .then((data: any) => {
            if (!mounted) return;
            setProgramOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name })) : []);
          })
          .catch((err) => console.error("Failed to load program codes for organization (on open)", err));

        coursesAPI
          .getCourseOptions({ organization_id: orgId })
          .then((data: any) => {
            if (!mounted) return;
            setCourseOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name })) : []);
          })
          .catch((err) => console.error("Failed to load course options for organization (on open)", err));

        listFacultyOptions(orgId)
          .then((data: any) => {
            if (!mounted) return;
            setFacultyOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), name: d.name })) : []);
          })
          .catch((err) => console.error("Failed to load faculty options for organization (on open)", err));
      }

      if (progId && !isNaN(progId)) {
        const params: any = { program_id: progId };
        if (orgId && !isNaN(orgId)) params.organization_id = orgId;
        coursesAPI
          .getCourseOptions(params)
          .then((data: any) => {
            if (!mounted) return;
            setCourseOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name })) : []);
          })
          .catch((err) => console.error("Failed to load course options for program (on open)", err));
      }
    } catch (err) {
      console.error("Error initializing scoped filters on open", err);
    }

    return () => {
      mounted = false;
    };
  }, [open]);

  // When organization changes in drawer, fetch program codes for that org and refresh course options
  useEffect(() => {
    if (!localFilters.organization) return;
    let mounted = true;
    const orgId = parseInt(String(localFilters.organization), 10);
    if (isNaN(orgId)) return;

    programsAPI
      .getProgramCodesByOrganization(orgId)
      .then((data: any) => {
        if (!mounted) return;
        setProgramOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name })) : []);
      })
      .catch((err) => console.error("Failed to load program codes for organization", err));

    coursesAPI
      .getCourseOptions({ organization_id: orgId })
      .then((data: any) => {
        if (!mounted) return;
        setCourseOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name })) : []);
      })
      .catch((err) => console.error("Failed to load course options for organization", err));

    // load faculty scoped to organization
    listFacultyOptions(orgId)
      .then((data: any) => {
        if (!mounted) return;
        setFacultyOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), name: d.name })) : []);
      })
      .catch((err) => console.error("Failed to load faculty options for organization", err));

    return () => {
      mounted = false;
    };
  }, [localFilters.organization]);

  // When program selection changes, fetch course options for program (and organization if present)
  useEffect(() => {
    if (!localFilters.program && !localFilters.organization) return;
    let mounted = true;
    const params: any = {};
    if (localFilters.program) {
      const pid = parseInt(String(localFilters.program), 10);
      if (!isNaN(pid)) params.program_id = pid;
    }
    if (localFilters.organization) {
      const oid = parseInt(String(localFilters.organization), 10);
      if (!isNaN(oid)) params.organization_id = oid;
    }
    coursesAPI
      .getCourseOptions(params)
      .then((data: any) => {
        if (!mounted) return;
        setCourseOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name })) : []);
      })
      .catch((err) => console.error("Failed to load course options for program", err));

    // If program changed, also refresh faculty list scoped to organization (if any)
    if (localFilters.organization) {
      const orgId = parseInt(String(localFilters.organization), 10);
      if (!isNaN(orgId)) {
        listFacultyOptions(orgId)
          .then((data: any) => {
            if (!mounted) return;
            setFacultyOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), name: d.name })) : []);
          })
          .catch((err) => console.error("Failed to load faculty options for program change", err));
      }
    }

    return () => {
      mounted = false;
    };
  }, [localFilters.program, localFilters.organization]);

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
          <div className="space-y-2">
            <Label className="text-sm font-medium">Organization</Label>
            <Select value={localFilters.organization ?? "all"} onValueChange={(v) => setLocalFilters((prev) => ({ ...prev, organization: v === "all" ? undefined : v, program: undefined }))}>
              <SelectTrigger>
                <SelectValue placeholder="All organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All organizations</SelectItem>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Program</Label>
            <Select value={localFilters.program ?? "all"} onValueChange={(v) => setLocalFilters((prev) => ({ ...prev, program: v === "all" ? undefined : v }))}>
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
                setLocalFilters((prev) => ({ ...prev, course_option: undefined, query: undefined }));
              } else {
                const found = courseOptions.find((c) => String(c.id) === String(v));
                setLocalFilters((prev) => ({ ...prev, course_option: String(v), query: found?.code ?? found?.name ?? undefined }));
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
            <Input value={localFilters.academic_year ?? ""} onChange={(e) => setLocalFilters((prev) => ({ ...prev, academic_year: e.target.value || undefined }))} placeholder="e.g. 2025-2026" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Semester</Label>
            <Select value={localFilters.semester ?? "all"} onValueChange={(v) => setLocalFilters((prev) => ({ ...prev, semester: v === "all" ? undefined : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="S">Summer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Room</Label>
            <Input value={localFilters.room ?? ""} onChange={(e) => setLocalFilters((prev) => ({ ...prev, room: e.target.value || undefined }))} placeholder="e.g. B201" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Instructor</Label>
            <Select value={localFilters.instructor ?? "all"} onValueChange={(v) => setLocalFilters((prev) => ({ ...prev, instructor: v === "all" ? undefined : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {facultyOptions.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.name ?? `Faculty ${f.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Query removed: use the main SearchBar for free-text searches */}
        </div>
        <DrawerFooter className="px-0 pt-4">
          <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
            <Button variant="outline" className="flex-1" onClick={() => { setLocalFilters({}); onClearFilters(); }}>Clear Filters</Button>
            <DrawerClose asChild>
              <Button className="flex-1" onClick={() => { onFiltersChange({ ...localFilters }); onApplyFilters(); }}>Apply Filters</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default ClassesFilters;

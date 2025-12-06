"use client";

import React, { useEffect, useState } from "react";
import { programsAPI } from "@/lib/api/programs";
import { coursesAPI } from "@/lib/api/courses";
import { IconFilter } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export interface CoursesFilterValues {
  query?: string;
  program?: string; // program id as string or undefined
  school?: string; // organization id as string or undefined
  course_option?: string; // selected course option id as string
  min_classes?: string;
  max_classes?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: CoursesFilterValues;
  onFiltersChange: (filters: CoursesFilterValues) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  programs: import("./types").ProgramOption[];
}

export function CoursesFilters({ open, onOpenChange, filters, onFiltersChange, onClearFilters, onApplyFilters, programs }: Props) {
  const [organizations, setOrganizations] = useState<Array<{ id: number; name: string }>>([]);
  const [programOptions, setProgramOptions] = useState<Array<{ id: number; code?: string; name?: string }>>([]);
  const [courseOptions, setCourseOptions] = useState<Array<{ id: number; code?: string; name?: string }>>([]);
  // Local copy of filters so changes are staged until user clicks Apply
  const [localFilters, setLocalFilters] = useState<CoursesFilterValues>(() => ({ ...filters }));

  // Load organizations (Academic only) when drawer opens
  useEffect(() => {
    if (!open) return;
    // initialize local filters from parent when drawer opens
    setLocalFilters({ ...filters });
    let mounted = true;
    programsAPI
      .getOrganizationOptions()
      .then((data: any) => {
        if (!mounted) return;
        // data is expected to be [{id, name, type}, ...]
        const normalized = Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), name: d.name })) : [];
        setOrganizations(normalized);
      })
      .catch((err) => {
        console.error("Failed to load organizations for filters", err);
      });

    // also load global program codes if not already loaded
    programsAPI
      .getProgramCodes()
      .then((data: any) => {
        if (!mounted) return;
        if (!Array.isArray(data)) return setProgramOptions([]);
        // data may be array of strings or array of objects {id, code, name}
        const normalized = data.map((d: any, i: number) => {
          if (typeof d === 'string') return { id: i, code: String(d), name: String(d) };
          return { id: Number(d.id ?? i), code: d.code ?? String(d), name: d.name ?? d.code ?? String(d) };
        });
        setProgramOptions(normalized);
      })
      .catch((err) => console.error("Failed to load program codes", err));

    // initial course options (no filters)
    coursesAPI
      .getCourseOptions()
      .then((data: any) => {
        if (!mounted) return;
        const normalized = Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name })) : [];
        setCourseOptions(normalized);
      })
      .catch((err) => console.error("Failed to load course options", err));

    return () => {
      mounted = false;
    };
  }, [open]);

    // When school selection changes, fetch program codes for that org and refresh course options
  useEffect(() => {
    if (!localFilters.school) return;
    let mounted = true;
    const orgId = parseInt(localFilters.school, 10);
    if (isNaN(orgId)) return;
    programsAPI
      .getProgramCodesByOrganization(orgId)
      .then((data: any) => {
        if (!mounted) return;
        setProgramOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name })) : []);
      })
      .catch((err) => console.error("Failed to load program codes for organization", err));

    // refresh course options scoped to the organization
    coursesAPI
      .getCourseOptions({ organization_id: orgId })
      .then((data: any) => {
        if (!mounted) return;
        setCourseOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name })) : []);
      })
      .catch((err) => console.error("Failed to load course options for organization", err));

    return () => {
      mounted = false;
    };
  }, [filters.school]);

  // When program selection changes, fetch course options for program (and organization if present)
  useEffect(() => {
    if (!localFilters.program && !localFilters.school) return;
    let mounted = true;
    const params: any = {};
    if (localFilters.program) {
      const pid = parseInt(localFilters.program, 10);
      if (!isNaN(pid)) params.program_id = pid;
    }
    if (localFilters.school) {
      const oid = parseInt(localFilters.school, 10);
      if (!isNaN(oid)) params.organization_id = oid;
    }
    coursesAPI
      .getCourseOptions(params)
      .then((data: any) => {
        if (!mounted) return;
        setCourseOptions(Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), code: d.code, name: d.name })) : []);
      })
      .catch((err) => console.error("Failed to load course options for program", err));

    return () => {
      mounted = false;
    };
  }, [localFilters.program, localFilters.school]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <IconFilter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-6 pb-6">
        <DrawerHeader className="px-0">
          <DrawerTitle>Filter Courses</DrawerTitle>
          <DrawerDescription>Filter courses by status and program</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-sm font-medium">School (Organization)</Label>
            <Select value={localFilters.school ?? "all"} onValueChange={(v) => setLocalFilters((prev) => ({ ...prev, school: v === "all" ? undefined : v, program: undefined, course_option: undefined }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Program</Label>
            <Select value={localFilters.program ?? "all"} onValueChange={(v) => setLocalFilters((prev) => ({ ...prev, program: v === "all" ? undefined : v, course_option: undefined }))}>
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
            <Select value={localFilters.course_option ?? "all"} onValueChange={(v) => {
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Min classes</Label>
              <Input type="number" value={localFilters.min_classes ?? ""} onChange={(e) => setLocalFilters((prev) => ({ ...prev, min_classes: e.target.value || undefined }))} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max classes</Label>
              <Input type="number" value={localFilters.max_classes ?? ""} onChange={(e) => setLocalFilters((prev) => ({ ...prev, max_classes: e.target.value || undefined }))} placeholder="10" />
            </div>
          </div>
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

export default CoursesFilters;

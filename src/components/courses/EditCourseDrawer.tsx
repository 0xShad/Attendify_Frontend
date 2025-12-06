"use client";

import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { programsAPI } from "@/lib/api/programs";
import { Textarea } from "@/components/ui/textarea";
import type { CourseFormData, ProgramOption, SchoolOption } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CourseFormData;
  setFormData: (d: CourseFormData) => void;
  onSave: () => void;
  programs: ProgramOption[];
  schools?: SchoolOption[];
}

export default function EditCourseDrawer({ open, onOpenChange, formData, setFormData, onSave, programs, schools }: Props) {
  const availablePrograms = (programs ?? []).filter((p) => {
    if (!formData?.school_id) return true;
    return p.organization_id === formData.school_id || (p as any).school_id === formData.school_id;
  });
  const [schoolPrograms, setSchoolPrograms] = useState<Array<{ id: number; code: string; name?: string }>>([]);
  const [loadingSchoolPrograms, setLoadingSchoolPrograms] = useState(false);

  // Ensure the Select has an option for the current formData.school_id even if it's not in `schools` yet.
  const mergedSchools = React.useMemo(() => {
    const base = (schools ?? []) as Array<SchoolOption>;
    if (formData?.school_id) {
      const id = Number(formData.school_id);
      const exists = base.some((s) => s.id === id);
      if (!exists) {
        return [{ id, name: formData.school_name ?? `Organization ${id}` }, ...base];
      }
    }
    return base;
  }, [schools, formData?.school_id, formData?.school_name]);

  useEffect(() => {
    let mounted = true;
    if (!formData?.school_id) {
      setSchoolPrograms([]);
      return;
    }
    setLoadingSchoolPrograms(true);
    programsAPI.getProgramCodesByOrganization(formData.school_id as number)
      .then((data) => {
        if (!mounted) return;
        setSchoolPrograms(data ?? []);
      })
      .catch((err) => {
        console.error("Failed to load programs for school", err);
        setSchoolPrograms([]);
      })
      .finally(() => { if (mounted) setLoadingSchoolPrograms(false); });
    return () => { mounted = false; };
  }, [formData?.school_id]);
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-6 pb-6 max-h-[90vh]">
        <DrawerHeader className="px-0">
          <DrawerTitle>Edit Course</DrawerTitle>
          <DrawerDescription>Update course information and details</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-course-code">Course Code</Label>
              <Input id="edit-course-code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g., CS101" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-school">School</Label>
              <Select value={formData.school_id ? String(formData.school_id) : ""} onValueChange={(v) => {
                const id = parseInt(v, 10);
                const found = (schools ?? []).find((s) => s.id === id);
                setFormData({ ...formData, school_id: isNaN(id) ? undefined : id, school_name: found ? found.name : undefined, program_id: undefined, program_name: undefined });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {mergedSchools.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-program">Program</Label>
            <Select value={formData.program_id ? String(formData.program_id) : ""} onValueChange={(v) => {
              const id = parseInt(v, 10);
              const foundInSchool = schoolPrograms.find((p) => p.id === id);
              const found = foundInSchool ?? (programs ?? []).find((p) => p.id === id);
              setFormData({ ...formData, program_id: isNaN(id) ? undefined : id, program_name: found ? (found as any).name ?? (found as any).code : undefined });
            }} disabled={!formData?.school_id || loadingSchoolPrograms}>
              <SelectTrigger>
                <SelectValue placeholder={formData?.school_id ? (loadingSchoolPrograms ? "Loading programs..." : "Select program") : "Select a school first"} />
              </SelectTrigger>
              <SelectContent>
                {schoolPrograms.length > 0 ? (
                  schoolPrograms.map((p) => <SelectItem key={p.id} value={String(p.id)}>{`${p.code} - ${p.name ?? ""}`}</SelectItem>)
                ) : (
                  availablePrograms.map((p) => <SelectItem key={p.id} value={String(p.id)}>{`${p.code}${p.name ? ` - ${p.name}` : ""}`}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-course-name">Course Name</Label>
            <Input id="edit-course-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter course name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter course description" rows={3} />
          </div>
          {/* Removed legacy fields (units/hours/semester/yearLevel/status) */}
        </div>

        <DrawerFooter className="px-0 pt-4">
          <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">Cancel</Button>
            </DrawerClose>
            <Button className="flex-1" onClick={async () => {
              // validate required fields: school, program, code, name, description
              if (!formData.school_id) {
                // use browser toast or console if toast not available here
                try { const t = (await import("@/hooks/use-toast")).useToast(); t.toast({ title: "School required", description: "Please select a school." }); } catch { /* ignore */ }
                return;
              }
              if (!formData.program_id) {
                try { const t = (await import("@/hooks/use-toast")).useToast(); t.toast({ title: "Program required", description: "Please select a program." }); } catch { /* ignore */ }
                return;
              }
              if (!formData.code || !formData.code.trim()) {
                try { const t = (await import("@/hooks/use-toast")).useToast(); t.toast({ title: "Code required", description: "Please enter a course code." }); } catch { /* ignore */ }
                return;
              }
              if (!formData.name || !formData.name.trim()) {
                try { const t = (await import("@/hooks/use-toast")).useToast(); t.toast({ title: "Name required", description: "Please enter a course name." }); } catch { /* ignore */ }
                return;
              }
              if (!formData.description || !String(formData.description).trim()) {
                try { const t = (await import("@/hooks/use-toast")).useToast(); t.toast({ title: "Description required", description: "Please enter a course description." }); } catch { /* ignore */ }
                return;
              }
              // all good
              onSave();
            }}>Save Changes</Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

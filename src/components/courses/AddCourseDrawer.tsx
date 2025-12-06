"use client";

import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { coursesAPI } from "@/lib/api/courses";
import { useState, useEffect } from "react";
import { programsAPI } from "@/lib/api/programs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CourseFormData, ProgramOption, SchoolOption } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CourseFormData;
  setFormData: (d: CourseFormData) => void;
  onAdd: (created: any) => void;
  programs: ProgramOption[];
  schools?: SchoolOption[];
}

export default function AddCourseDrawer({ open, onOpenChange, formData, setFormData, onAdd, programs, schools }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const availablePrograms = (programs ?? []).filter((p) => {
    if (!formData?.school_id) return true;
    // support both organization_id and school_id on Program
    return p.organization_id === formData.school_id || (p as any).school_id === formData.school_id;
  });
  const [schoolPrograms, setSchoolPrograms] = useState<Array<{ id: number; code: string; name?: string }>>([]);
  const [loadingSchoolPrograms, setLoadingSchoolPrograms] = useState(false);

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
          <DrawerTitle>Add New Course</DrawerTitle>
          <DrawerDescription>Create a new course in the curriculum</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-code">Course Code</Label>
              <Input id="course-code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g., CS101" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Select value={formData.school_id ? String(formData.school_id) : ""} onValueChange={(v) => {
                const id = parseInt(v, 10);
                const found = (schools ?? []).find((s) => s.id === id);
                setFormData({ ...formData, school_id: isNaN(id) ? undefined : id, school_name: found ? found.name : undefined, program_id: undefined, program_name: undefined });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {(schools ?? []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
            <Select value={formData.program_id ? String(formData.program_id) : ""} onValueChange={(v) => {
              const id = parseInt(v, 10);
              // find in schoolPrograms first (if present), otherwise fallback to programs
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
                  // fallback to availablePrograms when no schoolPrograms
                  availablePrograms.map((p) => <SelectItem key={p.id} value={String(p.id)}>{`${p.code}${p.name ? ` - ${p.name}` : ""}`}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-name">Course Name</Label>
            <Input id="course-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter course name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter course description" rows={3} />
          </div>
          {/* Removed Units/Hours, Semester/Year Level, and Status fields per request */}
        </div>

        <DrawerFooter className="px-0 pt-4">
          <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">Cancel</Button>
            </DrawerClose>
            <Button className="flex-1" onClick={async () => {
              // validate required fields: school, program, code, name, description
              if (!formData.school_id) {
                toast({ title: "School required", description: "Please select a school." });
                return;
              }
              if (!formData.program_id) {
                toast({ title: "Program required", description: "Please select a program." });
                return;
              }
              if (!formData.code || !formData.code.trim()) {
                toast({ title: "Code required", description: "Please enter a course code." });
                return;
              }
              if (!formData.name || !formData.name.trim()) {
                toast({ title: "Name required", description: "Please enter a course name." });
                return;
              }
              if (!formData.description || !String(formData.description).trim()) {
                toast({ title: "Description required", description: "Please enter a course description." });
                return;
              }
              setSubmitting(true);
              try {
                const payload = { program_id: formData.program_id, code: String(formData.code).trim(), name: String(formData.name).trim(), description: String(formData.description).trim() };
                const created = await coursesAPI.createCourse(payload as any);
                // call parent callback with created course
                onAdd(created);
                // reset local form via parent setter
                setFormData({ code: "", name: "", program_name: "", program_id: undefined, school_id: undefined, school_name: undefined, description: "", prerequisites: [] });
                onOpenChange(false);
                toast({ title: "Course created", description: `${created.code} - ${created.name}` });
              } catch (err: any) {
                console.error(err);
                toast({ title: "Failed to create course", description: String(err?.message ?? err) });
              } finally {
                setSubmitting(false);
              }
            }} disabled={submitting}>{submitting ? 'Creating...' : 'Add Course'}</Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

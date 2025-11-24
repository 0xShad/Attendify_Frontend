"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string | number; label: string };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  // filter values
  courseId?: string | number | null;
  setCourseId: (v: string | number | null) => void;
  academicYear?: string | null;
  setAcademicYear: (v: string | null) => void;
  semester?: string | null;
  setSemester: (v: string | null) => void;
  mode?: string | null;
  setMode: (v: string | null) => void;
  dayOfWeek: string[];
  setDayOfWeek: (v: string[]) => void;
  facultyId?: string | number | null;
  setFacultyId: (v: string | number | null) => void;
  activeNow: boolean;
  setActiveNow: (v: boolean) => void;
  // options
  courseOptions?: Option[];
  facultyOptions?: Option[];
  academicYearOptions?: string[];
  semesterOptions?: string[];
  onApply?: () => void;
};

export default function ClassFilterDrawer({
  open,
  onOpenChange,
  courseId = null,
  setCourseId,
  academicYear = null,
  setAcademicYear,
  semester = null,
  setSemester,
  mode = null,
  setMode,
  dayOfWeek,
  setDayOfWeek,
  facultyId = null,
  setFacultyId,
  activeNow,
  setActiveNow,
  courseOptions = [],
  facultyOptions = [],
  academicYearOptions = [],
  semesterOptions = [],
  onApply,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="px-4 pt-4">
          <DrawerTitle>Filter Classes</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="courseId" className="text-sm font-medium">Course</Label>
            <Select value={courseId ? String(courseId) : "__any"} onValueChange={(v) => setCourseId(v === "__any" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__any">Any Course</SelectItem>
                {courseOptions.map((c) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academicYear" className="text-sm font-medium">Academic Year</Label>
              <Select value={academicYear ?? "__any"} onValueChange={(v) => setAcademicYear(v === "__any" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any">Any Year</SelectItem>
                  {academicYearOptions.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester" className="text-sm font-medium">Semester</Label>
              <Select value={semester ?? "__any"} onValueChange={(v) => setSemester(v === "__any" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any">Any Semester</SelectItem>
                  {semesterOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode" className="text-sm font-medium">Mode</Label>
            <Select value={mode ?? "__any"} onValueChange={(v) => setMode(v === "__any" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__any">Any Mode</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="face_to_face">Face To Face</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Day of Week</Label>
            <div className="flex flex-wrap gap-2">
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => {
                const active = dayOfWeek.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDayOfWeek(active ? dayOfWeek.filter(x => x !== d) : [...dayOfWeek, d])}
                    className={`px-3 py-1 rounded-full text-sm border ${active ? 'bg-primary text-primary-foreground border-transparent' : 'bg-transparent text-muted-foreground'}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="faculty" className="text-sm font-medium">Faculty</Label>
            <Select value={facultyId ? String(facultyId) : "__any"} onValueChange={(v) => setFacultyId(v === "__any" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select faculty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__any">Any Faculty</SelectItem>
                {facultyOptions.map((f) => (
                  <SelectItem key={String(f.id)} value={String(f.id)}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input id="activeNow" type="checkbox" checked={activeNow} onChange={(e) => setActiveNow(e.target.checked)} className="w-4 h-4" />
            <Label htmlFor="activeNow" className="text-sm">Active Now</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => {
              setCourseId(null); setAcademicYear(null); setSemester(null); setMode(null); setDayOfWeek([]); setFacultyId(null); setActiveNow(false);
            }}>
              Reset Filters
            </Button>
            <Button className="flex-1" onClick={() => { onApply && onApply(); onOpenChange(false); }}>Apply Filters</Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

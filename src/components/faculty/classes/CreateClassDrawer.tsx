"use client";

import React, { useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconLoader2, IconPlus } from "@tabler/icons-react";

interface CreateClassDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The backend expects a required `course_id` and optional fields below
  newCourseId: string;
  setNewCourseId: (v: string) => void;
  newClassDescription: string;
  setNewClassDescription: (v: string) => void;
  newClassRoom: string;
  setNewClassRoom: (v: string) => void;
  newClassAcademicYear: string;
  setNewClassAcademicYear: (v: string) => void;
  newClassSemester: string;
  setNewClassSemester: (v: string) => void;
  // Optional list of courses to render as a dropdown. If omitted a numeric input is shown.
  courses?: Array<{
    id: number | string;
    code?: string;
    name?: string;
    title?: string;
    program_id?: number | null;
    program_name?: string | null;
    organization_id?: number | null;
    organization_name?: string | null;
  }>;
  coursesLoading?: boolean;
  onReloadCourses?: () => void;
  // Inline course creation
  createNewCourse?: boolean;
  setCreateNewCourse?: (v: boolean) => void;
  newCourseCode?: string;
  setNewCourseCode?: (v: string) => void;
  newCourseName?: string;
  setNewCourseName?: (v: string) => void;
  newCourseDescription?: string;
  setNewCourseDescription?: (v: string) => void;
  newCourseProgramId?: string;
  setNewCourseProgramId?: (v: string) => void;
  addingClass: boolean;
  onAddClass: () => void | Promise<void>;
}

const CreateClassDrawer: React.FC<CreateClassDrawerProps> = ({
  open,
  onOpenChange,
  newCourseId,
  setNewCourseId,
  newClassDescription,
  setNewClassDescription,
  newClassRoom,
  setNewClassRoom,
  newClassAcademicYear,
  setNewClassAcademicYear,
  newClassSemester,
  setNewClassSemester,
  courses,
  coursesLoading,
  onReloadCourses,
  // inline course props with safe defaults
  createNewCourse = false,
  setCreateNewCourse = () => {},
  newCourseCode = "",
  setNewCourseCode = () => {},
  newCourseName = "",
  setNewCourseName = () => {},
  newCourseDescription = "",
  setNewCourseDescription = () => {},
  newCourseProgramId = "",
  setNewCourseProgramId = () => {},
  addingClass,
  onAddClass,
}) => {
  const [programFilter, setProgramFilter] = React.useState<string>("__all__");

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [open]);

  // derive available programs from courses prop
  const programOptions = React.useMemo(() => {
    if (!Array.isArray(courses))
      return [] as Array<{ id: string; name: string }>;
    const map = new Map<string, string>();
    for (const c of courses) {
      const pid =
        c.program_id !== undefined && c.program_id !== null
          ? String(c.program_id)
          : "__none__";
      const pname =
        c.program_name ??
        (c.program_id ? `Program ${c.program_id}` : "(No program)");
      if (!map.has(pid)) map.set(pid, pname);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [courses]);

  const filteredCourses = React.useMemo(() => {
    if (!Array.isArray(courses)) return [] as typeof courses;
    if (programFilter === "__all__") return courses;
    if (programFilter === "__none__")
      return courses.filter(
        (c) => c.program_id === undefined || c.program_id === null
      );
    return courses.filter((c) => String(c.program_id) === programFilter);
  }, [courses, programFilter]);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      dismissible={true}
      shouldScaleBackground={false}
      modal={true}
      preventScrollRestoration={true}
    >
      <DrawerContent
        className="flex flex-col outline-none !fixed !bottom-0 !left-0 !right-0 max-h-[90vh]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DrawerHeader>
          <DrawerTitle>Create New Class</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          <div>
            <Label htmlFor="program-filter">
              {createNewCourse ? "Program (required)" : "Program"}
            </Label>
            <div className="mb-2">
              <Select
                value={programFilter}
                onValueChange={(v) => {
                  setProgramFilter(v);
                  // If we're creating a new course, use this program selection for the new course
                  if (createNewCourse) {
                    // Treat the sentinel values as no-selection
                    if (v === "__all__" || v === "__none__")
                      setNewCourseProgramId("");
                    else setNewCourseProgramId(v);
                  }
                }}
              >
                <SelectTrigger
                  id="program-filter"
                  disabled={
                    Boolean(coursesLoading) || programOptions.length === 0
                  }
                >
                  <SelectValue
                    placeholder={
                      programOptions.length > 0
                        ? createNewCourse
                          ? "Select program (required)"
                          : "Filter by program (optional)"
                        : "All programs"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All programs</SelectItem>
                  {programOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <div className="flex-none">
                <Label htmlFor="course-id">Course</Label>
                <Select
                  value={newCourseId}
                  onValueChange={(v) => setNewCourseId(v)}
                >
                  <SelectTrigger
                    id="course-id"
                    className="w-72"
                    disabled={
                      createNewCourse ||
                      Boolean(coursesLoading) ||
                      !(filteredCourses && filteredCourses.length > 0)
                    }
                  >
                    <SelectValue
                      placeholder={
                        coursesLoading
                          ? "Loading courses..."
                          : filteredCourses && filteredCourses.length > 0
                          ? "Select a course"
                          : "No courses available"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(filteredCourses) &&
                    filteredCourses.length > 0 ? (
                      filteredCourses.map((c) => (
                        <SelectItem key={String(c.id)} value={String(c.id)}>
                          {c.code && c.name
                            ? `${c.code} - ${c.name}`
                            : c.code
                            ? String(c.code)
                            : c.name ?? c.title ?? String(c.id)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__no_courses__" disabled>
                        No courses available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="create-new-course"
                  type="checkbox"
                  checked={createNewCourse}
                  onChange={(e) => {
                    const checked = Boolean(e.target.checked);
                    setCreateNewCourse(checked);
                    if (checked) setNewCourseId("");
                  }}
                  className="checkbox"
                />
                <label htmlFor="create-new-course" className="text-sm">
                  Create a new course inline
                </label>
              </div>
            </div>

            {createNewCourse ? (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="new-course-code">Course Code</Label>
                  <Input
                    id="new-course-code"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="e.g., CS999"
                  />
                </div>
                <div>
                  <Label htmlFor="new-course-name">Course Name</Label>
                  <Input
                    id="new-course-name"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="e.g., Special Topics in CS"
                  />
                </div>
                {/* Program selection moved to the top Program filter. When creating a new course,
                    the top Program field becomes required and its value is used for the new course. */}
                <div>
                  <Label htmlFor="new-course-description">
                    Course Description (optional)
                  </Label>
                  <Textarea
                    id="new-course-description"
                    value={newCourseDescription}
                    onChange={(e) => setNewCourseDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ) : null}
            <div className="mt-2 text-sm text-muted-foreground">
              {coursesLoading ? <span>Loading course options…</span> : null}
            </div>
          </div>
          <div>
            <Label htmlFor="class-room">Room (optional)</Label>
            <Input
              id="class-room"
              value={newClassRoom}
              onChange={(e) => setNewClassRoom(e.target.value)}
              placeholder="e.g., Room 202"
            />
          </div>
          <div>
            <Label htmlFor="class-academic-year">
              Academic Year (optional)
            </Label>
            <Input
              id="class-academic-year"
              value={newClassAcademicYear}
              onChange={(e) => setNewClassAcademicYear(e.target.value)}
              placeholder="e.g., 2025-2026"
            />
          </div>
          <div>
            <Label htmlFor="class-semester">Semester (optional)</Label>
            <Input
              id="class-semester"
              value={newClassSemester}
              onChange={(e) => setNewClassSemester(e.target.value)}
              placeholder="e.g., Fall"
            />
          </div>
          <div>
            <Label htmlFor="class-description">Description (optional)</Label>
            <Textarea
              id="class-description"
              value={newClassDescription}
              onChange={(e) => setNewClassDescription(e.target.value)}
              placeholder="Brief description of the class"
              rows={3}
            />
          </div>
        </div>
        <DrawerFooter>
          <Button
            onClick={() => void onAddClass()}
            disabled={addingClass}
            className="w-full"
          >
            {addingClass ? (
              <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <IconPlus className="w-4 h-4 mr-2" />
            )}
            Create Class
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateClassDrawer;

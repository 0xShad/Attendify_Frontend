"use client";

import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IconBooks, IconHash, IconClock, IconCalendar, IconSchool } from "@tabler/icons-react";
import type { Course, CourseFormData } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onEditFromView: (data: CourseFormData) => void;
}

export default function ViewCourseDrawer({ open, onOpenChange, course, onEditFromView }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-6 pb-6 max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Course Details</DrawerTitle>
          <DrawerDescription>View comprehensive information about this course.</DrawerDescription>
        </DrawerHeader>

        {course && (
          <div className="space-y-6 overflow-y-auto flex-1">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                <IconBooks className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{course.name}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Course Code: <span className="font-medium text-foreground">{course.code}</span></div>
                  <div>Program: <span className="font-medium text-foreground">{course.program_name ?? "-"} {course.program_code ? (<span className="text-muted-foreground">({course.program_code})</span>) : null}</span></div>
                  <div>Organization: <span className="font-medium text-foreground">{course.school_name ?? course.school_name ?? course.school_name ?? course.school_name ?? course.school_name ?? course.school_name ?? course.school_name ?? course.school_name ?? course.school_name ?? course.school_name ?? course.school_name ?? course.school_name ?? course.school_name ?? course.school_name}</span></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center"><IconBooks className="h-6 w-6 text-primary mx-auto mb-2" /><div className="text-2xl font-semibold text-primary">{course.classes_count ?? 0}</div><div className="text-sm text-muted-foreground">Classes</div></Card>
              <Card className="p-4 text-center"><IconSchool className="h-6 w-6 text-primary mx-auto mb-2" /><div className="text-lg font-semibold text-primary">{course.school_name ?? "-"}</div><div className="text-sm text-muted-foreground">Organization</div></Card>
              <Card className="p-4 text-center"><IconHash className="h-6 w-6 text-primary mx-auto mb-2" /><div className="text-lg font-semibold text-primary">{course.program_name ?? "-"}</div><div className="text-sm text-muted-foreground">Program</div></Card>
              <Card className="p-4 text-center"><IconCalendar className="h-6 w-6 text-primary mx-auto mb-2" /><div className="text-lg font-semibold text-primary">{course.program_code ?? "-"}</div><div className="text-sm text-muted-foreground">Program Code</div></Card>
            </div>

            {course.description && (
              <div>
                <h4 className="font-semibold mb-2">Course Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
              </div>
            )}

            {course.prerequisites && course.prerequisites.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Prerequisites</h4>
                <div className="flex flex-wrap gap-2">{course.prerequisites.map((p, i) => <Badge key={i} variant="outline">{p}</Badge>)}</div>
              </div>
            )}
          </div>
        )}

        <DrawerFooter>
          <div className="flex gap-3 max-w-md mx-auto w-full">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">Close</Button>
            </DrawerClose>
            <Button className="flex-1" onClick={() => {
              if (course) {
                const payload: CourseFormData = {
                  code: course.code,
                  name: course.name,
                  program_name: course.program_name ?? course.program_code ?? "",
                  program_id: course.program_id,
                  units: course.units,
                  hours: course.hours,
                  semester: course.semester,
                  yearLevel: course.yearLevel,
                  status: course.status,
                  description: course.description || "",
                  prerequisites: course.prerequisites || [],
                };
                onEditFromView(payload);
              }
            }}>Edit Course</Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

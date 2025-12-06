"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconBooks } from "@tabler/icons-react";
import type { Course } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onConfirm: () => void;
}

export default function DeleteCourseDialog({ open, onOpenChange, course, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Course</DialogTitle>
          <DialogDescription>Are you sure you want to delete this course? This action cannot be undone.</DialogDescription>
        </DialogHeader>

        {course && (
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <IconBooks className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-red-900">{course.code} - {course.name}</div>
                  <div className="text-sm text-red-700">{course.program_name ?? course.program_code ?? "-"} • {course.school_name ?? "-"} • {typeof course.classes_count === 'number' ? `${course.classes_count} classes` : "-"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }}>Delete Course</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

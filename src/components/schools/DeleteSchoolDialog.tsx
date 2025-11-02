"use client";

import React from "react";
import { IconSchool, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { School } from "./types";

interface DeleteSchoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: School | null;
  error: string | null;
  onConfirm: () => void;
}

export function DeleteSchoolDialog({
  open,
  onOpenChange,
  school,
  error,
  onConfirm,
}: DeleteSchoolDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete School</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this school? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {school && (
          <div className="py-4">
            <div className="bg-stone-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <IconSchool className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">{school.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {school.location}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Programs:</span>{" "}
                  <span className="font-medium">{school.totalPrograms || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Courses:</span>{" "}
                  <span className="font-medium">{school.totalCourses || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Students:</span>{" "}
                  <span className="font-medium">{school.totalStudents || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Faculty:</span>{" "}
                  <span className="font-medium">{school.totalFaculty || 0}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <IconTrash className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Cannot Delete School</h4>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!!error}
          >
            <IconTrash className="h-4 w-4 mr-2" />
            Delete School
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

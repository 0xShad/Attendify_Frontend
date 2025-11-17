"use client";

import * as React from "react";
import { IconTrash, IconChalkboard } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClassItem } from "./ClassCard";

interface DeleteClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem: ClassItem | null;
  error?: string | null;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function DeleteClassDialog({ open, onOpenChange, classItem, error, loading, onConfirm }: DeleteClassDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete class</DialogTitle>
          <DialogDescription>
            This will permanently delete the class if there are no blocking related records.
            Deletion will fail when there are attendance logs; schedules, announcements and enrollees may be removed automatically.
          </DialogDescription>
        </DialogHeader>

        {classItem && (
          <div className="py-4">
            <div className="bg-stone-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <IconChalkboard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{classItem.class_code ?? `Class ${classItem.id}`}</p>
                  {classItem.course_name && <p className="text-sm text-muted-foreground">{classItem.course_name}</p>}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <IconTrash className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Delete failed</h4>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm()} disabled={loading || !!error}>
            <IconTrash className="h-4 w-4 mr-2" />
            Delete class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteClassDialog;

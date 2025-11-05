"use client";

import React from "react";
import { IconSchool } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Program } from "./types";

interface DeleteProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Program | null;
  onConfirm: () => void;
}

export function DeleteProgramDialog({
  open,
  onOpenChange,
  program,
  onConfirm,
}: DeleteProgramDialogProps) {
  if (!program) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Program</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this program? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <IconSchool className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-red-900">
                  {program.name}
                </div>
                <div className="text-sm text-red-700">
                  {program.code} • {program.organization}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

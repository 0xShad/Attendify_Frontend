"use client";

import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { classesAPI } from "@/lib/api/classes";

type Props = {
  open: boolean;
  classId?: number | null;
  classLabel?: string | null;
  onClose: () => void;
  onDeleted?: (id: number) => void;
};

export default function DeleteClassDialog({ open, classId, classLabel, onClose, onDeleted }: Props) {
  const { toast } = useToast();
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = React.useCallback(async () => {
    if (!classId) return;
    setDeleting(true);
    try {
      await classesAPI.deleteClass(Number(classId));
      toast({ title: "Deleted", description: `${classLabel ?? `Class ${classId}`} deleted` });
      onDeleted?.(Number(classId));
      onClose();
    } catch (err: any) {
      console.error("Failed to delete class", err);
      toast({ title: "Delete failed", description: String(err?.message ?? err) });
    } finally {
      setDeleting(false);
    }
  }, [classId, classLabel, onClose, onDeleted, toast]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Delete class</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <p>Are you sure you want to delete <strong>{classLabel ?? `class ${classId}`}</strong>? This action cannot be undone.</p>
        </div>

        <DialogFooter>
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={deleting}>Cancel</Button>
            <Button type="button" className="bg-red-600 text-white" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

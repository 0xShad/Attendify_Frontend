"use client";

import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { schedulesAPI } from "@/lib/api/schedules";

type ScheduleSummary = {
  id: number;
  type: "normal" | "special";
  start_time: string;
  end_time: string;
  location?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: number | null;
  schedule?: ScheduleSummary | null;
  onDeleted?: (id: number) => void;
};

export default function DeleteScheduleDialog({ open, onOpenChange, classId, schedule, onDeleted }: Props) {
  const { toast } = useToast();
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = React.useCallback(async () => {
    if (!classId || !schedule) return;
    setDeleting(true);
    try {
      await schedulesAPI.deleteScheduleForClass(classId, schedule.id);
      toast({ title: "Deleted", description: "Schedule removed" });
      onDeleted?.(schedule.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to delete schedule", err);
      toast({ title: "Delete failed", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }, [classId, schedule, onDeleted, onOpenChange, toast]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete schedule</DialogTitle>
        </DialogHeader>

        {schedule && (
          <div className="py-2">
            <p>Are you sure you want to delete this schedule <strong>{schedule.type === 'normal' ? schedule.start_time + ' — ' + schedule.end_time : schedule.start_time + ' — ' + schedule.end_time}</strong>? This action cannot be undone.</p>
            <div className="text-sm text-muted-foreground mt-2">{schedule.location ?? 'No location specified'}</div>
          </div>
        )}

        <DialogFooter>
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={deleting}>Cancel</Button>
            <Button type="button" className="bg-red-600 text-white" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

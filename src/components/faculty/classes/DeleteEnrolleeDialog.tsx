"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { classesAPI } from "@/lib/api/classes";
import { checkAuth } from "@/lib/clientAuth";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: number | null;
  enrollee?: { id: number; full_name?: string | null } | null;
  onDeleted?: (id: number) => void;
};

export default function DeleteEnrolleeDialog({ open, onOpenChange, classId, enrollee, onDeleted }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = React.useCallback(async () => {
    if (!classId || !enrollee) return;

    // Verify session before deleting enrollee
    try {
      const ok = await checkAuth();
      if (!ok) {
        const redirectTo = encodeURIComponent(window.location.pathname || '/');
        router.push(`/auth/login?redirect=${redirectTo}`);
        return;
      }
    } catch (err) {
      const redirectTo = encodeURIComponent(window.location.pathname || '/');
      router.push(`/auth/login?redirect=${redirectTo}`);
      return;
    }

    setDeleting(true);
    try {
      await classesAPI.deleteEnrolleeFromClass(Number(classId), enrollee.id);
      toast({ title: "Deleted", description: `${enrollee.full_name ?? `Enrollee ${enrollee.id}`} removed` });
      onDeleted?.(enrollee.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to delete enrollee", err);
      toast({ title: "Delete failed", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }, [classId, enrollee, onDeleted, onOpenChange, toast, router]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove student from class</DialogTitle>
        </DialogHeader>

        {enrollee && (
          <div className="py-2">
            <p>Are you sure you want to remove <strong>{enrollee.full_name ?? `student ${enrollee.id}`}</strong> from this class? This action cannot be undone.</p>
          </div>
        )}

        <DialogFooter>
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={deleting}>Cancel</Button>
            <Button type="button" className="bg-red-600 text-white" onClick={handleDelete} disabled={deleting}>{deleting ? "Removing…" : "Remove"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

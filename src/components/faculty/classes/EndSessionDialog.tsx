"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { checkAuth } from "@/lib/clientAuth";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classId: string | number | null;
  onConfirm?: (classId: string | number) => Promise<any> | any;
}

export default function EndSessionDialog({ open, onOpenChange, classId, onConfirm }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    if (!classId) return;

    // Verify session before ending session
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

    setLoading(true);
    try {
      if (typeof onConfirm === "function") {
        await onConfirm(classId);
      } else if (typeof window !== "undefined") {
        // emit a generic event so callers can listen if they prefer not to pass a handler
        window.dispatchEvent(new CustomEvent("classes:end-session:confirm", { detail: { classId } }));
      }
      onOpenChange(false);
      try { toast({ title: 'Session ended', description: 'The session was successfully ended.', variant: 'default' }); } catch (e) {}
    } catch (err: any) {
      const msg = err?.message ?? String(err ?? 'Failed to end session');
      toast({ title: 'Failed to end session', description: String(msg), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End Attendance Session</DialogTitle>
          <DialogDescription>Are you sure you want to end the current attendance session for this class? This action cannot be undone for today.</DialogDescription>
        </DialogHeader>

        <div />

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Ending...' : 'End Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

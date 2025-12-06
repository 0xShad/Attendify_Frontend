"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cancelMyExcusalRequest } from '@/lib/api/attendance';
import { checkAuth } from '@/lib/clientAuth';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request?: any;
  onConfirm: (id: number) => void;
};

export default function CancelExcusalDialog({ open, onOpenChange, request, onConfirm }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!request) {
      onOpenChange(false);
      return;
    }

    // Verify session before cancelling excusal request
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
      const res = await cancelMyExcusalRequest(Number(request.id));
      // Build a friendly description without exposing raw IDs
      let desc = 'Your excusal request has been cancelled.';
      try {
        const parts: string[] = [];
        if (request.class_code) parts.push(String(request.class_code));
        if (request.requested_date) {
          const dt = new Date(String(request.requested_date));
          if (!isNaN(dt.getTime())) {
            const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(dt);
            parts.push(fmt);
          } else {
            parts.push(String(request.requested_date));
          }
        }
        if (parts.length) desc = `Your excusal request${parts.length ? ' for ' + parts.join(' on ') : ''} has been cancelled.`;
      } catch (e) {
        // fallback to generic message
        desc = 'Your excusal request has been cancelled.';
      }
      toast({ title: 'Request cancelled', description: desc });
      try { onConfirm(Number(res.id)); } catch (_) { /* swallow parent handler errors */ }
    } catch (err: any) {
      const msg = err?.body?.detail ?? err?.message ?? String(err);
      toast({ title: 'Cancel failed', description: String(msg), variant: 'destructive' });
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Excusal Request</DialogTitle>
        </DialogHeader>

        <div className="p-2">
          <p>
            {request ? (
              <>Are you sure you want to cancel your excusal request{request.class_code || request.requested_date ? ' for ' : ''}{request.class_code ? ` ${request.class_code}` : ''}{request.class_code && request.requested_date ? ' on ' : ''}{request.requested_date ? ` ${request.requested_date}` : ''}? </>
            ) : (
              <>Are you sure you want to cancel this excusal request?</>
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-2">This action will cancel the request and cannot be undone.</p>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>No, keep</Button>
          <Button onClick={handleConfirm} disabled={loading}>{loading ? 'Cancelling…' : 'Yes, cancel'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

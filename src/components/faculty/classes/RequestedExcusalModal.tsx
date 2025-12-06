"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import resolveAvatarUrl from '@/lib/utils/resolveAvatarUrl';
import { useToast } from '@/hooks/use-toast';
import { reviewMyExcusalRequest, ExcusalRequestOut } from '@/lib/api/attendance';

type Excusal = any;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: Excusal | null;
  onReviewed?: (updated: ExcusalRequestOut) => void;
};

export default function RequestedExcusalModal({ open, onOpenChange, request, onReviewed }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  if (!request) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request</DialogTitle>
          </DialogHeader>
          <div className="p-4">No data</div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  const avatar = resolveAvatarUrl(request.avatar_url);

  function fmtDateTime(iso?: string | null) {
    if (!iso) return '-';
    try {
      const d = new Date(String(iso));
      if (isNaN(d.getTime())) return String(iso);
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
    } catch (e) {
      return String(iso);
    }
  }

  function formatStatus(status?: string | null) {
    if (!status) return '—';
    const s = String(status).trim();
    if (!s) return '—';
    return s.replace(/[_-]+/g, ' ').split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  function statusBadgeProps(status?: string | null): { variant?: 'secondary' | 'destructive' | 'default' | 'outline'; className?: string } {
    const s = String(status ?? '').trim().toLowerCase();
    if (!s) return { variant: 'default', className: 'border-gray-200 text-gray-700 bg-gray-50' };
    if (s === 'approved' || s === 'accept' || s === 'accepted') return { variant: 'secondary', className: 'border-green-200 text-green-700 bg-green-50' };
    if (s === 'cancelled' || s === 'canceled') return { variant: 'default', className: 'border-gray-200 text-gray-700 bg-gray-50' };
    if (s === 'pending' || s === 'awaiting' || s === 'submitted') return { variant: 'outline', className: 'border-yellow-200 text-yellow-700 bg-yellow-50' };
    if (s === 'denied' || s === 'rejected' || s === 'declined') return { variant: 'destructive', className: 'border-red-200 text-red-700 bg-red-50' };
    return { variant: 'default', className: 'border-gray-200 text-gray-700 bg-gray-50' };
  }

  const handleDecision = async (decision: 'approve' | 'reject') => {
    if (!request) return;
    setLoading(true);
    try {
      const payload = { decision };
      const updated = await reviewMyExcusalRequest(Number(request.id), payload as any);
      toast({ title: `Request ${decision === 'approve' ? 'approved' : 'rejected'}`, description: 'Updated successfully.' });
      onOpenChange(false);
      if (typeof onReviewed === 'function') {
        try { onReviewed(updated as ExcusalRequestOut); } catch (e) { /* ignore */ }
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to review request';
      toast({ title: 'Error', description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Excusal Request</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {avatar ? (
                <AvatarImage src={avatar} alt={request.full_name ?? `User ${request.profile_id}`} />
              ) : (
                <AvatarFallback>{(request.full_name || String(request.profile_id)).charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="font-medium">{request.full_name ?? `Profile ${request.profile_id}`}</div>
              <div className="text-xs text-muted-foreground">Requested {fmtDateTime(request.requested_date ?? null)}</div>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-2">

            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="font-medium"><span className="inline-block"><Badge {...statusBadgeProps(request.status)}>{formatStatus(request.status)}</Badge></span></dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">Type</dt>
              <dd className="font-medium">{String(request.excusal_type ?? '').charAt(0).toUpperCase() + String(request.excusal_type ?? '').slice(1)}</dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">Submitted</dt>
              <dd className="font-medium">{fmtDateTime(request.submitted_at ?? null)}</dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">Reviewed at</dt>
              <dd className="font-medium">{request.reviewed_at ? fmtDateTime(request.reviewed_at) : 'Not reviewed yet.'}</dd>
            </div>

            {request.review_notes ? (
              <div>
                <dt className="text-xs text-muted-foreground">Review notes</dt>
                <dd className="whitespace-pre-wrap">{request.review_notes}</dd>
              </div>
            ) : null}

            <div>
              <dt className="text-xs text-muted-foreground">Reason</dt>
              <dd className="whitespace-pre-wrap">{request.reason ?? '-'}</dd>
            </div>
          </dl>
        </div>

        <DialogFooter>
          {String(request.status)?.toLowerCase() === 'pending' ? (
            <div className="flex gap-2">
              <Button variant="secondary" disabled={loading} onClick={() => handleDecision('approve')}>Accept</Button>
              <Button variant="destructive" disabled={loading} onClick={() => handleDecision('reject')}>Reject</Button>
            </div>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

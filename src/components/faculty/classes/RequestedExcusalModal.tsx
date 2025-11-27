"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
              <div className="text-xs text-muted-foreground">Requested {request.requested_date ?? '-'}</div>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-2">
            <div>
              <dt className="text-xs text-muted-foreground">Type</dt>
              <dd className="font-medium">{String(request.excusal_type ?? '').charAt(0).toUpperCase() + String(request.excusal_type ?? '').slice(1)}</dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="font-medium">{String(request.status ?? '').charAt(0).toUpperCase() + String(request.status ?? '').slice(1)}</dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">Submitted</dt>
              <dd className="font-medium">{request.submitted_at ?? '-'}</dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">Reviewed at</dt>
              <dd className="font-medium">{request.reviewed_at ?? '-'}</dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">Review notes</dt>
              <dd className="whitespace-pre-wrap">{request.review_notes ?? '-'}</dd>
            </div>

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

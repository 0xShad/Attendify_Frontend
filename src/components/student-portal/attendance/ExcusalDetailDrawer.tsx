"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const fmtDate = (iso?: string | null) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch (e) {
    return String(iso);
  }
};

type Excusal = any;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: Excusal | null;
};

export default function ExcusalDetailDrawer({ open, onOpenChange, request }: Props) {
  if (!request) return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Request</DialogTitle></DialogHeader><div className="p-4">No data</div></DialogContent></Dialog>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Excusal Request #{String(request.id)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 p-2">
          <dl className="grid grid-cols-2 gap-2">
            <div>
              <dt className="text-xs text-muted-foreground">Class</dt>
              <dd className="font-medium">{request.class_code ?? `Class ${request.class_id}`}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Course</dt>
              <dd className="font-medium">{request.course_name ?? '-'}</dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">Requested date</dt>
              <dd className="font-medium">{request.requested_date ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Type</dt>
              <dd className="font-medium">{String(request.excusal_type ?? '').charAt(0).toUpperCase() + String(request.excusal_type ?? '').slice(1)}</dd>
            </div>

            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Reason</dt>
              <dd className="font-medium whitespace-pre-wrap">{request.reason ?? '-'}</dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">Submitted at</dt>
              <dd className="font-medium">{fmtDate(request.submitted_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="font-medium">
                {
                  (() => {
                    const raw = String(request.status ?? '').toLowerCase();
                    const label = raw.length ? (raw.charAt(0).toUpperCase() + raw.slice(1)) : raw;
                    const className =
                      raw === 'approved'
                        ? 'border-green-200 text-green-700 bg-green-50'
                        : raw === 'pending'
                        ? 'border-yellow-200 text-yellow-800 bg-yellow-50'
                        : raw === 'denied' || raw === 'declined'
                        ? 'border-red-200 text-red-700 bg-red-50'
                        : raw === 'cancelled' || raw === 'canceled'
                        ? 'border-gray-200 text-gray-700 bg-gray-50'
                        : 'border-gray-200 text-gray-700 bg-gray-50';

                    return <Badge className={className}>{label}</Badge>;
                  })()
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">Reviewed at</dt>
              <dd className="font-medium">{request.reviewed_at ? fmtDate(request.reviewed_at) : <span className="text-destructive">Not reviewed yet.</span>}</dd>
            </div>

            {request.review_notes ? (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Review notes</dt>
                <dd className="font-medium whitespace-pre-wrap">{request.review_notes}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        
      </DialogContent>
    </Dialog>
  );
}

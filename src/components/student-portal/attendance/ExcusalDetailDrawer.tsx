"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Excusal = any;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: Excusal | null;
};

export default function ExcusalDetailDrawer({ open, onOpenChange, request }: Props) {
  if (!request) return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Request</DialogTitle></DialogHeader><div className="p-4">No data</div><DialogFooter><Button onClick={() => onOpenChange(false)}>Close</Button></DialogFooter></DialogContent></Dialog>
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
              <dd className="font-medium">{request.submitted_at ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="font-medium">{String(request.status ?? '').charAt(0).toUpperCase() + String(request.status ?? '').slice(1)}</dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">Reviewed at</dt>
              <dd className="font-medium">{request.reviewed_at ?? '-'}</dd>
            </div>

            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Review notes</dt>
              <dd className="font-medium whitespace-pre-wrap">{request.review_notes ?? '-'}</dd>
            </div>
          </dl>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

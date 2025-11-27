"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FacultyRequestedExcuses({ onView }: { onView?: (id: number) => void }) {
  const items = [
    { id: 11, requester: 'Alice Cooper', classCode: 'BIO101', requested_date: '2025-11-20', type: 'Late', status: 'pending' },
    { id: 12, requester: 'Bob Wilson', classCode: 'CS201', requested_date: '2025-11-18', type: 'Absence', status: 'approved' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requested Excuses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <div className="font-medium">{it.requester} — {it.classCode}</div>
                <div className="text-xs text-muted-foreground">{it.requested_date} • {it.type}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">{it.status}</div>
                <Button size="sm" variant="ghost" onClick={() => onView?.(it.id)}>View</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

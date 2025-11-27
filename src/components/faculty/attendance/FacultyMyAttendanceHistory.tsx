"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Record = { id: number; className: string; date: string; status: string };

export default function FacultyMyAttendanceHistory({ onPage }: { onPage?: (direction: 'prev' | 'next') => void }) {
  const data: Record[] = [
    { id: 1, className: 'Intro to Biology', date: '2025-11-20T09:00:00Z', status: 'Present' },
    { id: 2, className: 'Algorithms', date: '2025-11-18T11:00:00Z', status: 'Late' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance History</CardTitle>
        <CardDescription>Recent attendance records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <div className="font-medium">{r.className}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.date).toLocaleString()}</div>
              </div>
              <div className="text-sm">{r.status}</div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-muted-foreground">Showing 1–2</div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => onPage?.('prev')}>Prev</Button>
              <Button size="sm" onClick={() => onPage?.('next')}>Next</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

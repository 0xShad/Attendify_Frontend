"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Session = {
  id: string;
  className: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'scheduled' | 'completed';
  presentCount: number;
  totalStudents: number;
};

export default function FacultyStudentsAttendance({
  sessions = [],
  onStart = (s: Session) => {},
  onEnd = (id: string) => {},
}: {
  sessions?: Session[];
  onStart?: (session: Session) => void;
  onEnd?: (id: string) => void;
}) {
  const list = sessions.length ? sessions : [
    { id: 'S1', className: 'Intro to Biology', date: '2025-11-28', startTime: '09:00', status: 'active', presentCount: 12, totalStudents: 30 },
    { id: 'S2', className: 'Algorithms', date: '2025-11-28', startTime: '11:00', status: 'scheduled', presentCount: 0, totalStudents: 28 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {list.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{s.className}</div>
                <div className="text-sm text-muted-foreground">{s.date} • {s.startTime} • {s.status}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">{s.presentCount}/{s.totalStudents}</div>
                {s.status === 'active' ? (
                  <Button size="sm" onClick={() => onEnd(s.id)}>End</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => onStart(s)}>Start</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

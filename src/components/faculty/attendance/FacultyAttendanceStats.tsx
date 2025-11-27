"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function FacultyAttendanceStats() {
  const overview = { total: 120, present: 102, late: 8, absent: 10, excused: 5 };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>Attendance summary</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 border rounded">
            <div className="text-sm text-muted-foreground">Total Logs</div>
            <div className="font-medium text-lg">{overview.total}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="text-sm text-muted-foreground">Present</div>
            <div className="font-medium text-lg">{overview.present}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="text-sm text-muted-foreground">Late</div>
            <div className="font-medium text-lg">{overview.late}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="text-sm text-muted-foreground">Absent</div>
            <div className="font-medium text-lg">{overview.absent}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

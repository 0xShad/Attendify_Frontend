"use client";
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FacultyStudentsAttendance from './FacultyStudentsAttendance';
import FacultyMyAttendanceHistory from './FacultyMyAttendanceHistory';
import FacultyAttendanceStats from './FacultyAttendanceStats';
import FacultyRequestedExcuses from './FacultyRequestedExcuses';

export default function AttendanceTab() {
  const handleStart = (s: any) => { console.log('start', s); };
  const handleEnd = (id: string) => { console.log('end', id); };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Record attendance and view attendance history (faculty)</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Recent Attendance</TabsTrigger>
          <TabsTrigger value="history">My Attendance History</TabsTrigger>  
          <TabsTrigger value="requested">Requested Excuses</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <FacultyStudentsAttendance onStart={handleStart} onEnd={handleEnd} />
        </TabsContent>

        <TabsContent value="history">
          <FacultyMyAttendanceHistory />
        </TabsContent>

        <TabsContent value="stats">
          <FacultyAttendanceStats />
        </TabsContent>

        <TabsContent value="requested">
          <FacultyRequestedExcuses onView={(id) => console.log('view excusal', id)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

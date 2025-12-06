"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CheckCircle, MoreVertical, Eye, Send, Trash2, Square } from "lucide-react";
import StudentRow from "./StudentRow";

export interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "Active" | "Completed" | "Scheduled";
  presentCount: number;
  totalStudents: number;
  location?: string;
}

interface Props {
  session?: AttendanceSession;
  compact?: boolean;
  onEnd?: (id: string) => void;
  onManualEdit?: (s: AttendanceSession) => void;
  onViewStudent?: (student: any) => void;
}

export default function SessionRow({ session, compact = false, onEnd, onManualEdit, onViewStudent }: Props) {
  if (!session) return null;

  if (compact) {
    return (
      <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-stone-100/30 border">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{session.className}</h4>
          <p className="text-sm text-muted-foreground">{session.presentCount}/{session.totalStudents} present</p>
          <p className="text-xs text-muted-foreground">Started: {session.startTime} • {session.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
          <Button size="sm" variant="destructive" onClick={() => onEnd?.(session.id)}>
            <Square className="w-3 h-3 mr-1" />
            End
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div key={session.id} className="p-4 rounded-lg border bg-green-50/50 border-green-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium">{session.className}</h4>
          <p className="text-sm text-muted-foreground">Started: {session.startTime} • {session.location}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className="bg-green-100 text-green-700 border-green-200"><div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />Live</Badge>
          <Button size="sm" variant="destructive" onClick={() => onEnd?.(session.id)} className="whitespace-nowrap">End Session</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{session.presentCount}</div>
            <div className="text-sm text-muted-foreground">Present</div>
          </div>
        </div>
        <div className="p-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{session.totalStudents - session.presentCount}</div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </div>
        </div>
        <div className="p-0">
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round((session.presentCount / session.totalStudents) * 100)}%</div>
            <div className="text-sm text-muted-foreground">Attendance</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-sm">Student Attendance</h5>
          <Button size="sm" variant="outline" onClick={() => onManualEdit?.(session)}>
            Edit
          </Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {Array.from({ length: session.totalStudents }, (_, i) => {
            const isPresent = i < session.presentCount;
            const student = {
              id: `student-${i}`,
              name: `Student ${i + 1}`,
              email: `student${i + 1}@university.edu`,
              avatar: `S${i + 1}`,
              isPresent,
            };

            return (
              <StudentRow
                key={student.id}
                student={student}
                isPresent={isPresent}
                onToggle={(id) => console.log(`Toggle ${id}`)}
                onView={(s) => onViewStudent?.({ id: s.id, name: s.name, email: s.email })}
                onRemove={(id) => console.log(`Remove ${id}`)}
              />
            );
          })}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => console.log("Mark all present")}>Mark all present</Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => console.log("Mark all absent")}>Mark all absent</Button>
        </div>
      </div>
    </div>
  );
}

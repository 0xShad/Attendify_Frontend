"use client";

import React from "react";
import SessionRow from "./SessionRow";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  MoreVertical,
  Trash2,
  CheckCircle,
  Send,
  Play,
  Square,
  Clock,
  Users,
} from "lucide-react";
import { IconClockHour4 } from "@tabler/icons-react";

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
  sessions: AttendanceSession[];
  variant?: "compact" | "detailed";
  onEndSession?: (sessionId: string) => void;
  onStartSession?: (classId: string) => void;
  onManualEdit?: (session: AttendanceSession) => void;
  onViewStudent?: (student: any) => void;
}

export default function ActiveSessions({
  sessions,
  variant = "detailed",
  onEndSession,
  onStartSession,
  onManualEdit,
  onViewStudent,
}: Props) {
  const active = sessions.filter((s) => s.status === "Active");

  if (variant === "compact") {
    return (
      <Card className="lg:col-span-2 border shadow-sm bg-stone-50/40 supports-[backdrop-filter]:backdrop-blur-md border-stone-200/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconClockHour4 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active sessions</p>
              <p className="text-sm">Start an attendance session to monitor real-time attendance</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionRow key={session.id} session={session} compact onEnd={onEndSession} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // detailed variant (used on Attendance tab)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>Sessions currently accepting attendance</CardDescription>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <IconClockHour4 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active sessions</p>
            <p className="text-sm">Start a session from your classes to begin taking attendance</p>
          </div>
        ) : (
          <div className="space-y-4">
            {active.map((session) => (
              <SessionRow key={session.id} session={session} onEnd={onEndSession} onManualEdit={onManualEdit} onViewStudent={onViewStudent} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

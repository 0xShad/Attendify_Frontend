"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  MoreVertical,
  Eye,
  Edit,
  UserPlus,
  Play,
  Trash2,
  Users,
  Clock,
} from "lucide-react";
import { IconChalkboard, IconPlus } from "@tabler/icons-react";
import ClassCard from "./ClassCard";

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  schedule: string;
  mode: "Online" | "In-Person" | "Hybrid";
  enrolledStudents: number;
  totalSessions: number;
  completedSessions: number;
  attendanceRate: number;
  status: "Active" | "Inactive" | "Scheduled";
  location?: string;
}

interface Props {
  classes: ClassItem[];
  setAddClassOpen: (open: boolean) => void;
  setSelectedClass: (c: ClassItem | null) => void;
  setViewClassOpen: (open: boolean) => void;
  setEditClassOpen: (open: boolean) => void;
  setEnrollStudentOpen: (open: boolean) => void;
  handleStartSession: (classId: string) => void;
}

export default function MyClasses({
  classes,
  setAddClassOpen,
  setSelectedClass,
  setViewClassOpen,
  setEditClassOpen,
  setEnrollStudentOpen,
  handleStartSession,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">My Classes</h3>
            <p className="text-sm text-muted-foreground">
              Create and manage your classes, schedules, and enrollment
            </p>
          </div>
          <Button onClick={() => setAddClassOpen(true)} size="sm">
            <IconPlus className="w-4 h-4 mr-2" />
            Add Class
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {classes.map((classItem) => (
          <ClassCard
            key={classItem.id}
            classItem={classItem}
            onView={(c) => {
              setSelectedClass(c);
              setViewClassOpen(true);
            }}
            onEdit={(c) => {
              setSelectedClass(c);
              setEditClassOpen(true);
            }}
            onEnroll={(c) => {
              setSelectedClass(c);
              setEnrollStudentOpen(true);
            }}
            onStartSession={handleStartSession}
          />
        ))}
      </div>
    </div>
  );
}

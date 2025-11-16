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
import { IconChalkboard } from "@tabler/icons-react";
export interface ScheduleOut {
  id: number;
  type: "normal" | "special";
  day_of_week?: string | null;
  date?: string | null; // YYYY-MM-DD
  start_time?: string | null; // HH:MM:SS
  end_time?: string | null; // HH:MM:SS
  location?: string | null;
  reason?: string | null;
  notes?: string | null;
  modes?: string[];
}

export interface ClassItem {
  id: string; // class id
  course_id?: number;
  class_code?: string | null;
  course_code?: string | null;
  course_name?: string | null;
  program_id?: number | null;
  program_name?: string | null;
  organization_id?: number | null;
  organization_name?: string | null;
  description?: string | null;
  room?: string | null;
  assigned_faculty_id?: number | null;
  assigned_faculty_name?: string | null;
  academic_year?: string | null;
  semester?: string | null;
  schedules?: ScheduleOut[];
  enrolledStudents?: number;
  attendanceRate?: number;
  status?: "Active" | "Inactive" | "Scheduled";
}

interface Props {
  classItem: ClassItem;
  onView: (c: ClassItem) => void;
  onEdit: (c: ClassItem) => void;
  onEnroll: (c: ClassItem) => void;
  onStartSession: (classId: string) => void;
  onDelete?: (c: ClassItem) => void;
}

export default function ClassCard({
  classItem,
  onView,
  onEdit,
  onEnroll,
  onStartSession,
  onDelete,
}: Props) {
  return (
    <Card key={classItem.id} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base truncate">
              {classItem.class_code ? `${classItem.class_code} — ${classItem.course_name ?? ''}` : (classItem.course_name ?? `Class ${classItem.id}`)}
            </h4>
            <p className="text-sm text-muted-foreground">
              {classItem.program_name ? `${classItem.program_name}${classItem.organization_name ? ` • ${classItem.organization_name}` : ''}` : (classItem.organization_name ?? '')}
              {classItem.academic_year || classItem.semester ? ` • ${[classItem.academic_year, classItem.semester].filter(Boolean).join(' / ')}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                classItem.status === "Active"
                  ? "border-green-200 text-green-700 bg-green-50"
                  : "border-gray-200 text-gray-700 bg-gray-50"
              }
            >
              {classItem.status ?? 'Active'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(classItem)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(classItem)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Class
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEnroll(classItem)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Enroll Student
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStartSession(classItem.id)}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => onDelete && onDelete(classItem)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Class
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{classItem.room ?? 'No room specified'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{classItem.enrolledStudents ?? 0} students</span>
          </div>
          {classItem.schedules && classItem.schedules.length > 0 && (
            <div className="flex items-center gap-2 col-span-2">
              <IconChalkboard className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-col w-full">
                {classItem.schedules.slice(0, 2).map((s) => (
                  <span key={s.id} className="truncate text-xs">
                    {s.type === 'normal' ? `${s.day_of_week ?? ''} ${formatTimeRange(s.start_time, s.end_time)}` : `${s.date ?? ''} ${formatTimeRange(s.start_time, s.end_time)}`}{s.reason ? ` — ${s.reason}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-sm text-muted-foreground">{classItem.assigned_faculty_name ?? ''}</span>
            <span className="font-medium">Attendance: {classItem.attendanceRate ?? 0}%</span>
          </div>

          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => onStartSession(classItem.id)} className="flex-1">
              <Play className="w-3 h-3 mr-1" />
              Start Session
            </Button>
            <Button size="sm" variant="outline" onClick={() => onView(classItem)}>
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimeRange(start?: string | null, end?: string | null) {
  const s = start ? start.slice(0,5) : '';
  const e = end ? end.slice(0,5) : '';
  if (s && e) return `${s}-${e}`;
  if (s) return s;
  return '';
}

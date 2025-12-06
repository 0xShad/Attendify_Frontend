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
  student_count?: number;
  attendance_rate?: number;
  status?: "Active" | "Inactive" | "Scheduled";
  // Active schedule metadata added by backend (see updated /classes/faculty/{id} response)
  is_active?: boolean;
  current_schedule_id?: number | null;
  current_schedule_type?: string | null;
  // Active session metadata added by backend
  session_active?: boolean;
  active_session_id?: number | null;
  // Indicates the session for this class has already been ended today
  session_ended_today?: boolean;
}

interface Props {
  classItem: ClassItem;
  onView: (c: ClassItem) => void;
  onEdit: (c: ClassItem) => void;
  onStartSession: (classId: string) => void;
  onEndSession?: (classId: string) => void;
  onDelete?: (c: ClassItem) => void;
}

export default function ClassCard({
  classItem,
  onView,
  onEdit,
  onStartSession,
  onEndSession,
  onDelete,
}: Props) {
  return (
    <Card key={classItem.id} className="overflow-hidden h-full transition-shadow hover:shadow-lg">
      <CardContent className="p-3 sm:p-4 h-full flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start flex-1">
          {/* Left: title and meta */}
          <div className="col-span-1 sm:col-span-7 h-full flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-1">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
                  <IconChalkboard className="w-5 h-5" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold truncate">
                      {classItem.class_code ? `${classItem.class_code}` : `Class ${classItem.id}`}
                    </h3>
                    {/* live session indicator removed per UX request */}
                    <div className="text-sm text-muted-foreground truncate">{classItem.course_name ?? ''}</div>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  {classItem.program_name && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 rounded">{classItem.program_name}</Badge>
                  )}
                  {classItem.organization_name && <span className="text-xs text-muted-foreground">{classItem.organization_name}</span>}
                  {(classItem.academic_year || classItem.semester) && (
                    <span className="text-xs text-muted-foreground">{[classItem.academic_year, classItem.semester].filter(Boolean).join(' / ')}</span>
                  )}
                </div>

                {classItem.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{classItem.description}</p>
                )}
              </div>
            </div>
            {/* Primary action placed bottom-left for easy access */}
            {classItem.is_active && (
              <div className="mt-auto mb-3">
                {classItem.session_active ? (
                  <Button size="sm" className="w-full sm:w-auto flex items-center justify-center" disabled>
                    <Play className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Session active</span>
                  </Button>
                ) : classItem.session_ended_today ? (
                  <Button size="sm" className="w-full sm:w-auto flex items-center justify-center" disabled>
                    <Play className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Session Ended</span>
                  </Button>
                ) : (
                  <Button size="sm" className="w-full sm:w-auto flex items-center justify-center" onClick={() => onStartSession(classItem.id)}>
                    <Play className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Start Session</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Middle: schedules and room */}
          <div className="col-span-1 sm:col-span-3">
            <div className="mb-1 text-sm font-medium text-muted-foreground">Location</div>
            <div className="flex items-center gap-2 text-sm mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="truncate text-sm">{classItem.room ?? 'No room specified'}</span>
            </div>

            {/* On small screens show a single-line summary; on sm+ show up to 2 schedule items */}
            <div className="space-y-1 text-xs">
              {classItem.schedules && classItem.schedules.length > 0 ? (
                <>
                  <div className="sm:hidden text-xs text-muted-foreground">{classItem.schedules[0].type === 'normal' ? (classItem.schedules[0].day_of_week ?? '') : (classItem.schedules[0].date ?? '')} {formatTimeRange(classItem.schedules[0].start_time, classItem.schedules[0].end_time)}</div>
                  <div className="hidden sm:block">
                    {classItem.schedules.slice(0, 2).map((s) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <IconChalkboard className="w-4 h-4 text-muted-foreground" />
                        <div className="truncate">
                          <div className="font-medium">{s.type === 'normal' ? (s.day_of_week ?? '') : (s.date ?? '')}</div>
                          <div className="text-muted-foreground">{formatTimeRange(s.start_time, s.end_time)}{s.reason ? ` — ${s.reason}` : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">No schedule information</div>
              )}
            </div>
          </div>

          {/* Right: stats and actions */}
          <div className="col-span-1 sm:col-span-2 flex flex-col items-end gap-3 justify-between">
            <Badge
              variant="outline"
              className={
                classItem.status === 'Active'
                  ? 'border-green-200 text-green-700 bg-green-50'
                  : 'border-gray-200 text-gray-700 bg-gray-50'
              }
            >
              {classItem.status ?? 'Active'}
            </Badge>

            <div className="w-28 text-right">
              <div className="text-sm font-semibold">{(classItem.student_count ?? (classItem as any).enrolledStudents) ?? 0}</div>
              <div className="text-xs text-muted-foreground">students</div>
              <div className="mt-2 text-sm font-semibold">{(classItem.attendance_rate ?? (classItem as any).attendanceRate) ?? 0}%</div>
              <div className="text-xs text-muted-foreground">attendance</div>
            </div>

            {/* inline Edit removed — action available in dropdown */}

            <div className="mt-8">
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

                  {classItem.session_active ? (
                    <DropdownMenuItem
                      onClick={() => {
                        try {
                          if (typeof onEndSession === 'function') {
                            onEndSession(classItem.id);
                          } else if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('classes:end-session', { detail: { classId: classItem.id } }));
                          }
                        } catch (e) {}
                      }}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      End Session
                    </DropdownMenuItem>
                  ) : null}

                  {/* Enroll removed */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={() => onDelete && onDelete(classItem)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Class
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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

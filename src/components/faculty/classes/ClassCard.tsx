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
    <Card
      key={classItem.id}
      className="overflow-hidden transition-shadow hover:shadow-md"
    >
      <CardContent className="p-4">
        {/* Header: Code badge + actions */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="shrink-0">
              {classItem.class_code ?? `Class ${classItem.id}`}
            </Badge>
            <Badge
              variant="outline"
              className={
                classItem.status === "Active"
                  ? "border-green-200 text-green-700 bg-green-50 text-xs"
                  : "border-gray-200 text-gray-700 bg-gray-50 text-xs"
              }
            >
              {classItem.status ?? "Active"}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="shrink-0">
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
                      if (typeof onEndSession === "function") {
                        onEndSession(classItem.id);
                      } else if (typeof window !== "undefined") {
                        window.dispatchEvent(
                          new CustomEvent("classes:end-session", {
                            detail: { classId: classItem.id },
                          })
                        );
                      }
                    } catch (e) {}
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  End Session
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete && onDelete(classItem)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Class
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-semibold line-clamp-2 mb-1">
          {classItem.course_name ??
            classItem.class_code ??
            `Class ${classItem.id}`}
        </h3>
        {classItem.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {classItem.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
          {classItem.program_name && <span>{classItem.program_name}</span>}
          {classItem.organization_name && (
            <>
              <span>•</span>
              <span>{classItem.organization_name}</span>
            </>
          )}
          {(classItem.academic_year || classItem.semester) && (
            <>
              <span>•</span>
              <span>
                {[classItem.academic_year, classItem.semester]
                  .filter(Boolean)
                  .join(" / ")}
              </span>
            </>
          )}
        </div>

        {/* Schedule & Location */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{classItem.room ?? "No room specified"}</span>
          </div>
          {classItem.schedules && classItem.schedules.length > 0 && (
            <div className="ml-6 space-y-1">
              {classItem.schedules.slice(0, 2).map((s) => (
                <div key={s.id} className="text-xs text-muted-foreground">
                  <span className="font-medium">
                    {s.type === "normal" ? s.day_of_week ?? "" : s.date ?? ""}
                  </span>
                  {" • "}
                  {formatTimeRange(s.start_time, s.end_time)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex gap-6">
            <div>
              <div className="text-lg font-semibold">
                {classItem.student_count ??
                  (classItem as any).enrolledStudents ??
                  0}
              </div>
              <div className="text-xs text-muted-foreground">students</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {classItem.attendance_rate ??
                  (classItem as any).attendanceRate ??
                  0}
                %
              </div>
              <div className="text-xs text-muted-foreground">attendance</div>
            </div>
          </div>

          {/* Action button */}
          {classItem.is_active && (
            <div>
              {classItem.session_active ? (
                <Badge className="bg-red-50 text-red-600">Session Live</Badge>
              ) : classItem.session_ended_today ? (
                <Button size="sm" disabled>
                  <Play className="w-4 h-4 mr-2" />
                  Ended
                </Button>
              ) : (
                <Button size="sm" onClick={() => onStartSession(classItem.id)}>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimeRange(start?: string | null, end?: string | null) {
  const s = start ? start.slice(0, 5) : "";
  const e = end ? end.slice(0, 5) : "";
  if (s && e) return `${s}-${e}`;
  if (s) return s;
  return "";
}

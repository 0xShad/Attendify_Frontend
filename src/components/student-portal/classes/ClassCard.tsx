"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Eye, UserCheck, Trash2, Clock, Calendar } from "lucide-react";

export default function ClassCard({
  classItem,
  onViewDetails,
  onViewAttendanceHistory,
  onDropClass,
}: {
  classItem: any; // follows backend shape ClassWithSchedules
  onViewDetails?: (c: any) => void;
  onViewAttendanceHistory?: (c: any) => void;
  onDropClass?: (id: string) => void;
}) {
  // Safe helpers
  const studentsText = typeof classItem.students_count === "number" ? `${classItem.students_count} students` : "-";
  const rate = typeof classItem.own_attendance_rate === "number" ? classItem.own_attendance_rate : classItem.attendance_rate ?? 0;
  const rateRounded = Math.round(rate * 100) / 100;

  return (
    <Card key={classItem.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{classItem.class_code ?? classItem.course_code ?? ""}</Badge>
              <div className="text-muted-foreground text-xs">{classItem.program_name ?? classItem.organization_name ?? ""}</div>
            </div>
            <CardTitle className="text-lg line-clamp-2 mt-1">{classItem.course_name ?? classItem.class_code ?? `Class ${classItem.id}`}</CardTitle>
            <CardDescription className="mt-1 text-sm">{classItem.description ?? ""}</CardDescription>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-sm font-medium">{studentsText}</div>
            {classItem.session_active ? (
              <Badge className="bg-red-50 text-red-600">Session Live</Badge>
            ) : classItem.is_active ? (
              <Badge className="bg-green-50 text-green-700">Active</Badge>
            ) : (
              <Badge className="bg-muted/10">Inactive</Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails && onViewDetails(classItem)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewAttendanceHistory && onViewAttendanceHistory(classItem)}>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Attendance History
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => onDropClass && onDropClass(classItem.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Drop Class
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                {classItem.next_schedule ? (
                  <div className="text-sm">
                    <div className="font-medium">{classItem.next_schedule.day_of_week ?? classItem.next_schedule.date}</div>
                    <div className="text-xs text-muted-foreground">{(classItem.next_schedule.start_time ?? "").slice(0,5)} - {(classItem.next_schedule.end_time ?? "").slice(0,5)}</div>
                  </div>
                ) : (
                  <div className="text-sm">Next: {classItem.room ?? "TBA"}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{classItem.room ?? classItem.next_schedule?.location ?? ""}</span>
            </div>
          </div>

          <div className="space-y-2">
            {/* session summary removed from here — attendance bar is in the footer */}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="w-full">
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="font-medium">Attendance</span>
                <span className="text-xs text-muted-foreground">{typeof classItem.session_completed === 'number' ? `${classItem.session_completed}/${classItem.session_total ?? 0}` : "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>
                  {classItem.session_insight ?? (rateRounded >= 100 ? "Perfect" : rateRounded >= 90 ? "Excellent" : rateRounded >= 80 ? "Good" : rateRounded >= 70 ? "Below Average" : rateRounded >= 50 ? "Critical" : "Critical")}
                </Badge>
                <span>{rateRounded}%</span>
              </div>
            </div>
            <div className="mt-1">
              <Progress value={rateRounded} className="h-2" />
            </div>
          </div>

          <div>
            <Button onClick={() => onViewAttendanceHistory && onViewAttendanceHistory(classItem)} className="w-full">
              <UserCheck className="w-4 h-4 mr-2" />
              Attendance
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>

  );
}


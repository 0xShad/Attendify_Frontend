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
import { IconChalkboard } from "@tabler/icons-react";

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
            <h4 className="font-semibold text-base truncate">{classItem.name}</h4>
            <p className="text-sm text-muted-foreground">
              {classItem.code} • {classItem.mode}
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
              {classItem.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    onView(classItem);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onEdit(classItem);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Class
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onEnroll(classItem);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Enroll Student
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStartSession(classItem.id)}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </DropdownMenuItem>
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
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{classItem.schedule}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{classItem.enrolledStudents} students</span>
          </div>
          {classItem.location && (
            <div className="flex items-center gap-2 col-span-2">
              <IconChalkboard className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{classItem.location}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span />
            <span className="font-medium">Attendance: {classItem.attendanceRate}%</span>
          </div>

          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => onStartSession(classItem.id)} className="flex-1">
              <Play className="w-3 h-3 mr-1" />
              Start Session
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(classItem)}
            >
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
// Progress not used in this component
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
import ClassCard, { ClassItem } from "./ClassCard";

interface Props {
  classes: ClassItem[];
  setAddClassOpen: (open: boolean) => void;
  setSelectedClass: (c: ClassItem | null) => void;
  setViewClassOpen: (open: boolean) => void;
  setEditClassOpen: (open: boolean) => void;
  handleStartSession: (classId: string) => void;
  onDelete?: (c: ClassItem) => void;
}

export default function MyClasses({
  classes,
  setAddClassOpen,
  setSelectedClass,
  setViewClassOpen,
  setEditClassOpen,
  handleStartSession,
  onDelete,
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
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
            // enroll feature removed
            onStartSession={handleStartSession}
            onDelete={(c) => onDelete?.(c)}
          />
        ))}
      </div>
    </div>
  );
}

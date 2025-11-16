"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CheckCircle, MoreVertical, Eye, Send, Trash2 } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface Props {
  student: Student;
  isPresent?: boolean;
  onToggle?: (id: string) => void;
  onView?: (student: Student) => void;
  onRemove?: (id: string) => void;
}

export default function StudentRow({ student, isPresent = false, onToggle, onView, onRemove }: Props) {
  return (
    <div key={student.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isPresent ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="w-8 h-8 shrink-0"><AvatarFallback className="text-xs">{student.avatar || student.name?.[0]}</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{student.name}</div>
          <div className="text-xs text-muted-foreground truncate">{student.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={isPresent ? "default" : "secondary"} className={isPresent ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>{isPresent ? "Present" : "Absent"}</Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm"><MoreVertical className="w-3 h-3" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggle?.(student.id)}>
              <CheckCircle className="w-3 h-3 mr-2" />
              {isPresent ? "Mark Absent" : "Mark Present"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onView?.(student)}>
              <Eye className="w-3 h-3 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Send className="w-3 h-3 mr-2" />
              Send Message
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => onRemove?.(student.id)}>
              <Trash2 className="w-3 h-3 mr-2" />
              Remove from Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

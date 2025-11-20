"use client";
import React, { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, MoreVertical, Eye, UserCheck, Trash2, Clock, Calendar, BookOpen as BookOpenIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { getModeIcon, getModeColor, getNextSessionTime } from "@/components/student-portal/utils";
import ClassCard from "./ClassCard";

export default function StudentClasses({
  children,
  enrolledClasses,
  activeSessions,
  onStartAttendance,
  onViewDetails,
  onViewAttendanceHistory,
  onDropClass,
}: {
  children?: React.ReactNode;
  enrolledClasses?: any[];
  activeSessions?: any[];
  onStartAttendance?: (session: any, mode: "face" | "online") => void;
  onViewDetails?: (cls: any) => void;
  onViewAttendanceHistory?: (cls: any) => void;
  onDropClass?: (id: string) => void;
}) {
  const [joinClassOpen, setJoinClassOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debug: log props to ensure data is received from parent
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug("[StudentClasses] props enrolledClasses:", enrolledClasses);
  }

  const handleJoinClass = async (classCode: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setJoinClassOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header is provided by the page; avoid duplicating it here. */}

      {/* Enrolled classes list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {(enrolledClasses || []).map((classItem) => (
          <ClassCard
            key={classItem.id}
            classItem={classItem}
            onViewDetails={(c) => onViewDetails && onViewDetails(c)}
            onViewAttendanceHistory={(c) => onViewAttendanceHistory && onViewAttendanceHistory(c)}
            onDropClass={(id) => onDropClass && onDropClass(id)}
          />
        ))}
      </div>

      {children}
    </div>
  );
}

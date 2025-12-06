"use client";

import React from "react";
import { IconBooks, IconSchool, IconHash, IconClock, IconCalendar, IconDots, IconEye, IconEdit, IconTrash } from "@tabler/icons-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import type { Course } from "./types";

interface Props {
  courses: Course[];
  visibleColumns?: Record<string, boolean>;
  onView: (c: Course) => void;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
}

export default function CoursesTable({ courses, visibleColumns, onView, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 sticky top-0 z-10">
          <TableRow className="border-b-primary/20">
            {visibleColumns?.code !== false && <TableHead className="text-primary font-medium">Course Code</TableHead>}
            {visibleColumns?.name !== false && <TableHead className="text-primary font-medium">Course Name</TableHead>}
            {visibleColumns?.program !== false && <TableHead className="text-primary font-medium">Program</TableHead>}
            {visibleColumns?.school !== false && <TableHead className="text-primary font-medium">School</TableHead>}
            {visibleColumns?.classes !== false && <TableHead className="text-primary font-medium">Classes</TableHead>}
            <TableHead className="text-primary font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id} className="hover:bg-stone-50/50 transition-colors border-stone-200/50">
              {visibleColumns?.code !== false && (
                <TableCell>
                  <Badge variant="outline" className="font-mono font-semibold">{course.code}</Badge>
                </TableCell>
              )}

              {visibleColumns?.name !== false && (
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{course.name}</div>
                    {course.description && <div className="text-sm text-muted-foreground line-clamp-1 mt-1">{course.description}</div>}
                  </div>
                </TableCell>
              )}

              {visibleColumns?.program !== false && (
                <TableCell>
                  <div>
                    <div className="font-medium">{course.program_name ?? '-'}</div>
                    <div className="text-sm font-mono text-muted-foreground mt-1">{course.program_code ?? '-'}</div>
                  </div>
                </TableCell>
              )}

              {visibleColumns?.school !== false && (
                <TableCell>
                  <div className="font-medium">{course.school_name ?? (course as any).organization_name ?? '-'}</div>
                </TableCell>
              )}

              {visibleColumns?.classes !== false && (
                <TableCell>
                  <div className="text-sm">{typeof course.classes_count === 'number' ? course.classes_count : '-'}</div>
                </TableCell>
              )}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8" size="icon">
                      <IconDots className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={() => onView(course)}>
                      <IconEye className="w-4 h-4 mr-2" /> View Course
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(course)}>
                      <IconEdit className="w-4 h-4 mr-2" /> Edit Course
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(course)} className="text-destructive focus:text-destructive">
                      <IconTrash className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

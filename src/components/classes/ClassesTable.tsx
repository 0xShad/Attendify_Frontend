"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconDots, IconEye, IconEdit, IconTrash } from "@tabler/icons-react";
import type { Class } from "./types";

interface Props {
  classes: Class[];
  visibleColumns?: Record<string, boolean>;
  onView: (c: Class) => void;
  onEdit: (c: Class) => void;
  onDelete: (c: Class) => void;
}

export default function ClassesTable({ classes, visibleColumns, onView, onEdit, onDelete }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el || !isDraggingRef.current) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - startXRef.current;
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const endDrag = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.touches[0].pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el || !isDraggingRef.current) return;
    const x = e.touches[0].pageX - el.offsetLeft;
    const walk = x - startXRef.current;
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto ${isDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={endDrag}
    >
      <Table className="min-w-max">
        <TableHeader>
          <TableRow>
            {visibleColumns?.class_code !== false && <TableHead>Class Code</TableHead>}
            {visibleColumns?.course_code !== false && <TableHead>Course</TableHead>}
            {visibleColumns?.name !== false && <TableHead>Course Name</TableHead>}
            {visibleColumns?.program !== false && <TableHead>Program</TableHead>}
            {visibleColumns?.organization !== false && <TableHead>Organization</TableHead>}
            {visibleColumns?.room !== false && <TableHead>Room</TableHead>}
            {visibleColumns?.academic_year !== false && <TableHead>Academic Year</TableHead>}
            {visibleColumns?.semester !== false && <TableHead>Semester</TableHead>}
            {visibleColumns?.instructor !== false && <TableHead>Instructor</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((c) => (
            <TableRow key={c.id}>
              {visibleColumns?.class_code !== false && (
                <TableCell className="font-mono">{c.class_code ?? (c.code ? `${c.code}` : `#${c.id}`)}</TableCell>
              )}
              {visibleColumns?.course_code !== false && (
                <TableCell className="font-mono">{c.course_code ?? (c.course_id ? `${c.course_id}` : '-')}</TableCell>
              )}
              {visibleColumns?.name !== false && <TableCell>{c.course_name ?? '-'}</TableCell>}
              {visibleColumns?.program !== false && <TableCell>{c.program_name ?? '-'}</TableCell>}
              {visibleColumns?.organization !== false && <TableCell>{c.organization_name ?? '-'}</TableCell>}
              {visibleColumns?.room !== false && <TableCell>{c.room ?? '-'}</TableCell>}
              {visibleColumns?.academic_year !== false && <TableCell>{c.academic_year ?? '-'}</TableCell>}
              {visibleColumns?.semester !== false && <TableCell>{c.semester ?? '-'}</TableCell>}
              {visibleColumns?.instructor !== false && <TableCell>{c.assigned_faculty_name ?? (c.assigned_faculty_id ? `Faculty #${c.assigned_faculty_id}` : '-')}</TableCell>}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <IconDots className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(c)}><IconEye className="w-4 h-4 mr-2"/> View</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(c)}><IconEdit className="w-4 h-4 mr-2"/> Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(c)} className="text-destructive"><IconTrash className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
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

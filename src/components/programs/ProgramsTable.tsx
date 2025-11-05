"use client";

import React from "react";
import {
  IconSchool,
  IconEye,
  IconEdit,
  IconTrash,
  IconDots,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Program } from "./types";

interface ProgramsTableProps {
  programs: Program[];
  onView: (program: Program) => void;
  onEdit: (program: Program) => void;
  onDelete: (program: Program) => void;
}

export function ProgramsTable({
  programs,
  onView,
  onEdit,
  onDelete,
}: ProgramsTableProps) {
  return (
    <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <IconSchool className="h-5 w-5" />
          Programs ({programs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 sticky top-0 z-10">
              <TableRow className="border-b-primary/20">
                <TableHead className="text-primary font-medium">
                  Program Name
                </TableHead>
                <TableHead className="text-primary font-medium">Code</TableHead>
                <TableHead className="text-primary font-medium">
                  School
                </TableHead>
                <TableHead className="text-primary font-medium">
                  Students
                </TableHead>
                <TableHead className="text-primary font-medium">
                  Courses
                </TableHead>
                <TableHead className="text-primary font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow
                  key={program.id}
                  className="hover:bg-stone-50/50 transition-colors border-stone-200/50"
                >
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{program.name}</div>
                      {program.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {program.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {program.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconSchool className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-1">{program.organization || "No organization"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{program.totalStudents}</div>
                      <div className="text-xs text-muted-foreground">
                        enrolled
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{program.totalCourses}</div>
                      <div className="text-xs text-muted-foreground">
                        courses
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                          size="icon"
                        >
                          <IconDots className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => onView(program)}>
                          <IconEye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(program)}>
                          <IconEdit className="w-4 h-4 mr-2" />
                          Edit Program
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(program)}
                          className="text-destructive focus:text-destructive"
                        >
                          <IconTrash className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

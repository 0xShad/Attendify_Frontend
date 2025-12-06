"use client";

import React from "react";
import { IconLayoutColumns, IconChevronDown } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  visible: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
}

export function ClassesColumnCustomizer({ visible, onToggle }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconLayoutColumns className="h-4 w-4" />
          <span className="hidden lg:inline">Customize Columns</span>
          <IconChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
  <DropdownMenuCheckboxItem checked={!!visible.class_code} onCheckedChange={(v) => onToggle('class_code', !!v)}>Class Code</DropdownMenuCheckboxItem>
  <DropdownMenuCheckboxItem checked={!!visible.course_code} onCheckedChange={(v) => onToggle('course_code', !!v)}>Course Code</DropdownMenuCheckboxItem>
  <DropdownMenuCheckboxItem checked={!!visible.name} onCheckedChange={(v) => onToggle('name', !!v)}>Course Name</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!visible.program} onCheckedChange={(v) => onToggle('program', !!v)}>Program</DropdownMenuCheckboxItem>
  <DropdownMenuCheckboxItem checked={!!visible.organization} onCheckedChange={(v) => onToggle('organization', !!v)}>Organization</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!visible.room} onCheckedChange={(v) => onToggle('room', !!v)}>Room</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!visible.academic_year} onCheckedChange={(v) => onToggle('academic_year', !!v)}>Academic Year</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!visible.semester} onCheckedChange={(v) => onToggle('semester', !!v)}>Semester</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!visible.instructor} onCheckedChange={(v) => onToggle('instructor', !!v)}>Instructor</DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ClassesColumnCustomizer;

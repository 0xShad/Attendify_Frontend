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

export function CoursesColumnCustomizer({ visible, onToggle }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconLayoutColumns className="h-4 w-4" />
          <span className="hidden lg:inline">Customize Columns</span>
          <span className="lg:hidden">Columns</span>
          <IconChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuCheckboxItem checked={!!visible.code} onCheckedChange={(v) => onToggle('code', !!v)}>Course Code</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!visible.name} onCheckedChange={(v) => onToggle('name', !!v)}>Course Name</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!visible.program} onCheckedChange={(v) => onToggle('program', !!v)}>Program</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!visible.school} onCheckedChange={(v) => onToggle('school', !!v)}>School</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!visible.classes} onCheckedChange={(v) => onToggle('classes', !!v)}>Classes</DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CoursesColumnCustomizer;

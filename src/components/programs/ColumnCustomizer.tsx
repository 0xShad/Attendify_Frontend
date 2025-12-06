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

export function ColumnCustomizer() {
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
        <DropdownMenuCheckboxItem checked={true}>
          Program Name
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={true}>
          Code
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={true}>
          School
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={true}>
          Students
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={true}>
          Courses
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

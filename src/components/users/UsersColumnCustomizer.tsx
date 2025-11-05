"use client";

import React from "react";
import { IconChevronDown, IconLayoutColumns } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Table } from "@tanstack/react-table";
import type { User } from "./types";

interface UsersColumnCustomizerProps {
  table: Table<User>;
}

export function UsersColumnCustomizer({ table }: UsersColumnCustomizerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconLayoutColumns />
          <span className="hidden lg:inline">Customize Columns</span>
          <span className="lg:hidden">Columns</span>
          <IconChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {table
          .getAllColumns()
          // Show all columns that can be hidden. accessorFn check excluded so
          // accessorKey-based columns appear in the customizer as well.
          .filter((column) => column.getCanHide())
          .map((column) => {
            // Prefer the human-readable header if available, otherwise fall back to id
            const label = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {String(label)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



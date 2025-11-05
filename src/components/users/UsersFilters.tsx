"use client";

import React from "react";
import { IconFilter } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface UsersFilterValues {
  role?: string;
  status?: string;
}

interface UsersFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: UsersFilterValues;
  onFiltersChange: (filters: UsersFilterValues) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

const ROLE_OPTIONS = ["Admin", "Faculty", "Student"];
const STATUS_OPTIONS = ["Active", "Inactive"];

export function UsersFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onClearFilters,
  onApplyFilters,
}: UsersFiltersProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <IconFilter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-6 pb-6">
        <DrawerHeader className="px-0">
          <DrawerTitle>Filter Users</DrawerTitle>
          <DrawerDescription>Filter by role and status</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Role</Label>
            <Select
              value={filters.role ?? "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, role: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select
              value={filters.status ?? "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DrawerFooter className="px-0 pt-4">
          <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
            <Button variant="outline" className="flex-1" onClick={onClearFilters}>
              Clear Filters
            </Button>
            <DrawerClose asChild>
              <Button className="flex-1" onClick={onApplyFilters}>
                Apply Filters
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}



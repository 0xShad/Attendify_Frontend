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
import { Input } from "@/components/ui/input";

export interface FilterValues {
  min_programs?: number;
  max_programs?: number;
  min_courses?: number;
  max_courses?: number;
  min_students?: number;
  max_students?: number;
  min_faculty?: number;
  max_faculty?: number;
}

interface SchoolFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

export function SchoolFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onClearFilters,
  onApplyFilters,
}: SchoolFiltersProps) {
  const handleNumberChange = (field: keyof FilterValues, value: string) => {
    const numValue = value === "" ? undefined : parseInt(value, 10);
    onFiltersChange({ ...filters, [field]: numValue });
  };

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
          <DrawerTitle>Filter Schools</DrawerTitle>
          <DrawerDescription>
            Filter schools by programs, courses, students, and faculty counts
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Programs Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Programs Count</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min-programs" className="text-xs text-muted-foreground">
                  Min
                </Label>
                <Input
                  id="min-programs"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filters.min_programs ?? ""}
                  onChange={(e) => handleNumberChange("min_programs", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="max-programs" className="text-xs text-muted-foreground">
                  Max
                </Label>
                <Input
                  id="max-programs"
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={filters.max_programs ?? ""}
                  onChange={(e) => handleNumberChange("max_programs", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Courses Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Courses Count</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min-courses" className="text-xs text-muted-foreground">
                  Min
                </Label>
                <Input
                  id="min-courses"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filters.min_courses ?? ""}
                  onChange={(e) => handleNumberChange("min_courses", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="max-courses" className="text-xs text-muted-foreground">
                  Max
                </Label>
                <Input
                  id="max-courses"
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={filters.max_courses ?? ""}
                  onChange={(e) => handleNumberChange("max_courses", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Students Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Students Count</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min-students" className="text-xs text-muted-foreground">
                  Min
                </Label>
                <Input
                  id="min-students"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filters.min_students ?? ""}
                  onChange={(e) => handleNumberChange("min_students", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="max-students" className="text-xs text-muted-foreground">
                  Max
                </Label>
                <Input
                  id="max-students"
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={filters.max_students ?? ""}
                  onChange={(e) => handleNumberChange("max_students", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Faculty Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Faculty Count</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min-faculty" className="text-xs text-muted-foreground">
                  Min
                </Label>
                <Input
                  id="min-faculty"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filters.min_faculty ?? ""}
                  onChange={(e) => handleNumberChange("min_faculty", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="max-faculty" className="text-xs text-muted-foreground">
                  Max
                </Label>
                <Input
                  id="max-faculty"
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={filters.max_faculty ?? ""}
                  onChange={(e) => handleNumberChange("max_faculty", e.target.value)}
                />
              </div>
            </div>
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

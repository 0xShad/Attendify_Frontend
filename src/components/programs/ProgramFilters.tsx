"use client";

import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { programsAPI, type SchoolOption } from "@/lib/api/programs";

export interface FilterValues {
  code?: string;
  school?: string;
  school_id?: number;
  min_students?: number;
  max_students?: number;
  min_courses?: number;
  max_courses?: number;
}

interface ProgramFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

export function ProgramFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onClearFilters,
  onApplyFilters,
}: ProgramFiltersProps) {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch options when drawer opens
  useEffect(() => {
    if (open && schools.length === 0 && codes.length === 0) {
      fetchOptions();
    }
  }, [open]);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const [schoolsData, codesData] = await Promise.all([
        programsAPI.getSchoolOptions(),
        programsAPI.getProgramCodes(),
      ]);
      setSchools(schoolsData);
      setCodes(codesData);
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange = (field: keyof FilterValues, value: string) => {
    const numValue = value === "" ? undefined : parseInt(value, 10);
    onFiltersChange({ ...filters, [field]: numValue });
  };

  const handleSelectChange = (field: keyof FilterValues, value: string) => {
    onFiltersChange({ ...filters, [field]: value === "all" ? undefined : value });
  };

  const handleSchoolChange = async (value: string) => {
    if (value === "all") {
      // Clear school filter and reset to all codes
      onFiltersChange({ ...filters, school: undefined, school_id: undefined, code: undefined });
      try {
        const allCodes = await programsAPI.getProgramCodes();
        setCodes(allCodes);
      } catch (error) {
        console.error("Failed to fetch all codes:", error);
      }
    } else {
      // Find selected school
      const selectedSchool = schools.find(s => s.name === value);
      if (selectedSchool) {
        // Update school filter and clear code
        onFiltersChange({ ...filters, school: value, school_id: selectedSchool.id, code: undefined });
        // Fetch codes for this school
        try {
          const schoolCodes = await programsAPI.getProgramCodesBySchool(selectedSchool.id);
          setCodes(schoolCodes);
        } catch (error) {
          console.error("Failed to fetch school codes:", error);
        }
      }
    }
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
          <DrawerTitle>Filter Programs</DrawerTitle>
          <DrawerDescription>
            Filter programs by code, school, students, and courses
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* School Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">School</Label>
            <Select
              value={filters.school ?? "all"}
              onValueChange={handleSchoolChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading..." : "All Schools"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.name}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Code Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Program Code</Label>
            <Select
              value={filters.code ?? "all"}
              onValueChange={(value) => handleSelectChange("code", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading..." : "All Codes"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Codes</SelectItem>
                {codes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

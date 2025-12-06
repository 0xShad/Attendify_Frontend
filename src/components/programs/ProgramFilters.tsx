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
import { programsAPI, type OrganizationOption } from "@/lib/api/programs";

export interface FilterValues {
  code?: string;
  organization_id?: number;
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
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch options when drawer opens
  useEffect(() => {
    if (open && organizations.length === 0 && codes.length === 0) {
      fetchOptions();
    }
  }, [open]);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const [organizationsData, codesData] = await Promise.all([
        programsAPI.getOrganizationOptions(),
        programsAPI.getProgramCodes(),
      ]);
      setOrganizations(organizationsData);
      // Normalize codes to an array of non-empty unique strings. The backend
      // may return either strings or objects like { id, code }.
      const normalize = (arr: any[]): string[] => {
        if (!Array.isArray(arr)) return [];
        const mapped = arr
          .map((v) => (typeof v === 'string' ? v : (v && (v.code ?? v.value ?? String(v)))) )
          .map((s) => (s == null ? '' : String(s).trim()))
          .filter(Boolean);
        return Array.from(new Set(mapped));
      };
      setCodes(normalize(codesData as any[]));
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

  const handleOrganizationChange = async (value: string) => {
    if (value === "all") {
      // Clear organization filter and reset to all codes
      onFiltersChange({ ...filters, organization_id: undefined, code: undefined });
      try {
        const allCodes = await programsAPI.getProgramCodes();
        setCodes(allCodes);
      } catch (error) {
        console.error("Failed to fetch all codes:", error);
      }
    } else {
      // Find selected organization
      const selectedOrganization = organizations.find(o => o.id.toString() === value);
      if (selectedOrganization) {
        // Update organization filter and clear code
        onFiltersChange({ ...filters, organization_id: selectedOrganization.id, code: undefined });
        // Fetch codes for this organization
        try {
          const organizationCodes = await programsAPI.getProgramCodesByOrganization(selectedOrganization.id);
          // API returns [{id, code}, ...] for organization-specific codes; normalize to string[] and filter empties
          const mapped = Array.isArray(organizationCodes)
            ? (organizationCodes as any[]).map((c) => String(c.code)).filter(Boolean)
            : [];
          setCodes(mapped);
        } catch (error) {
          console.error("Failed to fetch organization codes:", error);
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
            Filter programs by code, organization, students, and courses
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Organization Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Organization</Label>
            <Select
              value={filters.organization_id?.toString() ?? "all"}
              onValueChange={handleOrganizationChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading..." : "All Organizations"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
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

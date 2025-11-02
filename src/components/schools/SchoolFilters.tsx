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

interface SchoolFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: string;
  locationFilter: string;
  onStatusFilterChange: (value: string) => void;
  onLocationFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function SchoolFilters({
  open,
  onOpenChange,
  statusFilter,
  locationFilter,
  onStatusFilterChange,
  onLocationFilterChange,
  onClearFilters,
}: SchoolFiltersProps) {
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
            Configure filters to refine the schools display
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-sm font-medium">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger id="status-filter" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-filter" className="text-sm font-medium">
              Location
            </Label>
            <Select value={locationFilter} onValueChange={onLocationFilterChange}>
              <SelectTrigger id="location-filter" className="w-full">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Quezon City">Quezon City</SelectItem>
                <SelectItem value="Lagro">Lagro</SelectItem>
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
              <Button className="flex-1">Apply Filters</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

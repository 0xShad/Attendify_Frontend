"use client";

import React from "react";
import { IconPlus } from "@tabler/icons-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrganizationOption } from "@/lib/api/programs";

interface ProgramFormData {
  code: string;
  name: string;
  description: string;
  organization_id: number | null;
}

interface AddProgramDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ProgramFormData;
  onFormDataChange: (data: ProgramFormData) => void;
  onSubmit: () => void;
  organizations: OrganizationOption[];
}

export function AddProgramDrawer({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  organizations,
}: AddProgramDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button size="sm">
          <IconPlus className="h-4 w-4 mr-2" />
          Add New Program
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-6 pb-6 max-h-[90vh]">
        <DrawerHeader className="px-0">
          <DrawerTitle>Add New Program</DrawerTitle>
          <DrawerDescription>Create a new academic program</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="organization">
              Organization <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.organization_id?.toString() || ""}
              onValueChange={(value) =>
                onFormDataChange({ ...formData, organization_id: value ? parseInt(value) : null })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="program-code">
              Program Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="program-code"
              value={formData.code}
              onChange={(e) =>
                onFormDataChange({ ...formData, code: e.target.value })
              }
              placeholder="e.g., BSCS"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="program-name">
              Program Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="program-name"
              value={formData.name}
              onChange={(e) =>
                onFormDataChange({ ...formData, name: e.target.value })
              }
              placeholder="Enter program name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                onFormDataChange({ ...formData, description: e.target.value })
              }
              placeholder="Enter program description (optional)"
              rows={4}
            />
          </div>
        </div>
        <DrawerFooter className="px-0 pt-4">
          <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DrawerClose>
            <Button className="flex-1" onClick={onSubmit}>
              Add Program
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

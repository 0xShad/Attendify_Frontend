"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SchoolFormData } from "./types";

interface EditSchoolDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: SchoolFormData;
  onFormDataChange: (data: SchoolFormData) => void;
  onSubmit: () => void;
}

export function EditSchoolDrawer({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
}: EditSchoolDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Edit School</DrawerTitle>
          <DrawerDescription>
            Update school information and details
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              School Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) =>
                onFormDataChange({ ...formData, name: e.target.value })
              }
              placeholder="Enter school name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Address</Label>
            <Textarea
              id="edit-address"
              value={formData.address}
              onChange={(e) =>
                onFormDataChange({ ...formData, address: e.target.value })
              }
              placeholder="Enter full address"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) =>
                onFormDataChange({ ...formData, description: e.target.value })
              }
              placeholder="Enter school description"
              rows={3}
            />
          </div>
        </div>
        <DrawerFooter>
          <div className="flex gap-3 max-w-md mx-auto w-full">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DrawerClose>
            <Button onClick={onSubmit} className="flex-1">
              Save Changes
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

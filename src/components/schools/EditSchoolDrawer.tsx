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

          {/* Academic Data Section */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Academic Information</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-accreditation">Accreditation</Label>
                <Input
                  id="edit-accreditation"
                  value={formData.accreditation || ""}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, accreditation: e.target.value })
                  }
                  placeholder="e.g., CHED, DEPED"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-establishedYear">Established Year</Label>
                <Input
                  id="edit-establishedYear"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.establishedYear || ""}
                  onChange={(e) =>
                    onFormDataChange({ 
                      ...formData, 
                      establishedYear: e.target.value ? parseInt(e.target.value) : undefined 
                    })
                  }
                  placeholder="e.g., 1995"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-principalName">Principal Name</Label>
                <Input
                  id="edit-principalName"
                  value={formData.principalName || ""}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, principalName: e.target.value })
                  }
                  placeholder="Enter principal's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-academicLevel">Academic Level</Label>
                <Input
                  id="edit-academicLevel"
                  value={formData.academicLevel || ""}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, academicLevel: e.target.value })
                  }
                  placeholder="e.g., College, High School"
                />
              </div>
            </div>
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

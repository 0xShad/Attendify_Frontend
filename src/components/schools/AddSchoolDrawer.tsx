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
import type { SchoolFormData } from "./types";

interface AddSchoolDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: SchoolFormData;
  onFormDataChange: (data: SchoolFormData) => void;
  onSubmit: () => void;
}

export function AddSchoolDrawer({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
}: AddSchoolDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button size="sm">
          <IconPlus className="h-4 w-4 mr-2" />
          Add New School
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-6 pb-6">
        <DrawerHeader className="px-0">
          <DrawerTitle>Add New School</DrawerTitle>
          <DrawerDescription>
            Create a new school in the Attendify system
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="name">
              School Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                onFormDataChange({ ...formData, name: e.target.value })
              }
              placeholder="Enter school name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                onFormDataChange({ ...formData, address: e.target.value })
              }
              placeholder="Enter full address"
              rows={2}
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
              placeholder="Enter school description"
              rows={3}
            />
          </div>

          {/* Academic Data Section */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Academic Information</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accreditation">Accreditation</Label>
                <Input
                  id="accreditation"
                  value={formData.accreditation || ""}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, accreditation: e.target.value })
                  }
                  placeholder="e.g., CHED, DEPED"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="establishedYear">Established Year</Label>
                <Input
                  id="establishedYear"
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
                <Label htmlFor="principalName">Principal Name</Label>
                <Input
                  id="principalName"
                  value={formData.principalName || ""}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, principalName: e.target.value })
                  }
                  placeholder="Enter principal's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academicLevel">Academic Level</Label>
                <Input
                  id="academicLevel"
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
        <DrawerFooter className="px-0 pt-4">
          <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DrawerClose>
            <Button onClick={onSubmit} className="flex-1">
              Add School
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

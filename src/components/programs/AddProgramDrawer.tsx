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
import { getProgramCodesByOrganization } from "@/lib/api/programs";

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
  const [programCodes, setProgramCodes] = React.useState<Array<{ id: number; code: string }>>([]);
  const [codesLoading, setCodesLoading] = React.useState(false);
  const [codesError, setCodesError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const orgId = formData.organization_id;
    if (!orgId) {
      setProgramCodes([]);
      setCodesError(null);
      return;
    }

    setCodesLoading(true);
    setCodesError(null);
    getProgramCodesByOrganization(orgId)
      .then((res: any) => {
        if (!mounted) return;
        // Normalize: backend returns [{ id, code }, ...]
        setProgramCodes(Array.isArray(res) ? res : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setCodesError(err instanceof Error ? err.message : String(err));
        setProgramCodes([]);
      })
      .finally(() => {
        if (!mounted) return;
        setCodesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [formData.organization_id]);
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
            <Select
              value={formData.code || ""}
              onValueChange={(value) => onFormDataChange({ ...formData, code: value })}
              disabled={!formData.organization_id || codesLoading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={codesLoading ? "Loading codes..." : "Select program code"} />
              </SelectTrigger>
              <SelectContent>
                {programCodes.length > 0 ? (
                  programCodes.map((c) => (
                    <SelectItem key={c.id} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))
                ) : (
                  // Radix Select requires non-empty value on SelectItem; use a
                  // sentinel non-empty value for the disabled placeholder so
                  // the component doesn't throw. The Select's value remains
                  // empty when no selection has been made so the placeholder
                  // will be shown.
                  <SelectItem value="__no_codes" disabled>
                    {formData.organization_id ? (codesLoading ? "Loading..." : "No codes found") : "Select organization first"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {codesError && <div className="text-sm text-destructive mt-1">{codesError}</div>}
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

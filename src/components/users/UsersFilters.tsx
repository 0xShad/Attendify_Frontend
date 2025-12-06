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
import { IconCalendar } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { profilesAPI } from "@/lib/api/profiles";

export interface UsersFilterValues {
  type?: string;
  role?: string;
  organization?: string;
  created_from?: string; // ISO date string yyyy-mm-dd
  created_to?: string;
  last_active_from?: string;
  last_active_to?: string;
}

interface UsersFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: UsersFilterValues;
  onFiltersChange: (filters: UsersFilterValues) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

const TYPE_OPTIONS = ["System", "Academic", "Business"];
// Role and Organization lists - roles will be loaded from the API on mount.
const DEFAULT_ROLE_OPTIONS = ["Admin", "Faculty", "Student"]; // placeholder until API returns
const ORG_OPTIONS = ["Attendify"]; // Attendify + dynamic orgs later
// Status removed from filter UI per request

export function UsersFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onClearFilters,
  onApplyFilters,
}: UsersFiltersProps) {
  const createdFromRef = React.useRef<HTMLInputElement | null>(null);
  const createdToRef = React.useRef<HTMLInputElement | null>(null);
  const lastFromRef = React.useRef<HTMLInputElement | null>(null);
  const lastToRef = React.useRef<HTMLInputElement | null>(null);
  const [roleOptions, setRoleOptions] = React.useState<string[]>(DEFAULT_ROLE_OPTIONS);
  const [rolesLoading, setRolesLoading] = React.useState(false);
  const [orgOptions, setOrgOptions] = React.useState<string[]>(ORG_OPTIONS);
  const [orgsLoading, setOrgsLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setRolesLoading(true);
    profilesAPI
      .listRoles()
      .then((list) => {
        if (!mounted || !Array.isArray(list)) return;
        // Merge defaults and server roles, keep unique
        const merged = Array.from(new Set([...DEFAULT_ROLE_OPTIONS, ...list.filter(Boolean)]));
        setRoleOptions(merged);
      })
      .catch(() => {
        // ignore — keep defaults
      })
      .finally(() => {
        if (mounted) setRolesLoading(false);
      });
    // Fetch organizations for dropdown
    setOrgsLoading(true);
    profilesAPI
      .listOrganizations()
      .then((list) => {
        if (!mounted || !Array.isArray(list)) return;
        const names = list.map((o) => o?.name).filter(Boolean) as string[];
        // Ensure Attendify is present and remove duplicates
        const merged = Array.from(new Set(["Attendify", ...names]));
        setOrgOptions(merged);
      })
      .catch(() => {
        // ignore — keep defaults
      })
      .finally(() => {
        if (mounted) setOrgsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
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
            <Label className="text-sm font-medium">Type</Label>
            <Select
              value={filters.type ?? "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, type: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Role</Label>
            <Select
              value={filters.role ?? "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, role: value === "all" ? undefined : value })}
              disabled={rolesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={rolesLoading ? "Loading roles..." : "All Roles"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Organization</Label>
            <Select
              value={filters.organization ?? "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, organization: value === "all" ? undefined : value })}
              disabled={orgsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={orgsLoading ? "Loading organizations..." : "All Organizations"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {orgOptions.map((org) => (
                  <SelectItem key={org} value={org}>{org}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Created at (From)</Label>
              <div className="relative">
                <input
                  ref={createdFromRef}
                  type="date"
                  className="w-full px-3 py-2 border rounded"
                  value={filters.created_from ?? ""}
                  onChange={(e) => onFiltersChange({ ...filters, created_from: e.target.value || undefined })}
                />
                <button
                  type="button"
                  aria-label="Open created from date picker"
                  onClick={() => {
                    const el = createdFromRef.current as HTMLInputElement & { showPicker?: () => void } | null;
                    if (el) {
                      if (typeof el.showPicker === 'function') el.showPicker();
                      else el.focus();
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <IconCalendar className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Created at (To)</Label>
              <div className="relative">
                <input
                  ref={createdToRef}
                  type="date"
                  className="w-full px-3 py-2 border rounded"
                  value={filters.created_to ?? ""}
                  onChange={(e) => onFiltersChange({ ...filters, created_to: e.target.value || undefined })}
                />
                <button
                  type="button"
                  aria-label="Open created to date picker"
                  onClick={() => {
                    const el = createdToRef.current as HTMLInputElement & { showPicker?: () => void } | null;
                    if (el) {
                      if (typeof el.showPicker === 'function') el.showPicker();
                      else el.focus();
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <IconCalendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Active (From)</Label>
              <div className="relative">
                <input
                  ref={lastFromRef}
                  type="date"
                  className="w-full px-3 py-2 border rounded"
                  value={filters.last_active_from ?? ""}
                  onChange={(e) => onFiltersChange({ ...filters, last_active_from: e.target.value || undefined })}
                />
                <button
                  type="button"
                  aria-label="Open last active from date picker"
                  onClick={() => {
                    const el = lastFromRef.current as HTMLInputElement & { showPicker?: () => void } | null;
                    if (el) {
                      if (typeof el.showPicker === 'function') el.showPicker();
                      else el.focus();
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <IconCalendar className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Active (To)</Label>
              <div className="relative">
                <input
                  ref={lastToRef}
                  type="date"
                  className="w-full px-3 py-2 border rounded"
                  value={filters.last_active_to ?? ""}
                  onChange={(e) => onFiltersChange({ ...filters, last_active_to: e.target.value || undefined })}
                />
                <button
                  type="button"
                  aria-label="Open last active to date picker"
                  onClick={() => {
                    const el = lastToRef.current as HTMLInputElement & { showPicker?: () => void } | null;
                    if (el) {
                      if (typeof el.showPicker === 'function') el.showPicker();
                      else el.focus();
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <IconCalendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Status filter removed */}
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



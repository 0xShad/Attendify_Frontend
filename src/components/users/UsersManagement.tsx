"use client";

import * as React from "react";
import { UsersTable } from "./UsersTable";
import type { User } from "./types";
import { SearchBar } from "./SearchBar";
import { UsersFilters, type UsersFilterValues } from "./UsersFilters";
import { UsersColumnCustomizer } from "./UsersColumnCustomizer";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { UsersPaginationControls } from "./UsersPaginationControls";
import { profilesAPI, type Profile } from "@/lib/api/profiles";

interface UsersManagementProps {
  data: User[];
  onAddUser?: () => void;
  onViewUser?: (user: User) => void;
  onEditUser?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
}

export function UsersManagement({
  data,
  onAddUser,
  onViewUser,
  onEditUser,
  onDeleteUser,
}: UsersManagementProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<UsersFilterValues>({});
  const [appliedFilters, setAppliedFilters] = React.useState<UsersFilterValues>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [users, setUsers] = React.useState<User[]>(data || []);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const itemsPerPage = 10;

  const handleSearch = () => {
    setSearchQuery(globalFilter);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setGlobalFilter("");
    setSearchQuery("");
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setAppliedFilters({});
  };

  React.useEffect(() => {
    const next: ColumnFiltersState = [];
    if (appliedFilters.role) next.push({ id: "role", value: appliedFilters.role });
    if (appliedFilters.status) next.push({ id: "status", value: appliedFilters.status });
    setColumnFilters(next);
  }, [appliedFilters]);

  const transformProfile = (p: Profile): User => {
    const id = String(p.user_id ?? p.id);
    const name = p.firstname || p.lastname ? [p.firstname, p.middlename, p.lastname].filter(Boolean).join(" ") : (p.username || "User");
    const email = p.email || undefined;
    const role = p.role || "";
    const status = p.last_active ? "Active" : "Inactive";
    const lastActive = p.last_active || undefined;
    const avatar = p.avatar_url || undefined;

    // More robust type detection:
    // 1) If nested data sections are present (non-null and object), prefer that (Admin > Business > Academic)
    // 2) Fallback to role text (e.g. 'Admin' or 'Faculty' or 'Student')
    const isObject = (x: any) => x != null && typeof x === "object";
    let derivedType: string | undefined;
    // Map backend sections to front-end 'Type' values: System | Academic | Business
    if (isObject(p.admin_data)) derivedType = "System";
    else if (isObject(p.business_data)) derivedType = "Business";
    else if (isObject(p.academic_data)) derivedType = "Academic";
    else {
      const roleText = (p.role || "").toLowerCase();
      if (roleText.includes("admin") || roleText.includes("system")) derivedType = "System";
      else if (roleText.includes("faculty") || roleText.includes("student")) derivedType = "Academic";
      else if (roleText.includes("business") || roleText.includes("staff") || roleText.includes("employee")) derivedType = "Business";
      else derivedType = "Unknown";
    }

    // Debugging: log incoming nested data and derived type briefly when in dev
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("transformProfile", { user_id: p.user_id ?? p.id, admin_data: p.admin_data, business_data: p.business_data, academic_data: p.academic_data, role: p.role, derivedType });
    }

    return {
      id,
      name,
      email,
      role,
      status,
      lastActive,
      avatar,
      type: derivedType,
      // If the user is a System user, show the platform name.
      // Otherwise show the organization name if present, or 'Unknown'.
      organization_name: derivedType == "System" ? "Attendify" : (p.organization_data?.name ?? "Unknown"),
      createdAt: p.created_at || undefined,
      academic_program_id: p.academic_data?.program_id ?? undefined,
      academic_student_id: p.academic_data?.student_id ?? undefined,
      academic_year_level: p.academic_data?.year_level ?? undefined,
      academic_enrollment_date: p.academic_data?.enrollment_date ?? undefined,
      business_department: p.business_data?.department ?? undefined,
      business_position: p.business_data?.position ?? undefined,
      business_employee_id: p.business_data?.employee_id ?? undefined,
      business_hire_date: p.business_data?.hire_date ?? undefined,
      admin_level: p.admin_data?.admin_level ?? undefined,
      admin_permissions: p.admin_data?.permissions ?? undefined,
      admin_assigned_date: p.admin_data?.assigned_date ?? undefined,
    };
  };

  React.useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const skip = (currentPage - 1) * itemsPerPage;
        let profiles: Profile[] = [];

        const hasFilters = Boolean(
          appliedFilters.role ||
          appliedFilters.status
        );

        if (searchQuery && !hasFilters) {
          profiles = await profilesAPI.searchProfiles({ query: searchQuery, skip, limit: itemsPerPage });
        } else {
          profiles = await profilesAPI.listProfiles({
            role: appliedFilters.role,
            // Map status: we don't have a direct backend status filter; leave undefined
            organization_id: undefined,
            has_avatar: undefined,
            has_face_image: undefined,
            skip,
            limit: itemsPerPage,
          });
        }

        const mapped = profiles.map(transformProfile);
        setUsers(mapped);

        if (profiles.length === itemsPerPage) {
          setTotalItems(currentPage * itemsPerPage + 1);
        } else {
          setTotalItems((currentPage - 1) * itemsPerPage + profiles.length);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch profiles';
        setError(msg);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    };

    fetchProfiles();
  }, [searchQuery, appliedFilters, currentPage]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">Manage platform users and roles</p>
      </div>

      <UsersTable
        data={users}
        globalFilter={searchQuery}
        onGlobalFilterChange={setGlobalFilter}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        onAddUser={onAddUser}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onDeleteUser={onDeleteUser}
        renderToolbar={({ table }) => (
          <>
            <div className="flex items-center gap-2 flex-1">
              <SearchBar
                value={globalFilter}
                onChange={setGlobalFilter}
                onSearch={handleSearch}
                onClear={handleClearSearch}
                disabled={false}
              />
              <UsersFilters
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
                onApplyFilters={handleApplyFilters}
              />
            </div>
            <div className="flex items-center gap-2">
              <UsersColumnCustomizer table={table as any} />
            </div>
          </>
        )}
        renderFooter={({ table }) => (
          <div className="flex w-full items-center gap-8 lg:w-fit ml-auto mt-2">
            <UsersPaginationControls
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      />
    </div>
  );
}



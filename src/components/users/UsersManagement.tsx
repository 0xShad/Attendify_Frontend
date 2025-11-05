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

  const transformProfile = (p: Profile): User => ({
    id: String(p.user_id ?? p.id),
    name: p.firstname || p.lastname ? [p.firstname, p.middlename, p.lastname].filter(Boolean).join(" ") : (p.username || "User"),
    email: p.email || undefined,
    role: p.role || "",
    status: p.last_active ? "Active" : "Inactive",
    lastActive: p.last_active || undefined,
    avatar: p.avatar_url || undefined,
  });

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



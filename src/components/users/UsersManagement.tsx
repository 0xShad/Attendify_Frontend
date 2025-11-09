"use client";

import * as React from "react";
import { UsersTable } from "./UsersTable";
import type { User } from "./types";
import { SearchBar } from "./SearchBar";
import { UsersFilters, type UsersFilterValues } from "./UsersFilters";
import { UsersColumnCustomizer } from "./UsersColumnCustomizer";
import AddUserDrawer from "./AddUserDrawer";
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
  // Track whether the last fetch used server-side search. When true we
  // should NOT pass the same string into the table's client-side global
  // filter because the table's global filter can further narrow results
  // (and may not check email fields), hiding server-matched email results.
  const [lastFetchUsedServerSearch, setLastFetchUsedServerSearch] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<UsersFilterValues>({});
  const [appliedFilters, setAppliedFilters] = React.useState<UsersFilterValues>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [users, setUsers] = React.useState<User[]>(data || []);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [refreshKey, setRefreshKey] = React.useState(0);
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
    setColumnFilters(next);
  }, [appliedFilters]);

  const transformProfile = (p: Profile): User => {
    // Frontend 'id' should represent the profile row id. Keep user_id available on the backend but
    // use p.id (profile id) first, fallback to user_id when missing.
    const id = String(p.id ?? p.user_id ?? "");
    const name = p.firstname || p.lastname ? [p.firstname, p.middlename, p.lastname].filter(Boolean).join(" ") : (p.username || "User");
    const email = p.email || undefined;
    const role = p.role || "";
    const status = p.last_active ? "Active" : "Inactive";
    const lastActive = p.last_active || undefined;
    const avatar = p.avatar_url || undefined;

    // Determine derived type using organization_data.type when available.
    // organization_data may be null. Per request, treat users as System ONLY when organization_data is null.
    const orgData = p.organization_data ?? null;
    const orgTypeRaw = orgData?.type ?? null;
    let derivedType: string | undefined;
    if (orgTypeRaw) {
      const t = String(orgTypeRaw).toLowerCase();
      if (t.includes("academic")) derivedType = "Academic";
      else if (t.includes("business")) derivedType = "Business";
      else if (t.includes("system") || t.includes("admin")) derivedType = "System";
      else derivedType = String(orgTypeRaw);
    } else {
      // organization_data exists but no explicit type: do NOT map to System here.
      if (!orgData) {
        // organization_data absent -> System (Attendify/system-level users)
        derivedType = "System";
      } else {
        // Fallback to role text detection but avoid assigning 'System' when orgData exists.
      const roleText = (p.role || "").toLowerCase();
      if (roleText.includes("faculty") || roleText.includes("student")) derivedType = "Academic";
      else if (roleText.includes("admin") || roleText.includes("administrator")) derivedType = "Admin";
      else if (roleText.includes("business") || roleText.includes("staff") || roleText.includes("employee")) derivedType = "Business";
      else derivedType = "Unknown";
      }
    }

    // Debugging: log incoming nested data and derived type briefly when in dev
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("transformProfile", { user_id: p.user_id ?? p.id, admin_data: p.admin_data, business_data: p.business_data, academic_data: p.academic_data, role: p.role, derivedType });
    }

    // Priority for Type column:
    // 1) If admin_data.admin_level is present, use that.
    // 2) Else if organization_data.type is present (and organization_id provided), use that.
    // 3) Else if organization_data is null -> System
    // 4) Else fall back to derivedType (role-based or Unknown).
    // Tolerant admin level extraction: backend may return admin level under different keys
  // use `any` to tolerate backend variations in admin_data shape
  const adminLevel = (p.admin_data && (((p.admin_data as any).admin_level ?? (p.admin_data as any).level ?? (p.admin_data as any).adminLevel ?? (p.admin_data as any).role))) ?? null;

    // Helper: title-case strings for nicer display (e.g., "application" -> "Application")
    const toTitle = (s?: string | null) => {
      if (!s) return s;
      return String(s).split(/[\s_-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    // Final resolution for the Type column (strict priority):
    // 1) admin_level (if present) -> use that
    // 2) organization_data.type (if present) -> use that
    // 3) If organization_data is null -> System
    // 4) Otherwise -> Unknown
    let finalType: string | undefined;
    if (adminLevel) {
      finalType = toTitle(String(adminLevel));
    } else if (!orgData) {
      // No organization attached -> System-level user
      finalType = "System";
    } else if (orgData.type) {
      finalType = toTitle(String(orgData.type));
    } else {
      // organization exists but has no explicit type -> fall back to role-derived type
      finalType = toTitle(derivedType);
    }

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[UsersManagement] resolved type', { user_id: p.user_id ?? p.id, admin_data: p.admin_data, organization_data: p.organization_data, adminLevel, derivedType, finalType });
    }

    return {
      id,
      name,
      email,
      role,
      status,
      lastActive,
      avatar,
      type: finalType,
  // If the organization is absent or id===0 show 'Attendify'. Otherwise show the organization name.
  organization_name: (!orgData || orgData.id === 0) ? "Attendify" : (orgData.name ?? "Unknown"),
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
        const hasFilters = Object.values(appliedFilters).some((v) => v !== undefined && v !== null && String(v).trim() !== "");

        if (searchQuery && !hasFilters) {
          // backend expects `q` as the query parameter
          setLastFetchUsedServerSearch(true);
          profiles = await profilesAPI.searchProfiles({ q: searchQuery, skip, limit: itemsPerPage });
        } else {
          setLastFetchUsedServerSearch(false);
          // Build listProfiles params from appliedFilters
          const params: any = {
            skip,
            limit: itemsPerPage,
          };
          if (appliedFilters.role) params.role = appliedFilters.role;
          if (appliedFilters.type) params.type = String(appliedFilters.type).toLowerCase();
          if (appliedFilters.organization) params.organization = appliedFilters.organization;
          if (appliedFilters.created_from) params.created_from = `${appliedFilters.created_from}T00:00:00Z`;
          if (appliedFilters.created_to) params.created_to = `${appliedFilters.created_to}T23:59:59Z`;
          if (appliedFilters.last_active_from) params.last_active_from = `${appliedFilters.last_active_from}T00:00:00Z`;
          if (appliedFilters.last_active_to) params.last_active_to = `${appliedFilters.last_active_to}T23:59:59Z`;

          profiles = await profilesAPI.listProfiles(params);
        }

        const mapped = profiles.map(transformProfile);
        // Ensure deterministic ordering: display lowest id first by default.
        mapped.sort((a, b) => {
          const na = Number(a.id);
          const nb = Number(b.id);
          if (Number.isNaN(na) || Number.isNaN(nb)) return String(a.id).localeCompare(String(b.id));
          return na - nb;
        });
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
  }, [searchQuery, appliedFilters, currentPage, refreshKey]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">Manage platform users and roles</p>
      </div>

      <UsersTable
        data={users}
        // If the last fetch returned server-side search results, avoid passing
        // the same string into the table's client-side global filter. Many
        // client-side global filter implementations only search names and
        // may therefore hide email-matched results. Keep the search text in
        // the input (globalFilter) but do not re-filter the rows client-side.
        globalFilter={lastFetchUsedServerSearch ? "" : searchQuery}
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
                disabled={isSearching}
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
              <AddUserDrawer
                onCreate={async (data) => {
                  // Ensure the users list re-fetches: reset to first page and bump refreshKey
                  try { setCurrentPage(1); } catch (e) { /* ignore */ }
                  setRefreshKey((k) => k + 1);
                  // If parent provided onAddUser handler, call it as well
                  if (onAddUser) onAddUser();
                  else console.log("User created (local):", data);
                }}
              />
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



"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { CoursesColumnCustomizer as ColumnCustomizer } from "./ColumnCustomizer";
import { SearchBar as CoursesSearchBar } from "./SearchBar";
import CoursesFilters, { CoursesFilterValues } from "./CoursesFilters";

interface Props {
  searchValue: string;
  onSearchChange: (v: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  filters: CoursesFilterValues;
  onFiltersChange: (f: CoursesFilterValues) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  programs: import("./types").ProgramOption[];
  onAdd: () => void;
  visibleColumns?: Record<string, boolean>;
  onToggleColumn?: (key: string, value: boolean) => void;
}

export default function CoursesHeader({ searchValue, onSearchChange, onSearch, onClearSearch, filters, onFiltersChange, onClearFilters, onApplyFilters, programs, onAdd, visibleColumns, onToggleColumn }: Props) {
  const [filterOpen, setFilterOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-between gap-4 px-4 lg:px-0">
      <div className="flex items-center gap-2 flex-1">
  <CoursesSearchBar value={searchValue} onChange={onSearchChange} onSearch={onSearch} onClear={onClearSearch} />
        {/* Place filter button beside the search bar */}
        <div className="ml-2">
          <CoursesFilters open={filterOpen} onOpenChange={setFilterOpen} filters={filters} onFiltersChange={onFiltersChange} onClearFilters={onClearFilters} onApplyFilters={onApplyFilters} programs={programs} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ColumnCustomizer visible={visibleColumns ?? {}} onToggle={(k, v) => onToggleColumn?.(k, v)} />
        <Button size="sm" onClick={onAdd}>
          <IconPlus className="h-4 w-4" />
          <span className="hidden lg:inline">Add Course</span>
        </Button>
      </div>
    </div>
  );
}

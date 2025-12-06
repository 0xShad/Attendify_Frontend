"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { ClassesColumnCustomizer } from "./ColumnCustomizer";
import { SearchBar } from "./SearchBar";
import ClassesFilters from "./ClassesFilters";

interface Props {
  searchValue: string;
  onSearchChange: (v: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  filters: import("./types").ClassesFilterValues;
  onFiltersChange: (f: import("./types").ClassesFilterValues) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  onAdd: () => void;
  visibleColumns?: Record<string, boolean>;
  onToggleColumn?: (key: string, value: boolean) => void;
}

export default function ClassesHeader({ searchValue, onSearchChange, onSearch, onClearSearch, filters, onFiltersChange, onClearFilters, onApplyFilters, onAdd, visibleColumns, onToggleColumn }: Props) {
  const [filterOpen, setFilterOpen] = React.useState(false);
  return (
    <div className="flex items-center justify-between gap-4 px-4 lg:px-0">
      <div className="flex items-center gap-2 flex-1">
        <SearchBar value={searchValue} onChange={onSearchChange} onSearch={onSearch} onClear={onClearSearch} />
        <div className="ml-2">
          <ClassesFilters open={filterOpen} onOpenChange={setFilterOpen} filters={filters} onFiltersChange={onFiltersChange} onClearFilters={onClearFilters} onApplyFilters={onApplyFilters} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ClassesColumnCustomizer visible={visibleColumns ?? {}} onToggle={(k, v) => onToggleColumn?.(k, v)} />
        <Button size="sm" onClick={onAdd}>
          <IconPlus className="h-4 w-4" />
          <span className="hidden lg:inline">Add Class</span>
        </Button>
      </div>
    </div>
  );
}

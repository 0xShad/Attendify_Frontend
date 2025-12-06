"use client";

import React from "react";
import { IconSearch, IconX } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  disabled = false,
}: SearchBarProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="relative flex items-center gap-2 w-full sm:w-[400px]">
      <div className="relative flex-1">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name or code..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className="pl-9 pr-9 border-primary focus-visible:ring-primary"
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            type="button"
          >
            <IconX className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button onClick={onSearch} disabled={disabled || !value.trim()} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
        Search
      </Button>
    </div>
  );
}

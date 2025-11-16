"use client";

import React from "react";
import { Holiday } from "@/lib/api/holidays";
import HolidayCard from "./HolidayCard";

type Props = {
  holidays: Holiday[];
  loading?: boolean;
  selectedStart?: Date | null;
  selectedEnd?: Date | null;
  onUpdated?: (h: Holiday) => void;
};

export default function HolidayList({ holidays, loading, onUpdated }: Props) {
  return (
    <div className="space-y-3">
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {!loading && holidays.length === 0 && <div className="text-sm text-muted-foreground">No holidays found.</div>}
      <div className="grid grid-cols-1 gap-2">
        {holidays.map(h => (
          <HolidayCard key={h.id} holiday={h} onUpdated={onUpdated} />
        ))}
      </div>
    </div>
  );
}

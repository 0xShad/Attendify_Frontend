"use client";

import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  classId?: number | null;
};

export default function SchedulesTab({ classId }: Props) {
  // Placeholder UI for schedules
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Schedules</h3>
        <div>
          <Button size="sm" variant="outline" disabled>
            Add Schedule
          </Button>
        </div>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="max-h-[40vh] overflow-auto">Schedules for class {classId ?? "—"} will be shown here.</div>
        <div className="hidden sm:block">This is a placeholder. We can add a weekly calendar or a table of meeting times.</div>
        <div className="block sm:hidden text-xs text-muted-foreground">Placeholder — schedule details hidden on very small screens to reduce clutter.</div>
      </div>
    </div>
  );
}

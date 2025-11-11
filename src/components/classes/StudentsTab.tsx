"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type Props = {
  classId?: number | null;
};

export default function StudentsTab({ classId }: Props) {
  // Placeholder UI for students list
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Students</h3>
        <div>
          <Button size="sm" variant="outline" disabled>
            Export
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {/* Make the table scrollable and constrain height for mobile */}
        <div className="max-h-[40vh] overflow-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Student Number</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Placeholder rows */}
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">Student list for class {classId ?? "—"} will appear here.</TableCell>
            </TableRow>
          </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

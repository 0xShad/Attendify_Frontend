"use client";
import React from "react";

export default function StudentDashboard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <p className="text-sm text-muted-foreground">Student dashboard components live here.</p>
      {children}
    </div>
  );
}

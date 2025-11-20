"use client";
import React from "react";

export default function StudentAttendance({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Attendance</h2>
      <p className="text-sm text-muted-foreground">Attendance sessions and history components live here.</p>
      {children}
    </div>
  );
}

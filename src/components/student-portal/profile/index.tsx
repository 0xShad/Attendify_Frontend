"use client";
import React from "react";

export default function StudentProfile({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Profile</h2>
      <p className="text-sm text-muted-foreground">Profile view and edit UI lives here.</p>
      {children}
    </div>
  );
}

"use client";
import React from "react";

export default function StudentAnnouncements({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Announcements</h2>
      <p className="text-sm text-muted-foreground">Recent announcements and class notices appear here.</p>
      {children}
    </div>
  );
}

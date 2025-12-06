"use client";

import React from "react";

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-muted-foreground">Loading schools...</p>
      </div>
    </div>
  );
}

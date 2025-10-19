"use client";

import { Suspense } from "react";
import { FacultyPortal } from "@/components/faculty-portal";

function FacultyPortalWrapper() {
  return <FacultyPortal />;
}

export default function Page() {
  // Authentication is now handled by middleware (HTTP-based)
  // No need for client-side auth checks - middleware redirects before this page loads

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FacultyPortalWrapper />
    </Suspense>
  );
}

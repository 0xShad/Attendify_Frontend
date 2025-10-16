"use client";

import { FacultyPortal } from "@/components/faculty-portal";

export default function Page() {
  // Authentication is now handled by middleware (HTTP-based)
  // No need for client-side auth checks - middleware redirects before this page loads

  return <FacultyPortal />;
}

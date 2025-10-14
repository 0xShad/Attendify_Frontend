"use client";

import { AdminPortal } from "@/components/admin-portal";

export default function Page() {
  // Authentication is now handled by middleware (HTTP-based)
  // No need for client-side auth checks - middleware redirects before this page loads

  return <AdminPortal />;
}

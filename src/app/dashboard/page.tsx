"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Sample user data for the dashboard
const userData = [
  {
    id: "USR001",
    name: "Alice Johnson",
    email: "alice.johnson@attendify.edu",
    role: "Faculty",
    status: "Active",
    lastActive: "2 hours ago",
    department: "Computer Science",
  },
  {
    id: "USR002",
    name: "Bob Smith",
    email: "bob.smith@student.attendify.edu",
    role: "Student",
    status: "Active",
    lastActive: "30 minutes ago",
    department: "Engineering",
  },
  {
    id: "USR003",
    name: "Carol Davis",
    email: "carol.davis@attendify.edu",
    role: "Admin",
    status: "Active",
    lastActive: "1 hour ago",
    department: "Administration",
  },
  {
    id: "USR004",
    name: "David Wilson",
    email: "david.wilson@student.attendify.edu",
    role: "Student",
    status: "Inactive",
    lastActive: "3 days ago",
    department: "Mathematics",
  },
  {
    id: "USR005",
    name: "Emma Brown",
    email: "emma.brown@attendify.edu",
    role: "Faculty",
    status: "Active",
    lastActive: "15 minutes ago",
    department: "Physics",
  },
];

export default function Page() {
  // Authentication is now handled by middleware (HTTP-based)
  // No need for client-side auth checks - middleware redirects before this page loads

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={userData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

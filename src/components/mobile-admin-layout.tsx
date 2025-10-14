"use client";

import * as React from "react";
import {
  IconBooks,
  IconChartBar,
  IconHistory,
  IconMenu2,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MobileAdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: IconChartBar,
    href: "/admin/dashboard",
  },
  {
    id: "courses",
    title: "Manage Courses",
    icon: IconBooks,
    href: "/admin/courses",
  },
  {
    id: "attendance",
    title: "Attendance History",
    icon: IconHistory,
    href: "/admin/attendance",
  },
];

export function MobileAdminLayout({ children }: MobileAdminLayoutProps) {
  const [activeNav, setActiveNav] = React.useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.includes("/courses")) return "courses";
      if (path.includes("/attendance")) return "attendance";
      return "dashboard";
    }
    return "dashboard";
  });
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 h-14 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-600">
                <IconMenu2 className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <div className="flex flex-col h-full bg-white">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      Attendify
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="text-gray-500"
                  >
                    <IconX className="h-5 w-5" />
                  </Button>
                </div>

                {/* Profile Section */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <IconUser className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Professor Smith
                      </p>
                      <p className="text-sm text-gray-500">Computer Science</p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveNav(item.id);
                        setSidebarOpen(false);
                        window.location.href = item.href;
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 min-h-[44px]",
                        activeNav === item.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </button>
                  ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500 text-center">
                    Attendify Admin v1.0
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="font-semibold text-gray-900">
            {navItems.find((item) => item.id === activeNav)?.title ||
              "Dashboard"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <IconUser className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-14 overflow-auto mobile-scroll safe-area-bottom">
        <div className="min-h-full bg-gray-50">{children}</div>
      </main>
    </div>
  );
}

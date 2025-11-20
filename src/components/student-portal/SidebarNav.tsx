"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = { id: string; icon: any; label: string; href: string };

export default function SidebarNav({
  navigationItems,
  activeTab,
  footer,
}: {
  navigationItems: NavItem[];
  activeTab: string;
  footer?: React.ReactNode;
}) {
  return (
    <Sidebar
      variant="sidebar"
      className="border-r border-border bg-stone-50/60 supports-backdrop-filter:backdrop-blur-md shadow-lg flex flex-col min-h-screen relative z-50"
    >
      <SidebarHeader className="px-4 py-6 border-b">
        <div className="flex items-center gap-3">
          <Image
            src="/logo_blue.png"
            alt="Attendify Logo"
            width={48}
            height={48}
            className="shrink-0"
          />
          <div className="group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg block">Attendify</span>
            <span className="text-xs text-muted-foreground">Student Portal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 flex-1 overflow-y-auto min-h-0">
        <SidebarGroup className="py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild isActive={activeTab === item.id} className="w-full justify-start" size="lg">
                    <Link href={item.href}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>{footer}</SidebarFooter>
    </Sidebar>
  );
}

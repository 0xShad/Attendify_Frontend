"use client";
import React from "react";
import Image from "next/image";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function TopHeader({
  activeTab,
  notificationNode,
}: {
  activeTab: string;
  notificationNode?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-stone-50/98 backdrop-blur-xl supports-backdrop-filter:bg-stone-50/95 shadow-lg transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div className="flex items-center gap-2 md:hidden">
            <Image src="/logo_blue.png" alt="Attendify Logo" width={24} height={24} className="flex-shrink-0" />
            <span className="font-semibold">Attendify</span>
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo_blue.png" alt="Attendify Logo" width={40} height={40} className="shrink-0" />
              <div>
                <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "dashboard" && "Your academic overview"}
                  {activeTab === "classes" && "Manage your enrolled classes"}
                  {activeTab === "attendance" && "Record your attendance"}
                  {activeTab === "profile" && "Update your profile and preferences"}
                  {activeTab === "announcements" && "View class announcements"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">{notificationNode}</div>
      </div>
    </header>
  );
}

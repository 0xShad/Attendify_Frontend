"use client";
import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserCheck, Camera as CameraIcon, Megaphone } from "lucide-react";

export default function DashboardQuickActions() {
  return (
    <Card className="border shadow-sm bg-stone-50/40 supports-backdrop-filter:backdrop-blur-md border-stone-200/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/student/classes" className="block">
          <Button className="w-full justify-start" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Join New Class
          </Button>
        </Link>
        <Link href="/student/attendance" className="block">
          <Button className="w-full justify-start" variant="outline">
            <UserCheck className="w-4 h-4 mr-2" />
            View Attendance
          </Button>
        </Link>
        <Link href="/student/profile" className="block">
          <Button className="w-full justify-start" variant="outline">
            <CameraIcon className="w-4 h-4 mr-2" />
            Update Face Data
          </Button>
        </Link>
        <Link href="/student/announcements" className="block">
          <Button className="w-full justify-start" variant="outline">
            <Megaphone className="w-4 h-4 mr-2" />
            View Announcements
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

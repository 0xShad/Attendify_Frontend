"use client";
import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Announcement = {
  id: string;
  title: string;
  content: string;
  className?: string;
  date?: string;
  priority?: string;
  isRead?: boolean;
};

type Props = {
  announcements: Announcement[];
};

export default function DashboardAnnouncements({ announcements }: Props) {
  return (
    <Card className="border shadow-sm bg-stone-50/40 supports-backdrop-filter:backdrop-blur-md border-stone-200/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Announcements</CardTitle>
          <Link href="/student/announcements">
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No announcements</p>
            <p className="text-sm">New announcements will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.slice(0, 3).map((announcement) => (
              <div
                key={announcement.id}
                className={`p-3 rounded-lg border transition-colors ${
                  !announcement.isRead
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white/50 border-stone-200/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm line-clamp-2">{announcement.title}</h4>
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${
                      announcement.priority === "High"
                        ? "border-red-200 text-red-700 bg-red-50"
                        : announcement.priority === "Medium"
                        ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                        : "border-green-200 text-green-700 bg-green-50"
                    }`}
                  >
                    {announcement.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{announcement.content}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{announcement.className || "General"}</span>
                  <span>{announcement.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

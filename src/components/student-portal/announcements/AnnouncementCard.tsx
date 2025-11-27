"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye } from "lucide-react";

type Announcement = any;

export default function AnnouncementCard({
  announcement,
  onViewDetails,
  getCategoryColor,
  formatTimeAgoISO,
}: {
  announcement: Announcement & { created_at?: string | null; course_name?: string | null; class_code?: string | null };
  onViewDetails: (announcement: any) => void;
  getCategoryColor: (category: string) => string;
  formatTimeAgoISO: (iso?: string | null) => string;
}) {
  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${
        !announcement.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""
      }`}
      onClick={() => onViewDetails(announcement)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Instructor Avatar */}
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={announcement.instructorAvatar} />
            <AvatarFallback>
              {announcement.instructor
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-medium line-clamp-2 ${
                    !announcement.isRead ? "font-semibold" : ""
                  }`}
                >
                  {announcement.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {announcement.instructor}
                  </span>
                  {(announcement.course_name || announcement.class_code || announcement.className) && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {announcement.course_name ?? announcement.class_code ?? announcement.className}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(announcement);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Content Preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {announcement.content}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(announcement.category)}>
                    {announcement.category}
                  </Badge>
                </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <svg className="w-3 h-3">
                  {/* clock icon placeholder if needed */}
                </svg>
                <span>
                  {formatTimeAgoISO(announcement.created_at ?? undefined)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

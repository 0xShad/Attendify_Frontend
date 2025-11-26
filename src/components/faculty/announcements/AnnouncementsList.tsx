"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye } from "lucide-react";

type Props = {
  announcements: any[];
  onEdit: (a: any) => void;
  onView: (a: any) => void;
};

export default function AnnouncementsList({ announcements, onEdit, onView }: Props) {
  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">{announcement.title}</CardTitle>
                <CardDescription className="mt-1">
                  {announcement.createdDate} • {(() => {
                    // Prefer class code and course name when available
                    if (announcement.classCode) {
                      return announcement.courseName ? `${announcement.classCode} — ${announcement.courseName}` : announcement.classCode;
                    }
                    // Fallback to listing class IDs
                    return `Classes: ${announcement.classIds.join(', ')}`;
                  })()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    announcement.priority === "High"
                      ? "border-red-200 text-red-700 bg-red-50"
                      : announcement.priority === "Medium"
                      ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                      : "border-green-200 text-green-700 bg-green-50"
                  }
                >
                  {announcement.priority}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    announcement.status === "Published"
                      ? "border-green-200 text-green-700 bg-green-50"
                      : "border-gray-200 text-gray-700 bg-gray-50"
                  }
                >
                  {announcement.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{announcement.content}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(announcement)}>
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => onView(announcement)}>
                <Eye className="w-3 h-3 mr-1" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

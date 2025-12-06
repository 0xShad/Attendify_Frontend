"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// priority/status removed — badges not shown
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2 } from "lucide-react";

type Props = {
  announcements: any[];
  onEdit: (a: any) => void;
  onView: (a: any) => void;
  onDelete?: (a: any) => void;
};

export default function AnnouncementsList({ announcements, onEdit, onView, onDelete }: Props) {
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

              {/* Right-side vertical action buttons: View, Edit, Delete */}
              <div className="flex flex-col items-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onView(announcement)}>
                  <Eye className="w-3 h-3 mr-1" />
                  View Details
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(announcement)}>
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete && onDelete(announcement)}>
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{announcement.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

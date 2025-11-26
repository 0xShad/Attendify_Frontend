"use client";

import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
// priority/status removed — view shows content and created date only
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  announcement: any | null;
  classes: any[];
  onEdit?: (a: any) => void;
};

export default function AnnouncementViewDrawer({ open, onOpenChange, announcement, classes, onEdit }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{announcement?.title || "Announcement Details"}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {announcement && (
            <>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Content</Label>
                    <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm">{announcement.content}</p>
                    </div>
                  </div>

                  <div className="text-sm">
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <p className="mt-1">{announcement.createdDate}</p>
                  </div>
                </div>
              </div>

              {/* Target Classes */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground">Target Classes ({announcement.classIds.length})</Label>
                <div className="space-y-2">
                  {announcement.classIds.map((classId: string) => (
                    <div key={classId} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div>
                          <div className="text-sm font-medium">{classes.find((c) => c.id === classId)?.name || `Class ${classId}`}</div>
                          <div className="text-xs text-muted-foreground">{classes.find((c) => c.id === classId)?.code || classId} • {classes.find((c) => c.id === classId)?.enrolledStudents || 0} students</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <DrawerFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
              if (onEdit && announcement) onEdit(announcement);
            }}
            className="w-full"
          >
            Edit Announcement
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

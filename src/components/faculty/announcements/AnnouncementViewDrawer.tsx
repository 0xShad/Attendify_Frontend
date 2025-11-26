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
  const createdAt = announcement?.created_at ? String(announcement.created_at).split('T')[0] : (announcement?.createdDate ?? null);
  const classCode = announcement?.class_code ?? announcement?.classCode ?? null;
  const className = announcement?.course_name ?? announcement?.courseName ?? null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{announcement?.title || "Announcement Details"}</DrawerTitle>
          {(classCode || className) && (
            <div className="mt-1 text-sm text-muted-foreground">
              {classCode && <span className="font-medium">{classCode}</span>}
              {classCode && className && <span className="mx-2">—</span>}
              {className && <span>{className}</span>}
            </div>
          )}
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {announcement && (
            <>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Content</Label>
                <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm">{announcement.content}</p>
                </div>
              </div>

              <div className="text-sm">
                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                <p className="mt-1">{createdAt}</p>
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

"use client";

import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
// priority removed — backend does not provide priority/status

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  announcement: any | null;
  classes: any[];
  onSave?: (updated: any) => void;
};

export default function AnnouncementEditDrawer({ open, onOpenChange, announcement, classes, onSave }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Edit Announcement</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          {announcement && (
            <>
              <div>
                <Label htmlFor="edit-announcement-title">Title</Label>
                <Input id="edit-announcement-title" defaultValue={announcement.title} placeholder="Announcement title" />
              </div>
              <div>
                <Label htmlFor="edit-announcement-content">Content</Label>
                <Textarea id="edit-announcement-content" defaultValue={announcement.content} placeholder="Write your announcement..." rows={4} />
              </div>
              {/* priority removed — backend does not provide priority/status */}
              <div>
                <Label>Target Classes</Label>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {classes.map((classItem) => (
                    <div key={classItem.id} className="flex items-center space-x-2">
                      <input type="checkbox" id={`edit-class-${classItem.id}`} defaultChecked={announcement.classIds.includes(classItem.id)} className="h-4 w-4" />
                      <Label htmlFor={`edit-class-${classItem.id}`} className="text-sm font-normal flex-1">{classItem.name} ({classItem.code})</Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <DrawerFooter>
          <Button className="w-full" onClick={() => { if (onSave) onSave(announcement); onOpenChange(false); }}>Save Changes</Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

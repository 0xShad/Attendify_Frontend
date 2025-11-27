"use client";

import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type Announcement = any;

export default function AnnouncementDetailsDrawer({
  open,
  onOpenChange,
  selectedAnnouncement,
  getCategoryColor,
  formatTimeAgoISO,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedAnnouncement: Announcement | null & { created_at?: string | null; course_name?: string | null; class_code?: string | null };
  getCategoryColor: (category: string) => string;
  formatTimeAgoISO: (iso?: string | null) => string;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-start justify-between gap-4 pr-6">
            <span className="line-clamp-2">{selectedAnnouncement?.title}</span>
            {/* priority removed */}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {selectedAnnouncement && (
            <div className="space-y-6">
              {/* Announcement Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedAnnouncement.instructorAvatar} />
                    <AvatarFallback>
                      {selectedAnnouncement.instructor
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedAnnouncement.instructor}</p>
                    <p className="text-sm text-muted-foreground">{selectedAnnouncement.course_name ?? selectedAnnouncement.class_code ?? selectedAnnouncement.className ?? "General Announcement"}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{formatTimeAgoISO(selectedAnnouncement.created_at)}</p>
                  <p className="text-xs">{new Date(selectedAnnouncement.created_at ?? Date.now()).toLocaleString()}</p>
                </div>
              </div>

              {/* Category and Class */}
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(selectedAnnouncement.category)}>
                  {selectedAnnouncement.category}
                </Badge>
                {selectedAnnouncement.className && (
                  <Badge variant="outline">{selectedAnnouncement.className}</Badge>
                )}
              </div>

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm">{selectedAnnouncement.fullContent || selectedAnnouncement.content}</div>
              </div>

              {/* Attachments */}
              {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {selectedAnnouncement.attachments.map((a: string) => (
                      <div key={a} className="text-sm text-muted-foreground">{a}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* mark-read/unread and pin/star actions removed */}
            </div>
          )}
        </div>
        <DrawerFooter className="px-4 pb-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

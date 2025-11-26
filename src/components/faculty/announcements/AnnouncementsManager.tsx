"use client";

import React, { useState, forwardRef, useImperativeHandle } from "react";
import AnnouncementsList from "./AnnouncementsList";
import AnnouncementFormDrawer from "./AnnouncementFormDrawer";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { classesAPI } from "@/lib/api";

type ClassItem = any;
type Announcement = {
  id: string;
  title: string;
  content: string;
  classIds: string[];
  createdDate: string;
  priority: string;
  status: string;
};

type Props = {
  classes: ClassItem[];
};

const sampleAnnouncements: Announcement[] = [
  {
    id: "ANN001",
    title: "Midterm Exam Schedule",
    content:
      "The midterm examinations will be held next week. Please check your individual schedules.",
    classIds: ["CS101", "CS201"],
    createdDate: "2025-10-15",
    priority: "High",
    status: "Published",
  },
  {
    id: "ANN002",
    title: "Assignment Due Reminder",
    content: "Don't forget that Assignment 3 is due this Friday at 11:59 PM.",
    classIds: ["CS101"],
    createdDate: "2025-10-14",
    priority: "Medium",
    status: "Published",
  },
];

const AnnouncementsManager = forwardRef(({ classes }: Props, ref) => {
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>(sampleAnnouncements);
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useImperativeHandle(ref, () => ({
    openNewAnnouncement: () => setAddOpen(true),
  }));

  const handleView = (a: Announcement) => {
    setSelectedAnnouncement(a);
    setViewOpen(true);
  };

  const handleEdit = (a: Announcement) => {
    setSelectedAnnouncement(a);
    setEditOpen(true);
  };

  const handleCreate = async (title: string, content: string, priority: string, selectedClasses: string[]) => {
    if (!title || !content) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // Create announcement per selected class and collect results
      const promises = selectedClasses.map((classId) =>
        classesAPI.createAnnouncementForClass(classId, { title, content })
      );

      const results = await Promise.allSettled(promises);

      const successes: Announcement[] = [];
      const failures: string[] = [];

      results.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          const created = r.value;
          // Normalize returned shape if needed
          const ann: Announcement = {
            id: String(created.id ?? `ANN-SRV-${Date.now()}-${idx}`),
            title: created.title ?? title,
            content: created.content ?? content,
            classIds: [String(created.class_id ?? selectedClasses[idx])],
            createdDate: created.created_at ? String(created.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
            priority: priority,
            status: created.status ?? "Published",
          };
          successes.push(ann);
        } else {
          failures.push(selectedClasses[idx]);
        }
      });

      if (successes.length > 0) {
        setAnnouncements((prev) => [...successes, ...prev]);
        toast({ title: "Success", description: `Announcement published to ${successes.length} class(es)` });
      }
      if (failures.length > 0) {
        toast({ title: "Partial Failure", description: `Failed to publish to ${failures.length} class(es)`, variant: "destructive" });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setIsSaving(false);
      setAddOpen(false);
    }
  };

  // New: single-class create handler (matches AnnouncementFormDrawer onSubmit signature)
  const handleCreateForClass = async (classId: string, title: string, content: string) => {
    if (!title || !content) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const created = await classesAPI.createAnnouncementForClass(classId, { title, content });

      const ann: Announcement = {
        id: String(created.id ?? `ANN-SRV-${Date.now()}`),
        title: created.title ?? title,
        content: created.content ?? content,
        classIds: [String(created.class_id ?? classId)],
        createdDate: created.created_at ? String(created.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
        priority: created.priority ?? "Medium",
        status: created.status ?? "Published",
      };

      setAnnouncements((prev) => [ann, ...prev]);
      toast({ title: "Success", description: `Announcement published to 1 class` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setIsSaving(false);
      setAddOpen(false);
    }
  };

  return (
    <div>
      <AnnouncementsList
        announcements={announcements}
        onEdit={handleEdit}
        onView={handleView}
      />

      <AnnouncementFormDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        classes={classes}
        onSubmit={handleCreateForClass}
      />

      {/* View Announcement Drawer */}
      <Drawer open={viewOpen} onOpenChange={setViewOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{selectedAnnouncement?.title || "Announcement Details"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-6 overflow-y-auto">
            {selectedAnnouncement && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge
                      variant="outline"
                      className={
                        selectedAnnouncement.priority === "High"
                          ? "border-red-200 text-red-700 bg-red-50"
                          : selectedAnnouncement.priority === "Medium"
                          ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                          : "border-green-200 text-green-700 bg-green-50"
                      }
                    >
                      {selectedAnnouncement.priority} Priority
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        selectedAnnouncement.status === "Published"
                          ? "border-green-200 text-green-700 bg-green-50"
                          : "border-gray-200 text-gray-700 bg-gray-50"
                      }
                    >
                      {selectedAnnouncement.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Content</Label>
                      <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">{selectedAnnouncement.content}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                        <p className="mt-1">{selectedAnnouncement.createdDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                        <p className="mt-1">{selectedAnnouncement.priority}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target Classes */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-muted-foreground">Target Classes ({selectedAnnouncement.classIds.length})</Label>
                  <div className="space-y-2">
                    {selectedAnnouncement.classIds.map((classId) => (
                      <div key={classId} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
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
                setViewOpen(false);
                setEditOpen(true);
              }}
              className="w-full"
            >
              Edit Announcement
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Announcement Drawer (lightweight) */}
      <Drawer open={editOpen} onOpenChange={setEditOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Edit Announcement</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4 overflow-y-auto">
            {selectedAnnouncement && (
              <>
                <div>
                  <Label htmlFor="edit-announcement-title">Title</Label>
                  <Input id="edit-announcement-title" defaultValue={selectedAnnouncement.title} placeholder="Announcement title" />
                </div>
                <div>
                  <Label htmlFor="edit-announcement-content">Content</Label>
                  <Textarea id="edit-announcement-content" defaultValue={selectedAnnouncement.content} placeholder="Write your announcement..." rows={4} />
                </div>
                <div>
                  <Label htmlFor="edit-announcement-priority">Priority</Label>
                  <Select defaultValue={selectedAnnouncement.priority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Classes</Label>
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {classes.map((classItem) => (
                      <div key={classItem.id} className="flex items-center space-x-2">
                        <input type="checkbox" id={`edit-class-${classItem.id}`} defaultChecked={selectedAnnouncement.classIds.includes(classItem.id)} className="h-4 w-4" />
                        <Label htmlFor={`edit-class-${classItem.id}`} className="text-sm font-normal flex-1">{classItem.name} ({classItem.code})</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DrawerFooter>
            <Button className="w-full">Save Changes</Button>
            <Button variant="outline" className="w-full" onClick={() => setEditOpen(false)}>Cancel</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
});

export default AnnouncementsManager;

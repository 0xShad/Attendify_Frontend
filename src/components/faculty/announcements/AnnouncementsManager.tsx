"use client";

import React, { useState, forwardRef, useImperativeHandle } from "react";
import AnnouncementsList from "./AnnouncementsList";
import AnnouncementFormDrawer from "./AnnouncementFormDrawer";
import AnnouncementEditDrawer from "./AnnouncementEditDrawer";
import AnnouncementViewDrawer from "./AnnouncementViewDrawer";
import DeleteAnnouncementDialog from "./DeleteAnnouncementDialog";
import { Button } from "@/components/ui/button";
// priority/status removed — no select or badges needed
import { useToast } from "@/hooks/use-toast";
import { classesAPI } from "@/lib/api";

type ClassItem = any;
type Announcement = {
  id: string;
  title: string;
  content: string;
  classIds: string[];
  createdDate: string;
  // priority and status are not provided by backend
  classCode?: string | null;
  courseName?: string | null;
};

type Props = {
  classes: ClassItem[];
};

const sampleAnnouncements: Announcement[] = [];

const AnnouncementsManager = forwardRef(({ classes }: Props, ref) => {
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>(sampleAnnouncements);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState<boolean>(false);
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  // Open confirmation dialog (do not delete immediately)
  const handleOpenDelete = (a: Announcement) => {
    setDeleteTarget(a);
    setDeleteDialogOpen(true);
  };

  const handleDelete = (a: Announcement) => {
    const id = String(a.id);
    setAnnouncements((prev) => prev.filter((x) => String(x.id) !== id));
    if (selectedAnnouncement && String(selectedAnnouncement.id) === id) {
      setSelectedAnnouncement(null);
      setViewOpen(false);
      setEditOpen(false);
    }
    toast({ title: "Deleted", description: `Announcement removed`, variant: "default" });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const classId = (deleteTarget.classIds && deleteTarget.classIds[0]) ? deleteTarget.classIds[0] : null;
      if (!classId) throw new Error('Missing class id for announcement');
      await classesAPI.deleteAnnouncementForClass(classId, deleteTarget.id);
      handleDelete(deleteTarget);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Failed to delete announcement:', err);
      const msg = err?.message ? String(err.message) : String(err);
      setDeleteError(msg);
      toast({ title: 'Failed', description: msg, variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreate = async (title: string, content: string, selectedClasses: string[]) => {
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
            classCode: created.class_code ?? null,
            courseName: created.course_name ?? null,
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
        classCode: created.class_code ?? null,
        courseName: created.course_name ?? null,
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

  const handleSaveEdit = async (updated: { title: string; content: string; classId?: string }) => {
    if (!selectedAnnouncement) return;
    const annId = selectedAnnouncement.id;
    const classId = updated.classId ?? ((selectedAnnouncement.classIds && selectedAnnouncement.classIds[0]) ? selectedAnnouncement.classIds[0] : null);
    if (!classId) {
      toast({ title: 'Error', description: 'Unable to determine class for announcement', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await classesAPI.updateAnnouncementForClass(classId, annId, { title: updated.title, content: updated.content });
      // Normalize returned shape
      const newItem: Announcement = {
        id: String(res.id ?? annId),
        title: res.title ?? updated.title,
        content: res.content ?? updated.content,
        classIds: [String(res.class_id ?? classId)],
        createdDate: res.created_at ? String(res.created_at).split('T')[0] : (selectedAnnouncement.createdDate || new Date().toISOString().split('T')[0]),
        classCode: res.class_code ?? selectedAnnouncement.classCode ?? null,
        courseName: res.course_name ?? selectedAnnouncement.courseName ?? null,
      };

      setAnnouncements((prev) => prev.map((p) => (String(p.id) === String(annId) ? newItem : p)));
      setSelectedAnnouncement(newItem);
      setEditOpen(false);
      toast({ title: 'Saved', description: 'Announcement updated' });
    } catch (err: any) {
      console.error('Failed to update announcement:', err);
      toast({ title: 'Failed', description: String(err?.message ?? err), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Load announcements on mount
  React.useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoadingAnnouncements(true);
      try {
        const data = await classesAPI.listMyAnnouncements();
        if (!mounted) return;
        // Map backend AnnouncementOut -> UI Announcement shape
        const mapped = (Array.isArray(data) ? data : []).map((item: any) => ({
          id: String(item.id),
          title: item.title ?? '',
          content: item.content ?? '',
          classIds: [String(item.class_id ?? '')].filter(Boolean),
          createdDate: item.created_at ? String(item.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
          classCode: item.class_code ?? null,
          courseName: item.course_name ?? null,
        } as Announcement));
        setAnnouncements(mapped);
      } catch (err: any) {
        console.error('Failed to load announcements:', err);
      } finally {
        if (mounted) setLoadingAnnouncements(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <AnnouncementsList
        announcements={announcements}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleOpenDelete}
      />

      <AnnouncementFormDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        classes={classes}
        onSubmit={handleCreateForClass}
      />

      <DeleteAnnouncementDialog
        open={deleteDialogOpen}
        onOpenChange={(v) => { if (!v) { setDeleteError(null); setDeleteTarget(null); } setDeleteDialogOpen(v); }}
        announcement={deleteTarget}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        error={deleteError}
      />

      {/* View Announcement Drawer */}
      <AnnouncementViewDrawer
        open={viewOpen}
        onOpenChange={(v: boolean) => setViewOpen(v)}
        announcement={selectedAnnouncement}
        classes={classes}
        onEdit={(a: any) => {
          setSelectedAnnouncement(a);
          setViewOpen(false);
          setEditOpen(true);
        }}
      />

      <AnnouncementEditDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        announcement={selectedAnnouncement}
        classes={classes}
        onSave={handleSaveEdit}
      />
    </div>
  );
});

export default AnnouncementsManager;

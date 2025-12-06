"use client";

import React, { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { classesAPI } from "@/lib/api";
// priority removed — backend does not provide priority/status

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  announcement: any | null;
  classes: any[];
  onSave?: (updated: any) => void;
};

export default function AnnouncementEditDrawer({ open, onOpenChange, announcement, classes, onSave }: Props) {
  const [title, setTitle] = useState<string>(announcement?.title ?? "");
  const [content, setContent] = useState<string>(announcement?.content ?? "");
  const [options, setOptions] = useState<any[] | null>(classes && classes.length ? classes : null);
  const [selectedClass, setSelectedClass] = useState<string>(announcement?.classIds?.[0] ? String(announcement.classIds[0]) : "");
  const [loading, setLoading] = useState<boolean>(false);

  React.useEffect(() => {
    if (announcement?.classIds && announcement.classIds[0]) setSelectedClass(String(announcement.classIds[0]));
  }, [announcement]);

  useEffect(() => {
    setTitle(announcement?.title ?? "");
    setContent(announcement?.content ?? "");
  }, [announcement]);

  React.useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (classes && classes.length) {
        if (!mounted) return;
        setOptions(classes);
        setSelectedClass((prev) => prev || String(classes[0].id));
        return;
      }
      if (!open && options !== null) return;
      setLoading(true);
      try {
        const resp = await classesAPI.listMyClassOptions();
        if (!mounted) return;
        setOptions(resp || []);
        setSelectedClass((prev) => prev || (resp && resp[0] ? String(resp[0].id) : ""));
      } catch (err) {
        if (!mounted) return;
        setOptions([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, [classes, open]);

  const handleSave = () => {
    if (!onSave) return;
    onSave({ title: String(title || "").trim(), content: String(content || "").trim(), classId: selectedClass });
    onOpenChange(false);
  };

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
                <Label htmlFor="edit-announcement-class">Class</Label>
                <Select value={selectedClass} onValueChange={(v) => setSelectedClass(v)}>
                  <SelectTrigger id="edit-announcement-class" disabled title="Class cannot be changed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(options || []).map((item: any) => (
                      <SelectItem key={String(item.id)} value={String(item.id)}>
                        {(() => {
                          const code = item.class_code ? String(item.class_code).trim() : '';
                          const name = item.course_name ?? item.name ?? '';
                          if (code && name) return `${code} - ${name}`;
                          if (code) return code;
                          if (name) return name;
                          return `Class ${item.id}`;
                        })()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-announcement-title">Title</Label>
                <Input id="edit-announcement-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
              </div>
              <div>
                <Label htmlFor="edit-announcement-content">Content</Label>
                <Textarea id="edit-announcement-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your announcement..." rows={4} />
              </div>
              {/* priority removed — backend does not provide priority/status */}
            </>
          )}
        </div>
        <DrawerFooter>
          <Button className="w-full" onClick={handleSave}>Save Changes</Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

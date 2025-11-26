"use client";

import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconSpeakerphone } from "@tabler/icons-react";
import { classesAPI } from "@/lib/api";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes?: any[];
  // uncontrolled: manager calls onSubmit(classId, title, content)
  onSubmit: (classId: string, title: string, content: string) => Promise<void> | void;
};

export default function AnnouncementFormDrawer({
  open,
  onOpenChange,
  classes,
  onSubmit,
}: Props) {
  const [options, setOptions] = React.useState<any[] | null>(classes && classes.length ? classes : null);
  const [selectedClass, setSelectedClass] = React.useState<string>("");
  const [title, setTitle] = React.useState<string>("");
  const [content, setContent] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Fetch options when the drawer opens (or when classes prop changes).
    let mounted = true;
    const init = async () => {
      setError(null);
      // If parent passed classes prop, use it as options.
      if (classes && classes.length) {
        if (!mounted) return;
        setOptions(classes);
        setSelectedClass((prev) => prev || String(classes[0].id));
        return;
      }

      // Only fetch when the drawer is open to avoid extra requests.
      if (!open && options !== null) return;

      setLoading(true);
      try {
        const resp = await classesAPI.listMyClassOptions();
        if (!mounted) return;
        setOptions(resp || []);
        setSelectedClass((prev) => prev || (resp && resp[0] ? String(resp[0].id) : ""));
      } catch (err: any) {
        if (!mounted) return;
        setOptions([]);
        setError(err?.message ? String(err.message) : 'Failed to load classes');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [classes, open]);

  const handlePublish = async () => {
    if (!selectedClass) return;
    if (!title || !content) return;
    await onSubmit(selectedClass, title, content);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Create Announcement</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          <div>
            <Label htmlFor="announcement-class">Class</Label>
            <Select value={selectedClass} onValueChange={(v) => setSelectedClass(v)}>
              <SelectTrigger id="announcement-class">
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
            <Label htmlFor="announcement-title">Title</Label>
            <Input id="announcement-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" required />
          </div>
          <div>
            <Label htmlFor="announcement-content">Content</Label>
            <Textarea id="announcement-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your announcement..." rows={4} required />
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={handlePublish} className="w-full">
            <IconSpeakerphone className="w-4 h-4 mr-2" />
            Publish Announcement
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}


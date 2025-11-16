"use client";

import React, { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import type { ClassItem as CardClassItem } from "./ClassCard";

type ClassMode = "Online" | "In-Person" | "Hybrid";

export interface ClassType {
  id: string;
  name: string;
  code: string;
  schedule: string;
  mode: ClassMode;
  enrolledStudents: number;
  totalSessions: number;
  completedSessions: number;
  attendanceRate: number;
  status: "Active" | "Inactive" | "Scheduled";
  location?: string;
  description?: string;
}

interface EditClassDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass: CardClassItem | null;
  onSave?: (updated: any) => void;
}

const EditClassDrawer: React.FC<EditClassDrawerProps> = ({ open, onOpenChange, selectedClass, onSave }) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [schedule, setSchedule] = useState("");
  const [mode, setMode] = useState<ClassMode>("In-Person");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive" | "Completed">("Active");

  useEffect(() => {
    if (selectedClass) {
      setName(selectedClass.course_name ?? selectedClass.class_code ?? "");
      setCode(selectedClass.class_code ?? "");
      // derive a simple schedule string from the first schedule or room
      if (selectedClass.schedules && selectedClass.schedules.length > 0) {
        const s = selectedClass.schedules[0];
        setSchedule(s.type === 'normal' ? `${s.day_of_week ?? ''} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}` : `${s.date ?? ''} ${s.start_time?.slice(0,5) || ''}-${s.end_time?.slice(0,5) || ''}`);
      } else {
        setSchedule(selectedClass.room ?? "");
      }
      setMode((selectedClass.schedules && selectedClass.schedules.some(s => (s.modes ?? []).includes('online'))) ? 'Online' : 'In-Person');
      setLocation(selectedClass.room || "");
      setStatus((selectedClass.status as any) || "Active");
    }
  }, [selectedClass]);

  const handleSave = () => {
    if (!selectedClass) return;
    const updated: any = {
      id: selectedClass.id,
      course_name: name,
      class_code: code,
      // we don't mutate schedules here; store schedule string in description as fallback
      room: location,
      status: status === "Completed" ? ("Inactive" as const) : (status as any),
    };
    onSave?.(updated);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Edit Class</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          {selectedClass ? (
            <>
              <div>
                <Label htmlFor="edit-class-name">Class Name</Label>
                <Input id="edit-class-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Introduction to Computer Science" />
              </div>
              <div>
                <Label htmlFor="edit-class-code">Class Code</Label>
                <Input id="edit-class-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., CS101" />
              </div>
              <div>
                <Label htmlFor="edit-class-schedule">Schedule</Label>
                <Input id="edit-class-schedule" value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g., Mon, Wed, Fri 9:00 AM" />
              </div>
              <div>
                <Label htmlFor="edit-class-mode">Mode</Label>
                <Select value={mode} onValueChange={(v: ClassMode) => setMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-class-location">Location</Label>
                <Input id="edit-class-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Room 202" />
              </div>
              <div>
                <Label htmlFor="edit-class-status">Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div>No class selected</div>
          )}
        </div>

        <DrawerFooter>
          <Button className="w-full" onClick={handleSave}>
            <Settings className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default EditClassDrawer;

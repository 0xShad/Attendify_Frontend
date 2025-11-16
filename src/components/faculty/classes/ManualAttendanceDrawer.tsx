"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle } from "lucide-react";

type AttendanceSession = {
  id: string;
  classId: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "Active" | "Completed" | "Scheduled";
  presentCount: number;
  totalStudents: number;
  location?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSession: AttendanceSession | null;
  onSave?: (sessionId: string, presentIndexes: number[]) => void;
};

export default function ManualAttendanceDrawer({
  open,
  onOpenChange,
  selectedSession,
  onSave,
}: Props) {
  const [checked, setChecked] = React.useState<boolean[]>([]);

  // initialize checked array when session changes
  React.useEffect(() => {
    if (!selectedSession) {
      setChecked([]);
      return;
    }
    const arr = Array.from({ length: selectedSession.totalStudents }, (_, i) => i < selectedSession.presentCount);
    setChecked(arr);
  }, [selectedSession]);

  const selectAll = () => setChecked((prev) => prev.map(() => true));
  const clearAll = () => setChecked((prev) => prev.map(() => false));

  const toggleIndex = (index: number, value: boolean) =>
    setChecked((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });

  const handleSave = () => {
    if (!selectedSession) return;
    const presentIndexes = checked.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    if (onSave) onSave(selectedSession.id, presentIndexes);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Manual Attendance Edit</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          {selectedSession && (
            <>
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm">{selectedSession.className}</h4>
                <p className="text-xs text-muted-foreground">Session started: {selectedSession.startTime} • {selectedSession.location}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Student List</Label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={selectAll}>Select All</Button>
                    <Button size="sm" variant="outline" onClick={clearAll}>Clear All</Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-3">
                  {Array.from({ length: selectedSession.totalStudents }, (_, i) => {
                    const isPresent = checked[i] ?? false;
                    return (
                      <div key={i} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">{`S${i + 1}`}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">Student {i + 1}</div>
                            <div className="text-xs text-muted-foreground">student{i + 1}@university.edu</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id={`manual-student-${i}`} checked={isPresent} className="h-4 w-4" onChange={(e) => toggleIndex(i, e.target.checked)} />
                          <Label htmlFor={`manual-student-${i}`} className="text-sm font-normal">Present</Label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm font-medium">Additional Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="late-arrival" className="h-4 w-4" />
                    <Label htmlFor="late-arrival" className="text-sm">Allow late arrivals (next 15 minutes)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="auto-save" defaultChecked className="h-4 w-4" />
                    <Label htmlFor="auto-save" className="text-sm">Auto-save changes</Label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DrawerFooter>
          <Button className="w-full" onClick={handleSave}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Save Attendance
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

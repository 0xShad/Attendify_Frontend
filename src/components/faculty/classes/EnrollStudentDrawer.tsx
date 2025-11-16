"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { UserPlus } from "lucide-react";

export interface SimpleStudent {
  id: string;
  name: string;
  email: string;
}

interface EnrollStudentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableStudents?: SimpleStudent[];
  onEnrollStudent?: (student: SimpleStudent) => void;
  onManualEnroll?: (student: SimpleStudent & { studentId?: string }) => void;
}

const EnrollStudentDrawer: React.FC<EnrollStudentDrawerProps> = ({
  open,
  onOpenChange,
  availableStudents,
  onEnrollStudent,
  onManualEnroll,
}) => {
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualId, setManualId] = useState("");

  const students =
    availableStudents ??
    Array.from({ length: 8 }, (_, i) => ({
      id: `u${i + 1}`,
      name: `Student ${i + 1}`,
      email: `student${i + 1}@university.edu`,
    }));

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Enroll Student</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          <div>
            <Label htmlFor="student-search">Search Students</Label>
            <Input id="student-search" placeholder="Search by name, email, or student ID..." className="mt-1" />
          </div>

          {/* Available Students List */}
          <div className="space-y-3">
            <Label>Available Students</Label>
            <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">{s.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onEnrollStudent?.(s)}>
                    <UserPlus className="w-3 h-3 mr-1" />
                    Enroll
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Enrollment */}
          <div className="space-y-3 pt-4 border-t">
            <Label>Manual Enrollment</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="manual-name">Student Name</Label>
                <Input id="manual-name" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <Label htmlFor="manual-email">Email Address</Label>
                <Input id="manual-email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} type="email" placeholder="student@university.edu" />
              </div>
              <div>
                <Label htmlFor="manual-id">Student ID</Label>
                <Input id="manual-id" value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="Student ID number" />
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button
            className="w-full"
            onClick={() => {
              if (!manualName || !manualEmail) return;
              onManualEnroll?.({ id: manualId || `m-${Date.now()}`, name: manualName, email: manualEmail, studentId: manualId });
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Enroll Student
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default EnrollStudentDrawer;

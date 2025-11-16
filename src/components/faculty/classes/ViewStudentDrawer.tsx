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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare } from "lucide-react";

type Student = {
  id: string;
  name: string;
  email?: string;
  studentId?: string;
  attendanceRate?: number;
  totalSessions?: number;
  presentSessions?: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudent: Student | null;
};

export default function ViewStudentDrawer({
  open,
  onOpenChange,
  selectedStudent,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{selectedStudent?.name || "Student Profile"}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {selectedStudent && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-lg">
                      {selectedStudent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedStudent.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                    <p className="text-sm text-muted-foreground">ID: {selectedStudent.studentId}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Attendance Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedStudent.attendanceRate ?? 0}%</div>
                    <div className="text-xs text-muted-foreground">Overall Rate</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-2xl font-bold">{selectedStudent.presentSessions ?? 0}/{selectedStudent.totalSessions ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Sessions</div>
                  </div>
                </div>
                <Progress value={selectedStudent.attendanceRate ?? 0} className="h-2" />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Recent Sessions</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${Math.random() > 0.2 ? "bg-green-500" : "bg-red-500"}`}></div>
                        <div>
                          <div className="text-sm font-medium">Session { (selectedStudent.totalSessions ?? 0) - i }</div>
                          <div className="text-xs text-muted-foreground">{new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <Badge variant={Math.random() > 0.2 ? "default" : "secondary"}>{Math.random() > 0.2 ? "Present" : "Absent"}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Contact Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm">
                    <Send className="w-3 h-3 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-3 h-3 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

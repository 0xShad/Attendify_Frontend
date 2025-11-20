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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Megaphone, UserCheck, BookOpen } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedClass: any | null;
};

export default function ClassDetailsDrawer({
  open,
  onOpenChange,
  selectedClass,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{selectedClass?.name}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {selectedClass && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Course Code</label>
                  <p className="text-lg font-semibold">{selectedClass.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credits</label>
                  <p className="text-lg font-semibold">{selectedClass.credits}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Semester</label>
                  <p className="text-lg font-semibold">{selectedClass.semester}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Grade</label>
                  <p className="text-lg font-semibold text-green-600">{selectedClass.grade}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Instructor</label>
                <div className="flex items-center gap-3 mt-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedClass.instructorAvatar} />
                    <AvatarFallback>
                      {selectedClass.instructor
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedClass.instructor}</p>
                    <p className="text-sm text-muted-foreground">Professor</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Schedule & Location</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedClass.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedClass.location}</span>
                    <Badge variant="outline">{selectedClass.mode}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-2 text-sm">{selectedClass.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Attendance Statistics</label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Sessions Attended</span>
                    <span className="font-medium">{selectedClass.attendedSessions} / {selectedClass.totalSessions}</span>
                  </div>
                  <Progress value={selectedClass.attendanceRate} className="h-3" />
                  <div className="flex items-center justify-between text-sm">
                    <span>{selectedClass.attendanceRate}% Attendance Rate</span>
                    <Badge className={
                      selectedClass.attendanceRate >= 90
                        ? "bg-green-100 text-green-700 border-green-200"
                        : selectedClass.attendanceRate >= 75
                        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    }>{selectedClass.attendanceRate >= 90 ? "Excellent" : selectedClass.attendanceRate >= 75 ? "Good" : "At Risk"}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Megaphone className="w-4 h-4 mr-2" />
                  View Announcements
                </Button>
                <Button variant="outline" size="sm">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Attendance History
                </Button>
                <Button variant="outline" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Course Materials
                </Button>
              </div>
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

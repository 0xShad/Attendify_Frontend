"use client";

import React from "react";
import { IconSchool, IconClock } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Program } from "./types";

interface ViewProgramDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Program | null;
}

export function ViewProgramDrawer({
  open,
  onOpenChange,
  program,
}: ViewProgramDrawerProps) {
  if (!program) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Program Details</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {/* Header Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
              <IconSchool className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{program.name}</h3>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Badge variant="outline" className="font-mono">
                  {program.code}
                </Badge>
                <span>•</span>
                <span>{program.school}</span>
              </div>
              <Badge
                variant={program.status === "Active" ? "secondary" : "outline"}
                className={
                  program.status === "Active"
                    ? "bg-green-50 text-green-700 border-green-200 mt-2"
                    : "mt-2"
                }
              >
                {program.status}
              </Badge>
            </div>
          </div>

          {program.description && (
            <div>
              <h4 className="font-semibold mb-3">About Program</h4>
              <p className="text-sm text-muted-foreground">
                {program.description}
              </p>
            </div>
          )}

          {/* Program Statistics */}
          <div>
            <h4 className="font-semibold mb-4">Program Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <IconClock className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-semibold text-primary">
                  {program.duration}
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </Card>
              <Card className="p-4 text-center">
                <IconSchool className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-semibold text-primary">
                  {program.totalCourses}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Courses
                </div>
              </Card>
              <Card className="p-4 text-center">
                <IconSchool className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-semibold text-primary">
                  {program.totalStudents}
                </div>
                <div className="text-sm text-muted-foreground">
                  Enrolled Students
                </div>
              </Card>
            </div>
          </div>
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

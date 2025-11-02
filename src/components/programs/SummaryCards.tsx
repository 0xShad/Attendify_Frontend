"use client";

import React from "react";
import { IconSchool, IconCalendar } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Program } from "./types";

interface SummaryCardsProps {
  programs: Program[];
}

export function SummaryCards({ programs }: SummaryCardsProps) {
  const activePrograms = programs.filter((p) => p.status === "Active").length;
  const totalStudents = programs.reduce((sum, p) => sum + p.totalStudents, 0);
  const totalCourses = programs.reduce((sum, p) => sum + p.totalCourses, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <IconSchool className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-primary">
                {activePrograms}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Programs
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <IconSchool className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-primary">
                {totalStudents.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Students
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <IconCalendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-primary">
                {totalCourses}
              </div>
              <div className="text-sm text-muted-foreground">Total Courses</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

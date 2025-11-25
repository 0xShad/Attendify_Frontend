"use client";
import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";

type Props = {
  enrolledClasses: any[];
  chartConfig: any;
  attendanceChartData: any[];
};

export default function DashboardAttendanceOverview({ enrolledClasses, chartConfig, attendanceChartData }: Props) {
  return (
    <Card className="border shadow-sm bg-stone-50/40 supports-backdrop-filter:backdrop-blur-md border-stone-200/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Attendance Overview</CardTitle>
            <CardDescription>Your attendance performance across all classes</CardDescription>
          </div>
          <Link href="/student/attendance">
            <Button variant="outline" size="sm">
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartContainer config={chartConfig} className="h-48 md:h-64 w-full">
              <div />
            </ChartContainer>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm">Class Performance</h4>
            <div className="space-y-3">
              {enrolledClasses.map((cls) => (
                <div key={cls.id} className={`p-3 rounded-lg border ${cls.attendanceRate < 75 ? 'bg-red-50 border-red-200' : 'bg-white/50 border-stone-200/50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm truncate">{cls.name}</div>
                      <div className="text-xs text-muted-foreground">{cls.code}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{cls.attendanceRate}%</div>
                      <div className="text-xs text-muted-foreground">{cls.attendedSessions}/{cls.totalSessions}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

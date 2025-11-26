"use client";
import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import DashboardAttendanceChart from "./DashboardAttendanceChart";
import DashboardClassPerformance from "./DashboardClassPerformance";

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
          <DashboardAttendanceChart chartConfig={chartConfig} attendanceChartData={attendanceChartData} />

          <div className="lg:col-span-1">
            <DashboardClassPerformance enrolledClasses={enrolledClasses} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";
import React from "react";
import { ChartContainer } from "@/components/ui/chart";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

type Props = {
  chartConfig: any;
  attendanceChartData: any[];
};

export default function DashboardAttendanceChart({ chartConfig, attendanceChartData }: Props) {
  return (
    <div className="lg:col-span-2">
      <ChartContainer config={chartConfig} className="h-48 md:h-64 w-full">
        {Array.isArray(attendanceChartData) && attendanceChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceChartData} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Bar dataKey="attendance" fill={(chartConfig && chartConfig.attendance && chartConfig.attendance.color) || '#3182ce'} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No attendance data available</div>
        )}
      </ChartContainer>
    </div>
  );
}

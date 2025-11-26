"use client";
import React from "react";
import { ChartContainer } from "@/components/ui/chart";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';

type Props = {
  chartConfig: any;
  attendanceChartData: any[];
};

export default function DashboardAttendanceChart({ chartConfig, attendanceChartData }: Props) {
  // Aggregate totals across provided attendanceChartData
  const totals = (Array.isArray(attendanceChartData) ? attendanceChartData : []).reduce(
    (acc, item: any) => {
      acc.present += Number(item.attendance_present ?? item.present ?? 0) || 0;
      acc.late += Number(item.attendance_late ?? item.late ?? 0) || 0;
      acc.absent += Number(item.attendance_absent ?? item.absent ?? 0) || 0;
      acc.excused += Number(item.attendance_excused ?? item.excused ?? 0) || 0;
      return acc;
    },
    { present: 0, late: 0, absent: 0, excused: 0 }
  );

  const hasData = Object.values(totals).some((v) => Number(v) > 0);

  return (
    <div className="lg:col-span-2">
      <ChartContainer config={chartConfig} className="h-48 md:h-64 w-full p-4">
        {hasData ? (
          <div className="w-full h-full flex flex-col">
            {/* Small aggregate bar chart for totals */}
            <div className="mt-3 w-full h-56 md:h-48 lg:h-64">
              {(() => {
                // Keep the actual raw counts for labels/tooltips, but ensure a
                // minimal visible height for zero values by using `renderValue`.
                const summaryData = [
                  { rawValue: Number(totals.present || 0), name: 'Present', color: '#10b981' },
                  { rawValue: Number(totals.late || 0), name: 'Late', color: '#f59e0b' },
                  { rawValue: Number(totals.absent || 0), name: 'Absent', color: '#ef4444' },
                  { rawValue: Number(totals.excused || 0), name: 'Excused', color: '#6b7280' },
                ].map((d) => ({
                  name: d.name,
                  rawValue: d.rawValue,
                  // small non-zero render value so bars appear even when count == 0
                  renderValue: d.rawValue > 0 ? d.rawValue : 0.5,
                  color: d.color,
                }));

                // Determine the maximum raw value to set a sensible Y-axis domain.
                const maxRaw = Math.max(...summaryData.map((d) => Number(d.rawValue || 0)), 0);
                // Use a minimum domain so very small counts (0/1) don't produce overly-tall bars.
                const domainMax = Math.max(4, maxRaw);

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryData} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={true} domain={[0, domainMax]} />
                      <Tooltip formatter={(value: any, name: any, props: any) => {
                        // Show the raw value in the tooltip
                        const raw = props && props.payload ? props.payload.rawValue : value;
                        return `${raw}`;
                      }} />
                      <Bar dataKey="renderValue">
                        <LabelList dataKey="rawValue" position="top" />
                        {summaryData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No attendance data available</div>
        )}
      </ChartContainer>
    </div>
  );
}

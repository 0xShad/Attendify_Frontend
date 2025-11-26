"use client";
import React from "react";

type Props = {
  enrolledClasses: any[];
};

export default function DashboardClassPerformance({ enrolledClasses }: Props) {
  return (
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
  );
}

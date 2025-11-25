"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type AttendanceRecord = {
  id: string | number;
  classId: string;
  className: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Excused";
  sessionType: string;
  timestamp?: string | null;
  method?: string | null;
};

export default function AttendanceHistory({
  attendanceHistory,
}: {
  attendanceHistory: AttendanceRecord[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attendance</CardTitle>
        <CardDescription>Your attendance record for the past sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attendanceHistory.length === 0 ? (
            <div className="p-6 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading attendance history...
            </div>
          ) : (
            attendanceHistory.map((record) => (
              <div
                key={String(record.id)}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      record.status === "Present"
                        ? "bg-green-500"
                        : record.status === "Late"
                        ? "bg-yellow-500"
                        : record.status === "Absent"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="text-sm">
                    <div className="font-medium">{record.className}</div>
                    <div className="text-xs text-muted-foreground">{record.date} • {record.sessionType}</div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{record.status}</div>
                  <div className="text-xs text-muted-foreground">{record.timestamp ?? "—"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

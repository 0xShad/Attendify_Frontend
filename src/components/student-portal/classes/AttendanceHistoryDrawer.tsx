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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AttendanceRecord = {
  id: string;
  sessionDate: Date | string;
  status: string;
  sessionType: string;
  duration: number;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedAttendanceClass: any | null;
  attendanceHistory: AttendanceRecord[];
};

export default function AttendanceHistoryDrawer({
  open,
  onOpenChange,
  selectedAttendanceClass,
  attendanceHistory,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] mx-auto w-full max-w-2xl flex flex-col">
        <DrawerHeader className="px-4 pt-4 shrink-0">
          <DrawerTitle>
            Attendance History - {selectedAttendanceClass?.name}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto flex-1 min-h-0">
          {selectedAttendanceClass && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Class Code:</span>
                  <span className="text-sm font-medium">
                    {selectedAttendanceClass.code}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Instructor:</span>
                  <span className="text-sm font-medium">
                    {selectedAttendanceClass.instructor}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Attendance Rate:
                  </span>
                  <Badge
                    variant={
                      selectedAttendanceClass.attendanceRate >= 85
                        ? "default"
                        : "destructive"
                    }
                  >
                    {selectedAttendanceClass.attendanceRate}%
                  </Badge>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                {/* Desktop table: visible on sm+ */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-medium">Date</TableHead>
                        <TableHead className="font-medium">Status</TableHead>
                        <TableHead className="font-medium">Type</TableHead>
                        <TableHead className="font-medium">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {new Date(record.sessionDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.status === "Present"
                                  ? "default"
                                  : record.status === "Late"
                                  ? "secondary"
                                  : record.status === "Excused"
                                  ? "outline"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {record.sessionType}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {record.duration} min
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile list: visible on xs screens */}
                <div className="sm:hidden divide-y">
                  {attendanceHistory.map((record) => (
                    <div key={record.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">
                            {new Date(record.sessionDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {record.sessionType} • {record.duration} min
                          </div>
                        </div>
                        <div className="shrink-0">
                          <Badge
                            variant={
                              record.status === "Present"
                                ? "default"
                                : record.status === "Late"
                                ? "secondary"
                                : record.status === "Excused"
                                ? "outline"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-600">
                    {
                      attendanceHistory.filter((r) => r.status === "Present")
                        .length
                    }
                  </div>
                  <div className="text-xs text-green-600">Present</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {
                      attendanceHistory.filter((r) => r.status === "Late")
                        .length
                    }
                  </div>
                  <div className="text-xs text-yellow-600">Late</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {
                      attendanceHistory.filter((r) => r.status === "Excused")
                        .length
                    }
                  </div>
                  <div className="text-xs text-blue-600">Excused</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-red-600">
                    {
                      attendanceHistory.filter((r) => r.status === "Absent")
                        .length
                    }
                  </div>
                  <div className="text-xs text-red-600">Absent</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <DrawerFooter className="px-4 pb-4 shrink-0 border-t">
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

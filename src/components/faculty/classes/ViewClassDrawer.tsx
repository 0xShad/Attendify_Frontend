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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { UserPlus } from "lucide-react";
import { MoreVertical, Eye, Send, Trash2 } from "lucide-react";

type ClassMode = "Online" | "In-Person" | "Hybrid";

export interface ClassType {
  id: string;
  name: string;
  code: string;
  schedule: string;
  mode: ClassMode;
  enrolledStudents: number;
  totalSessions: number;
  completedSessions: number;
  attendanceRate: number;
  status: "Active" | "Inactive" | "Scheduled";
  location?: string;
  description?: string;
}

interface ViewClassDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass: ClassType | null;
  onOpenEnroll?: () => void;
  onViewStudent?: (student: { id: string; name: string; email: string }) => void;
}

const ViewClassDrawer: React.FC<ViewClassDrawerProps> = ({
  open,
  onOpenChange,
  selectedClass,
  onOpenEnroll,
  onViewStudent,
}) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{selectedClass?.name || "Class Details"}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {selectedClass && (
            <>
              {/* Class Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Class Information</h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class Code:</span>
                    <span className="font-medium">{selectedClass.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Schedule:</span>
                    <span className="font-medium">{selectedClass.schedule}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mode:</span>
                    <Badge variant="outline">{selectedClass.mode}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{selectedClass.location || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={selectedClass.status === "Active" ? "default" : "secondary"}>{selectedClass.status}</Badge>
                  </div>
                </div>
              </div>

              {/* Enrolled Students Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm text-muted-foreground">Enrolled Students ({selectedClass.enrolledStudents})</h3>
                  <Button size="sm" variant="outline" onClick={() => onOpenEnroll?.() }>
                    <UserPlus className="w-3 h-3 mr-1" />
                    Enroll
                  </Button>
                </div>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-right">Attendance</TableHead>
                        <TableHead className="w-[70px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: selectedClass.enrolledStudents }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{String(i + 1).padStart(2, "0")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-xs">{`S${i + 1}`}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">Student {i + 1}</div>
                                <div className="text-xs text-muted-foreground">student{i + 1}@university.edu</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-sm font-medium">{Math.floor(Math.random() * 20) + 80}%</div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewStudent?.({ id: `student-${i}`, name: `Student ${i + 1}`, email: `student${i + 1}@university.edu` })}>
                                  <Eye className="w-3 h-3 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Send className="w-3 h-3 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Recent Sessions</h3>
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <div>
                          <div className="text-sm font-medium">Session {selectedClass.completedSessions - i}</div>
                          <div className="text-xs text-muted-foreground">{new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">{Math.floor(Math.random() * 10) + 85}% attended</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ViewClassDrawer;

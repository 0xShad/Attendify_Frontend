"use client";

import React from "react";
import {
  IconSchool,
  IconMapPin,
  IconUsers,
  IconBooks,
  IconChalkboard,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import type { School } from "./types";

interface ViewSchoolDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: School | null;
}

export function ViewSchoolDrawer({
  open,
  onOpenChange,
  school,
}: ViewSchoolDrawerProps) {
  if (!school) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>School Details</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {/* Header Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
              <IconSchool className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{school.name}</h3>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <IconMapPin className="h-4 w-4" />
                <span>{school.location}</span>
              </div>
              <Badge
                variant={school.status === "Active" ? "secondary" : "outline"}
                className={
                  school.status === "Active"
                    ? "bg-green-50 text-green-700 border-green-200 mt-2"
                    : "mt-2"
                }
              >
                {school.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h4 className="font-semibold mb-3">About</h4>
            <p className="text-sm text-muted-foreground">
              {school.description}
            </p>
          </div>

          <Separator />

          {/* Academic Information */}
          {(school.accreditation || school.establishedYear || school.principalName || school.academicLevel) && (
            <>
              <div>
                <h4 className="font-semibold mb-3">Academic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {school.accreditation && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Accreditation</p>
                      <p className="text-sm mt-1">{school.accreditation}</p>
                    </div>
                  )}
                  {school.establishedYear && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Established Year</p>
                      <p className="text-sm mt-1">{school.establishedYear}</p>
                    </div>
                  )}
                  {school.principalName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Principal</p>
                      <p className="text-sm mt-1">{school.principalName}</p>
                    </div>
                  )}
                  {school.academicLevel && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Academic Level</p>
                      <p className="text-sm mt-1">{school.academicLevel}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Summary Statistics */}
          <div>
            <h4 className="font-semibold mb-4">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <IconSchool className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {school.totalPrograms || 0}
                </div>
                <div className="text-sm text-muted-foreground">Programs</div>
              </Card>
              <Card className="p-4 text-center">
                <IconBooks className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {school.totalCourses || 0}
                </div>
                <div className="text-sm text-muted-foreground">Courses</div>
              </Card>
              <Card className="p-4 text-center">
                <IconUsers className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {(school.totalStudents || 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Students</div>
              </Card>
              <Card className="p-4 text-center">
                <IconChalkboard className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {school.totalFaculty || 0}
                </div>
                <div className="text-sm text-muted-foreground">Faculty</div>
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

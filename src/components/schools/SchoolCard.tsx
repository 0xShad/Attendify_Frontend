"use client";

import React from "react";
import {
  IconSchool,
  IconMapPin,
  IconUsers,
  IconBooks,
  IconChalkboard,
  IconEye,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { School } from "./types";

interface SchoolCardProps {
  school: School;
  onView: (school: School) => void;
  onEdit: (school: School) => void;
  onDelete: (school: School) => void;
}

export function SchoolCard({ school, onView, onEdit, onDelete }: SchoolCardProps) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-stone-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <IconSchool className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-1">
                {school.name}
              </CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <IconMapPin className="h-3 w-3" />
                <span className="line-clamp-1">{school.location}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={school.status === "Active" ? "secondary" : "outline"}
              className={
                school.status === "Active"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : ""
              }
            >
              {school.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(school)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {school.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IconSchool className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Programs</span>
            </div>
            <div className="text-lg font-semibold">
              {school.totalPrograms || 0}
            </div>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IconBooks className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Courses</span>
            </div>
            <div className="text-lg font-semibold">
              {school.totalCourses || 0}
            </div>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IconUsers className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">Students</span>
            </div>
            <div className="text-lg font-semibold">
              {(school.totalStudents || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IconChalkboard className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-muted-foreground">Faculty</span>
            </div>
            <div className="text-lg font-semibold">
              {school.totalFaculty || 0}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-stone-100">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(school)}
          >
            <IconEye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(school)}
          >
            <IconEdit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

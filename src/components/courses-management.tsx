"use client";

import React, { useState } from "react";
import {
  IconBooks,
  IconFilter,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSchool,
  IconClock,
  IconCalendar,
  IconHash,
  IconLayoutColumns,
  IconChevronDown,
  IconDots,
  IconEye,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Course {
  id: string;
  code: string;
  title: string;
  program: string;
  units: number;
  hours: number;
  semester: string;
  yearLevel: string;
  status: "Active" | "Inactive";
  prerequisites?: string[];
  description?: string;
}

export function CoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: "CRS001",
      code: "CS101",
      title: "Introduction to Computer Science",
      program: "BSCS",
      units: 3,
      hours: 54,
      semester: "1st Semester",
      yearLevel: "1st Year",
      status: "Active",
      description: "Fundamental concepts of computer science and programming",
    },
    {
      id: "CRS002",
      code: "CS102",
      title: "Programming Fundamentals",
      program: "BSCS",
      units: 3,
      hours: 54,
      semester: "1st Semester",
      yearLevel: "1st Year",
      status: "Active",
      prerequisites: ["CS101"],
      description: "Introduction to programming using Python",
    },
    {
      id: "CRS003",
      code: "IT101",
      title: "Information Technology Fundamentals",
      program: "BSIT",
      units: 3,
      hours: 54,
      semester: "1st Semester",
      yearLevel: "1st Year",
      status: "Active",
      description: "Basic concepts of information technology",
    },
    {
      id: "CRS004",
      code: "CS201",
      title: "Data Structures and Algorithms",
      program: "BSCS",
      units: 4,
      hours: 72,
      semester: "1st Semester",
      yearLevel: "2nd Year",
      status: "Active",
      prerequisites: ["CS102"],
      description: "Advanced data structures and algorithm design",
    },
    {
      id: "CRS005",
      code: "MATH101",
      title: "College Algebra",
      program: "SHS-STEM",
      units: 3,
      hours: 54,
      semester: "1st Semester",
      yearLevel: "Grade 11",
      status: "Active",
      description: "Fundamental algebraic concepts for STEM students",
    },
    {
      id: "CRS006",
      code: "ENG101",
      title: "English Communication",
      program: "SHS-HUMSS",
      units: 3,
      hours: 54,
      semester: "1st Semester",
      yearLevel: "Grade 11",
      status: "Active",
      description: "Development of communication skills in English",
    },
    {
      id: "CRS007",
      code: "CS301",
      title: "Database Systems",
      program: "BSCS",
      units: 3,
      hours: 54,
      semester: "2nd Semester",
      yearLevel: "3rd Year",
      status: "Inactive",
      prerequisites: ["CS201"],
      description: "Database design and management systems",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [viewCourseOpen, setViewCourseOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    program: "",
    units: 3,
    hours: 54,
    semester: "1st Semester",
    yearLevel: "1st Year",
    status: "Active" as "Active" | "Inactive",
    description: "",
    prerequisites: [] as string[],
  });

  // Get unique programs for filter
  const programs = Array.from(new Set(courses.map((c) => c.program)));

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || course.status.toLowerCase() === statusFilter;
    const matchesProgram =
      programFilter === "all" || course.program === programFilter;

    return matchesSearch && matchesStatus && matchesProgram;
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Manage course curriculum and academic subjects
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 lg:px-0">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="h-4 w-4" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuCheckboxItem checked={true}>
                Course Code
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                Course Title
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                Program
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                Units/Hours
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                Semester
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                Year Level
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                Status
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddCourseOpen(true)}
          >
            <IconPlus className="h-4 w-4" />
            <span className="hidden lg:inline">Add Course</span>
          </Button>
        </div>
      </div>

      {/* Courses Table */}
      <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconBooks className="h-5 w-5" />
            Courses ({filteredCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 sticky top-0 z-10">
                <TableRow className="border-b-primary/20">
                  <TableHead className="text-primary font-medium">
                    Course Code
                  </TableHead>
                  <TableHead className="text-primary font-medium">
                    Course Title
                  </TableHead>
                  <TableHead className="text-primary font-medium">
                    Program
                  </TableHead>
                  <TableHead className="text-primary font-medium">
                    Units/Hours
                  </TableHead>
                  <TableHead className="text-primary font-medium">
                    Semester
                  </TableHead>
                  <TableHead className="text-primary font-medium">
                    Year Level
                  </TableHead>
                  <TableHead className="text-primary font-medium">
                    Status
                  </TableHead>
                  <TableHead className="text-primary font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow
                    key={course.id}
                    className="hover:bg-stone-50/50 transition-colors border-stone-200/50"
                  >
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono font-semibold"
                      >
                        {course.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{course.title}</div>
                        {course.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {course.description}
                          </div>
                        )}
                        {course.prerequisites &&
                          course.prerequisites.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Prerequisites:
                              </span>
                              <div className="flex gap-1">
                                {course.prerequisites.map((prereq) => (
                                  <Badge
                                    key={prereq}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {prereq}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconSchool className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary" className="font-mono">
                          {course.program}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <IconHash className="h-3 w-3 text-muted-foreground" />
                          <span>{course.units} units</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <IconClock className="h-3 w-3" />
                          <span>{course.hours} hours</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{course.semester}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {course.yearLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          course.status === "Active" ? "secondary" : "outline"
                        }
                        className={
                          course.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                            size="icon"
                          >
                            <IconDots className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCourse(course);
                              setViewCourseOpen(true);
                            }}
                          >
                            <IconEye className="w-4 h-4 mr-2" />
                            View Course
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCourse(course);
                              setFormData({
                                code: course.code,
                                title: course.title,
                                program: course.program,
                                units: course.units,
                                hours: course.hours,
                                semester: course.semester,
                                yearLevel: course.yearLevel,
                                status: course.status,
                                description: course.description || "",
                                prerequisites: course.prerequisites || [],
                              });
                              setEditCourseOpen(true);
                            }}
                          >
                            <IconEdit className="w-4 h-4 mr-2" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCourse(course);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <IconTrash className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <IconBooks className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary">
                  {courses.filter((c) => c.status === "Active").length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Courses
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <IconSchool className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary">
                  {programs.length}
                </div>
                <div className="text-sm text-muted-foreground">Programs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <IconHash className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary">
                  {courses.reduce((sum, c) => sum + c.units, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Units</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <IconClock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary">
                  {courses.reduce((sum, c) => sum + c.hours, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Course Drawer */}
      <Drawer open={addCourseOpen} onOpenChange={setAddCourseOpen}>
        <DrawerContent className="px-6 pb-6 max-h-[90vh]">
          <DrawerHeader className="px-0">
            <DrawerTitle>Add New Course</DrawerTitle>
            <DrawerDescription>
              Create a new course in the curriculum
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course-code">Course Code</Label>
                <Input
                  id="course-code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., CS101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Select
                  value={formData.program}
                  onValueChange={(value) =>
                    setFormData({ ...formData, program: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program} value={program}>
                        {program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-title">Course Title</Label>
              <Input
                id="course-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter course title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter course description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="units">Units</Label>
                <Input
                  id="units"
                  type="number"
                  value={formData.units}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      units: parseInt(e.target.value) || 0,
                    })
                  }
                  min="1"
                  max="6"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hours: parseInt(e.target.value) || 0,
                    })
                  }
                  min="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semester: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Semester">1st Semester</SelectItem>
                    <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year-level">Year Level</Label>
                <Select
                  value={formData.yearLevel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, yearLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grade 11">Grade 11</SelectItem>
                    <SelectItem value="Grade 12">Grade 12</SelectItem>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Active" | "Inactive") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter className="px-0 pt-4">
            <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button className="flex-1">Add Course</Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Course Drawer */}
      <Drawer open={editCourseOpen} onOpenChange={setEditCourseOpen}>
        <DrawerContent className="px-6 pb-6 max-h-[90vh]">
          <DrawerHeader className="px-0">
            <DrawerTitle>Edit Course</DrawerTitle>
            <DrawerDescription>
              Update course information and details
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-course-code">Course Code</Label>
                <Input
                  id="edit-course-code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., CS101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-program">Program</Label>
                <Select
                  value={formData.program}
                  onValueChange={(value) =>
                    setFormData({ ...formData, program: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program} value={program}>
                        {program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-course-title">Course Title</Label>
              <Input
                id="edit-course-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter course title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter course description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-units">Units</Label>
                <Input
                  id="edit-units"
                  type="number"
                  value={formData.units}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      units: parseInt(e.target.value) || 0,
                    })
                  }
                  min="1"
                  max="6"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hours">Hours</Label>
                <Input
                  id="edit-hours"
                  type="number"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hours: parseInt(e.target.value) || 0,
                    })
                  }
                  min="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-semester">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semester: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Semester">1st Semester</SelectItem>
                    <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-year-level">Year Level</Label>
                <Select
                  value={formData.yearLevel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, yearLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grade 11">Grade 11</SelectItem>
                    <SelectItem value="Grade 12">Grade 12</SelectItem>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Active" | "Inactive") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter className="px-0 pt-4">
            <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button className="flex-1">Save Changes</Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* View Course Drawer */}
      <Drawer open={viewCourseOpen} onOpenChange={setViewCourseOpen}>
        <DrawerContent className="px-6 pb-6 max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Course Details</DrawerTitle>
            <DrawerDescription>
              View comprehensive information about this course.
            </DrawerDescription>
          </DrawerHeader>

          {selectedCourse && (
            <div className="space-y-6 overflow-y-auto flex-1">
              {/* Course Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                  <IconBooks className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {selectedCourse.title}
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      Course Code:{" "}
                      <span className="font-medium text-foreground">
                        {selectedCourse.code}
                      </span>
                    </div>
                    <div>
                      Program:{" "}
                      <span className="font-medium text-foreground">
                        {selectedCourse.program}
                      </span>
                    </div>
                    <div>
                      Status:{" "}
                      <Badge
                        variant={
                          selectedCourse.status === "Active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedCourse.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Information Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <IconHash className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-primary">
                    {selectedCourse.units}
                  </div>
                  <div className="text-sm text-muted-foreground">Units</div>
                </Card>
                <Card className="p-4 text-center">
                  <IconClock className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-primary">
                    {selectedCourse.hours}
                  </div>
                  <div className="text-sm text-muted-foreground">Hours</div>
                </Card>
                <Card className="p-4 text-center">
                  <IconCalendar className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-semibold text-primary">
                    {selectedCourse.semester}
                  </div>
                  <div className="text-sm text-muted-foreground">Semester</div>
                </Card>
                <Card className="p-4 text-center">
                  <IconSchool className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-semibold text-primary">
                    {selectedCourse.yearLevel}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Year Level
                  </div>
                </Card>
              </div>

              {/* Description */}
              {selectedCourse.description && (
                <div>
                  <h4 className="font-semibold mb-2">Course Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedCourse.description}
                  </p>
                </div>
              )}

              {/* Prerequisites */}
              {selectedCourse.prerequisites &&
                selectedCourse.prerequisites.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Prerequisites</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourse.prerequisites.map((prereq, index) => (
                        <Badge key={index} variant="outline">
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DrawerFooter>
            <div className="flex gap-3 max-w-md mx-auto w-full">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">
                  Close
                </Button>
              </DrawerClose>
              <Button
                className="flex-1"
                onClick={() => {
                  if (selectedCourse) {
                    setFormData({
                      code: selectedCourse.code,
                      title: selectedCourse.title,
                      program: selectedCourse.program,
                      units: selectedCourse.units,
                      hours: selectedCourse.hours,
                      semester: selectedCourse.semester,
                      yearLevel: selectedCourse.yearLevel,
                      status: selectedCourse.status,
                      description: selectedCourse.description || "",
                      prerequisites: selectedCourse.prerequisites || [],
                    });
                    setViewCourseOpen(false);
                    setEditCourseOpen(true);
                  }
                }}
              >
                Edit Course
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {selectedCourse && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <IconBooks className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-red-900">
                      {selectedCourse.code} - {selectedCourse.title}
                    </div>
                    <div className="text-sm text-red-700">
                      {selectedCourse.program} • {selectedCourse.yearLevel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedCourse) {
                  console.log("Delete course:", selectedCourse.id);
                  setDeleteDialogOpen(false);
                  setSelectedCourse(null);
                }
              }}
            >
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

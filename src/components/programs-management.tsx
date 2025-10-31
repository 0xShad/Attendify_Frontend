"use client";

import React, { useState } from "react";
import {
  IconSchool,
  IconFilter,
  IconPlus,
  IconEye,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconClock,
  IconLayoutColumns,
  IconChevronDown,
  IconDots,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Program {
  id: string;
  name: string;
  code: string;
  school: string;
  duration: string;
  status: "Active" | "Inactive";
  totalStudents: number;
  totalCourses: number;
  description?: string;
}

export function ProgramsManagement() {
  const [programs, setPrograms] = useState<Program[]>([
    {
      id: "PROG001",
      name: "Bachelor of Science in Computer Science",
      code: "BSCS",
      school: "Quezon City University",
      duration: "4 Years",
      status: "Active",
      totalStudents: 320,
      totalCourses: 45,
      description: "Comprehensive computer science program covering software development, algorithms, and system design",
    },
    {
      id: "PROG002",
      name: "Bachelor of Science in Information Technology",
      code: "BSIT",
      school: "Quezon City University",
      duration: "4 Years",
      status: "Active",
      totalStudents: 285,
      totalCourses: 42,
      description: "IT program focusing on technology applications and system management",
    },
    {
      id: "PROG003",
      name: "Master of Science in Computer Science",
      code: "MSCS",
      school: "Quezon City University",
      duration: "2 Years",
      status: "Active",
      totalStudents: 45,
      totalCourses: 18,
      description: "Graduate program for advanced computer science research and development",
    },
    {
      id: "PROG004",
      name: "Senior High School - Science, Technology, Engineering and Mathematics",
      code: "SHS-STEM",
      school: "Lagro High School",
      duration: "2 Years",
      status: "Active",
      totalStudents: 450,
      totalCourses: 12,
      description: "Senior high school program preparing students for STEM careers",
    },
    {
      id: "PROG005",
      name: "Senior High School - Humanities and Social Sciences",
      code: "SHS-HUMSS",
      school: "Lagro High School",
      duration: "2 Years",
      status: "Active",
      totalStudents: 380,
      totalCourses: 10,
      description: "Senior high school program focusing on humanities and social sciences",
    },
    {
      id: "PROG006",
      name: "Bachelor of Arts in Communication",
      code: "BAC",
      school: "Quezon City University",
      duration: "4 Years",
      status: "Inactive",
      totalStudents: 0,
      totalCourses: 35,
      description: "Communication arts program currently under review",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [addProgramOpen, setAddProgramOpen] = useState(false);
  const [viewProgramOpen, setViewProgramOpen] = useState(false);
  const [editProgramOpen, setEditProgramOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    school: "",
    duration: "4 Years",
    status: "Active" as "Active" | "Inactive",
    description: "",
  });

  // Get unique schools for filter
  const schools = Array.from(new Set(programs.map(p => p.school)));

  // Filter programs
  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || program.status.toLowerCase() === statusFilter;
    const matchesSchool = schoolFilter === "all" || program.school === schoolFilter;
    
    return matchesSearch && matchesStatus && matchesSchool;
  });



  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
          <p className="text-muted-foreground">
            Manage academic programs and degree courses
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 lg:px-0">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search programs..."
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
                Program Name
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                Code
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                School
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                Duration
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                Students
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                Courses
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={true}>
                Status
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setAddProgramOpen(true)}>
            <IconPlus className="h-4 w-4" />
            <span className="hidden lg:inline">Add Program</span>
          </Button>
        </div>
      </div>

      {/* Programs Table */}
      <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconSchool className="h-5 w-5" />
            Programs ({filteredPrograms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 sticky top-0 z-10">
                <TableRow className="border-b-primary/20">
                  <TableHead className="text-primary font-medium">Program Name</TableHead>
                  <TableHead className="text-primary font-medium">Code</TableHead>
                  <TableHead className="text-primary font-medium">School</TableHead>
                  <TableHead className="text-primary font-medium">Duration</TableHead>
                  <TableHead className="text-primary font-medium">Students</TableHead>
                  <TableHead className="text-primary font-medium">Courses</TableHead>
                  <TableHead className="text-primary font-medium">Status</TableHead>
                  <TableHead className="text-primary font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.map((program) => (
                  <TableRow
                    key={program.id}
                    className="hover:bg-stone-50/50 transition-colors border-stone-200/50"
                  >
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{program.name}</div>
                        {program.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {program.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {program.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconSchool className="h-4 w-4 text-muted-foreground" />
                        <span className="line-clamp-1">{program.school}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                        <span>{program.duration}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{program.totalStudents}</div>
                        <div className="text-xs text-muted-foreground">enrolled</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{program.totalCourses}</div>
                        <div className="text-xs text-muted-foreground">courses</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={program.status === "Active" ? "secondary" : "outline"}
                        className={
                          program.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {program.status}
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
                              setSelectedProgram(program);
                              setViewProgramOpen(true);
                            }}
                          >
                            <IconEye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProgram(program);
                              setFormData({
                                name: program.name,
                                code: program.code,
                                school: program.school,
                                duration: program.duration,
                                status: program.status,
                                description: program.description || "",
                              });
                              setEditProgramOpen(true);
                            }}
                          >
                            <IconEdit className="w-4 h-4 mr-2" />
                            Edit Program
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProgram(program);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <IconSchool className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary">{programs.filter(p => p.status === "Active").length}</div>
                <div className="text-sm text-muted-foreground">Active Programs</div>
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
                <div className="text-2xl font-semibold text-primary">{programs.reduce((sum, p) => sum + p.totalStudents, 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-stone-200/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <IconCalendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary">{programs.reduce((sum, p) => sum + p.totalCourses, 0)}</div>
                <div className="text-sm text-muted-foreground">Total Courses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Program Drawer */}
      <Drawer open={addProgramOpen} onOpenChange={setAddProgramOpen}>
        <DrawerContent className="px-6 pb-6 max-h-[90vh]">
          <DrawerHeader className="px-0">
            <DrawerTitle>Add New Program</DrawerTitle>
            <DrawerDescription>
              Create a new academic program
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="program-name">Program Name</Label>
              <Input
                id="program-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter program name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program-code">Program Code</Label>
                <Input
                  id="program-code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g., BSCS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Select value={formData.school} onValueChange={(value) => setFormData({...formData, school: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={formData.duration} onValueChange={(value) => setFormData({...formData, duration: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2 Years">2 Years</SelectItem>
                    <SelectItem value="4 Years">4 Years</SelectItem>
                    <SelectItem value="5 Years">5 Years</SelectItem>
                    <SelectItem value="6 Years">6 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: "Active" | "Inactive") => setFormData({...formData, status: value})}>
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
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter program description"
                rows={3}
              />
            </div>
          </div>
          <DrawerFooter className="px-0 pt-4">
            <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">Cancel</Button>
              </DrawerClose>
              <Button className="flex-1">Add Program</Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* View Program Details Drawer */}
      <Drawer open={viewProgramOpen} onOpenChange={setViewProgramOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Program Details</DrawerTitle>
          </DrawerHeader>
          
          {selectedProgram && (
            <div className="px-4 pb-4 space-y-6 overflow-y-auto">
              {/* Header Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                  <IconSchool className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedProgram.name}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Badge variant="outline" className="font-mono">
                      {selectedProgram.code}
                    </Badge>
                    <span>•</span>
                    <span>{selectedProgram.school}</span>
                  </div>
                  <Badge
                    variant={selectedProgram.status === "Active" ? "secondary" : "outline"}
                    className={
                      selectedProgram.status === "Active"
                        ? "bg-green-50 text-green-700 border-green-200 mt-2"
                        : "mt-2"
                    }
                  >
                    {selectedProgram.status}
                  </Badge>
                </div>
              </div>

              {selectedProgram.description && (
                <div>
                  <h4 className="font-semibold mb-3">About Program</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedProgram.description}
                  </p>
                </div>
              )}

              {/* Program Statistics */}
              <div>
                <h4 className="font-semibold mb-4">Program Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <IconClock className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-semibold text-primary">{selectedProgram.duration}</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <IconSchool className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-semibold text-primary">{selectedProgram.totalCourses}</div>
                    <div className="text-sm text-muted-foreground">Total Courses</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <IconSchool className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-semibold text-primary">{selectedProgram.totalStudents}</div>
                    <div className="text-sm text-muted-foreground">Enrolled Students</div>
                  </Card>
                </div>
              </div>
            </div>
          )}
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Program Drawer */}
      <Drawer open={editProgramOpen} onOpenChange={setEditProgramOpen}>
        <DrawerContent className="px-6 pb-6 max-h-[90vh]">
          <DrawerHeader className="px-0">
            <DrawerTitle>Edit Program</DrawerTitle>
            <DrawerDescription>
              Update program information and details
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-program-name">Program Name</Label>
              <Input
                id="edit-program-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter program name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-program-code">Program Code</Label>
                <Input
                  id="edit-program-code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g., BSCS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-school">School</Label>
                <Select value={formData.school} onValueChange={(value) => setFormData({...formData, school: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Select value={formData.duration} onValueChange={(value) => setFormData({...formData, duration: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2 Years">2 Years</SelectItem>
                    <SelectItem value="4 Years">4 Years</SelectItem>
                    <SelectItem value="5 Years">5 Years</SelectItem>
                    <SelectItem value="6 Years">6 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: "Active" | "Inactive") => setFormData({...formData, status: value})}>
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
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter program description"
                rows={3}
              />
            </div>
          </div>
          <DrawerFooter className="px-0 pt-4">
            <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">Cancel</Button>
              </DrawerClose>
              <Button className="flex-1">Save Changes</Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this program? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProgram && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <IconSchool className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-red-900">{selectedProgram.name}</div>
                    <div className="text-sm text-red-700">{selectedProgram.code} • {selectedProgram.school}</div>
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
                if (selectedProgram) {
                  console.log("Delete program:", selectedProgram.id);
                  setDeleteDialogOpen(false);
                  setSelectedProgram(null);
                }
              }}
            >
              Delete Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
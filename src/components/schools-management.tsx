"use client";

import React, { useState } from "react";
import {
  IconSchool,
  IconMapPin,
  IconUsers,
  IconBooks,
  IconChalkboard,
  IconEye,
  IconEdit,
  IconFilter,
  IconPlus,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface School {
  id: string;
  name: string;
  location: string;
  description: string;
  logo?: string;
  address: string;
  contact: string;
  email: string;
  totalPrograms: number;
  totalCourses: number;
  totalStudents: number;
  totalFaculty: number;
  status: "Active" | "Inactive";
}

export function SchoolsManagement() {
  const [schools, setSchools] = useState<School[]>([
    {
      id: "SCH001",
      name: "Quezon City University",
      location: "Quezon City, Philippines",
      description:
        "Leading public university in Quezon City with comprehensive academic programs",
      address: "673 Quirino Highway, San Bartolome, Novaliches, Quezon City",
      contact: "+63 2 8806 3000",
      email: "info@qcu.edu.ph",
      totalPrograms: 12,
      totalCourses: 156,
      totalStudents: 8420,
      totalFaculty: 245,
      status: "Active",
    },
    {
      id: "SCH002",
      name: "Lagro High School",
      location: "Lagro, Quezon City",
      description:
        "Excellence in secondary education with modern facilities and quality teaching",
      address: "Commonwealth Ave, Lagro, Quezon City",
      contact: "+63 2 8952 4567",
      email: "admin@lagrohighschool.edu.ph",
      totalPrograms: 3,
      totalCourses: 24,
      totalStudents: 1200,
      totalFaculty: 45,
      status: "Active",
    },
  ]);

  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [addSchoolOpen, setAddSchoolOpen] = useState(false);
  const [viewSchoolOpen, setViewSchoolOpen] = useState(false);
  const [editSchoolOpen, setEditSchoolOpen] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    address: "",
    contact: "",
    email: "",
    status: "Active" as "Active" | "Inactive",
  });

  // Filter schools
  const filteredSchools = schools.filter((school) => {
    const matchesStatus =
      statusFilter === "all" || school.status.toLowerCase() === statusFilter;
    const matchesLocation =
      locationFilter === "all" || school.location.includes(locationFilter);
    return matchesStatus && matchesLocation;
  });

  const handleViewSchool = (school: School) => {
    setSelectedSchool(school);
    setViewSchoolOpen(true);
  };

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setFormData({
      name: school.name,
      location: school.location,
      description: school.description,
      address: school.address,
      contact: school.contact,
      email: school.email,
      status: school.status,
    });
    setEditSchoolOpen(true);
  };

  const handleAddSchool = () => {
    // Add school logic here
    console.log("Add school:", formData);
    setAddSchoolOpen(false);
    resetForm();
  };

  const handleSaveEdit = () => {
    // Save edit logic here
    console.log("Save edit:", formData);
    setEditSchoolOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      description: "",
      address: "",
      contact: "",
      email: "",
      status: "Active",
    });
    setSelectedSchool(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schools</h1>
          <p className="text-muted-foreground">
            Manage universities and institutions using Attendify
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <IconFilter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DrawerTrigger>
            <DrawerContent className="px-6 pb-6">
              <DrawerHeader className="px-0">
                <DrawerTitle>Filter Schools</DrawerTitle>
                <DrawerDescription>
                  Configure filters to refine the schools display
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="status-filter"
                    className="text-sm font-medium"
                  >
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="location-filter"
                    className="text-sm font-medium"
                  >
                    Location
                  </Label>
                  <Select
                    value={locationFilter}
                    onValueChange={setLocationFilter}
                  >
                    <SelectTrigger id="location-filter" className="w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Quezon City">Quezon City</SelectItem>
                      <SelectItem value="Lagro">Lagro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DrawerFooter className="px-0 pt-4">
                <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStatusFilter("all");
                      setLocationFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                  <DrawerClose asChild>
                    <Button className="flex-1">Apply Filters</Button>
                  </DrawerClose>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <Drawer open={addSchoolOpen} onOpenChange={setAddSchoolOpen}>
            <DrawerTrigger asChild>
              <Button size="sm">
                <IconPlus className="h-4 w-4 mr-2" />
                Add New School
              </Button>
            </DrawerTrigger>
            <DrawerContent className="px-6 pb-6">
              <DrawerHeader className="px-0">
                <DrawerTitle>Add New School</DrawerTitle>
                <DrawerDescription>
                  Create a new school in the Attendify system
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">School Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter school name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Enter location"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter school description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Enter full address"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number</Label>
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) =>
                        setFormData({ ...formData, contact: e.target.value })
                      }
                      placeholder="Enter contact number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter email address"
                    />
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
                  <Button onClick={handleAddSchool} className="flex-1">
                    Add School
                  </Button>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map((school) => (
          <Card
            key={school.id}
            className="group hover:shadow-md transition-all duration-200 border-stone-200/50 bg-white/80 backdrop-blur-sm"
          >
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
                    <span className="text-xs text-muted-foreground">
                      Programs
                    </span>
                  </div>
                  <div className="text-lg font-semibold">
                    {school.totalPrograms}
                  </div>
                </div>
                <div className="bg-stone-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <IconBooks className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">
                      Courses
                    </span>
                  </div>
                  <div className="text-lg font-semibold">
                    {school.totalCourses}
                  </div>
                </div>
                <div className="bg-stone-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <IconUsers className="h-4 w-4 text-purple-600" />
                    <span className="text-xs text-muted-foreground">
                      Students
                    </span>
                  </div>
                  <div className="text-lg font-semibold">
                    {school.totalStudents.toLocaleString()}
                  </div>
                </div>
                <div className="bg-stone-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <IconChalkboard className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-muted-foreground">
                      Faculty
                    </span>
                  </div>
                  <div className="text-lg font-semibold">
                    {school.totalFaculty}
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
                  onClick={() => handleViewSchool(school)}
                >
                  <IconEye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditSchool(school)}
                >
                  <IconEdit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* View School Details Drawer */}
      <Drawer open={viewSchoolOpen} onOpenChange={setViewSchoolOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>School Details</DrawerTitle>
          </DrawerHeader>

          {selectedSchool && (
            <div className="px-4 pb-4 space-y-6 overflow-y-auto">
              {/* Header Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <IconSchool className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {selectedSchool.name}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <IconMapPin className="h-4 w-4" />
                    <span>{selectedSchool.location}</span>
                  </div>
                  <Badge
                    variant={
                      selectedSchool.status === "Active"
                        ? "secondary"
                        : "outline"
                    }
                    className={
                      selectedSchool.status === "Active"
                        ? "bg-green-50 text-green-700 border-green-200 mt-2"
                        : "mt-2"
                    }
                  >
                    {selectedSchool.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h4 className="font-semibold mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Address:</strong> {selectedSchool.address}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedSchool.contact}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedSchool.email}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-3">About</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedSchool.description}
                </p>
              </div>

              <Separator />

              {/* Summary Statistics */}
              <div>
                <h4 className="font-semibold mb-4">Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 text-center">
                    <IconSchool className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {selectedSchool.totalPrograms}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Programs
                    </div>
                  </Card>
                  <Card className="p-4 text-center">
                    <IconBooks className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {selectedSchool.totalCourses}
                    </div>
                    <div className="text-sm text-muted-foreground">Courses</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <IconUsers className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {selectedSchool.totalStudents.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Students
                    </div>
                  </Card>
                  <Card className="p-4 text-center">
                    <IconChalkboard className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {selectedSchool.totalFaculty}
                    </div>
                    <div className="text-sm text-muted-foreground">Faculty</div>
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

      {/* Edit School Drawer */}
      <Drawer open={editSchoolOpen} onOpenChange={setEditSchoolOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Edit School</DrawerTitle>
            <DrawerDescription>
              Update school information and details
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">School Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter school name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Enter location"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter school description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter full address"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contact">Contact Number</Label>
                <Input
                  id="edit-contact"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  placeholder="Enter contact number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
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
          <DrawerFooter>
            <div className="flex gap-3 max-w-md mx-auto w-full">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button onClick={handleSaveEdit} className="flex-1">
                Save Changes
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

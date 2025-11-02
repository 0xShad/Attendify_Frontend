"use client";

import React, { useState, useEffect } from "react";
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
  IconTrash,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { schoolsAPI } from "@/lib/api";
import type { School as APISchool } from "@/lib/api/schools";

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
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [addSchoolOpen, setAddSchoolOpen] = useState(false);
  const [viewSchoolOpen, setViewSchoolOpen] = useState(false);
  const [editSchoolOpen, setEditSchoolOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
  });

  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiSchools = await schoolsAPI.listSchools();
        
        // Transform API schools to component School format
        const transformedSchools: School[] = apiSchools.map((apiSchool) => ({
          id: apiSchool.id.toString(),
          name: apiSchool.name,
          location: apiSchool.address || "No address provided",
          description: apiSchool.description || "No description available",
          address: apiSchool.address || "No address provided",
          contact: "N/A", // Not provided by API
          email: "N/A", // Not provided by API
          totalPrograms: apiSchool.programs_count,
          totalCourses: apiSchool.courses_count,
          totalStudents: apiSchool.students_count,
          totalFaculty: apiSchool.faculty_count,
          status: "Active" as const,
        }));
        
        setSchools(transformedSchools);
      } catch (err) {
        console.error("Failed to fetch schools:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch schools");
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  // Filter schools
  const filteredSchools = schools.filter((school) => {
    const matchesStatus =
      statusFilter === "all" || school.status.toLowerCase() === statusFilter;
    const matchesLocation =
      locationFilter === "all" || school.location.includes(locationFilter);
    return matchesStatus && matchesLocation;
  });

  const handleViewSchool = async (school: School) => {
    try {
      // Fetch full school details from API
      const fullSchoolDetails = await schoolsAPI.getSchool(parseInt(school.id));
      
      // Transform API response to component School format
      const transformedSchool: School = {
        id: fullSchoolDetails.id.toString(),
        name: fullSchoolDetails.name,
        location: fullSchoolDetails.address || "No address provided",
        description: fullSchoolDetails.description || "No description available",
        address: fullSchoolDetails.address || "No address provided",
        contact: school.contact || "N/A",
        email: school.email || "N/A",
        totalPrograms: fullSchoolDetails.programs_count,
        totalCourses: fullSchoolDetails.courses_count,
        totalStudents: fullSchoolDetails.students_count,
        totalFaculty: fullSchoolDetails.faculty_count,
        status: school.status,
      };
      
      setSelectedSchool(transformedSchool);
      setViewSchoolOpen(true);
    } catch (err) {
      console.error("Failed to fetch school details:", err);
      // Fallback to using the school data we already have
      setSelectedSchool(school);
      setViewSchoolOpen(true);
    }
  };

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setFormData({
      name: school.name,
      address: school.address,
      description: school.description,
    });
    setEditSchoolOpen(true);
  };

  const handleAddSchool = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert("School name is required");
        return;
      }

      // Create school via API
      const payload: { name: string; address?: string; description?: string } = {
        name: formData.name.trim(),
      };
      
      // Only include optional fields if they have values
      if (formData.address && formData.address.trim()) {
        payload.address = formData.address.trim();
      }
      
      if (formData.description && formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      const newSchool = await schoolsAPI.createSchool(payload);

      // Transform and add to local state
      const transformedSchool: School = {
        id: newSchool.id.toString(),
        name: newSchool.name,
        location: newSchool.address || "No address provided",
        description: newSchool.description || "No description available",
        address: newSchool.address || "No address provided",
        contact: "N/A",
        email: "N/A",
        totalPrograms: newSchool.programs_count,
        totalCourses: newSchool.courses_count,
        totalStudents: newSchool.students_count,
        totalFaculty: newSchool.faculty_count,
        status: "Active" as const,
      };

      setSchools([...schools, transformedSchool]);
      setAddSchoolOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to create school:", err);
      alert(err instanceof Error ? err.message : "Failed to create school");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedSchool) return;

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert("School name is required");
        return;
      }

      // Update school via API - only send fields that have values
      const payload: { name?: string; address?: string; description?: string } = {};
      
      if (formData.name && formData.name.trim()) {
        payload.name = formData.name.trim();
      }
      
      if (formData.address !== undefined && formData.address.trim()) {
        payload.address = formData.address.trim();
      }
      
      if (formData.description !== undefined && formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      const updatedSchool = await schoolsAPI.updateSchool(
        parseInt(selectedSchool.id),
        payload
      );

      // Transform and update local state
      const transformedSchool: School = {
        id: updatedSchool.id.toString(),
        name: updatedSchool.name,
        location: updatedSchool.address || "No address provided",
        description: updatedSchool.description || "No description available",
        address: updatedSchool.address || "No address provided",
        contact: selectedSchool.contact,
        email: selectedSchool.email,
        totalPrograms: updatedSchool.programs_count,
        totalCourses: updatedSchool.courses_count,
        totalStudents: updatedSchool.students_count,
        totalFaculty: updatedSchool.faculty_count,
        status: selectedSchool.status,
      };

      setSchools(
        schools.map((s) => (s.id === selectedSchool.id ? transformedSchool : s))
      );
      setEditSchoolOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to update school:", err);
      alert(err instanceof Error ? err.message : "Failed to update school");
    }
  };

  const handleDeleteClick = (school: School) => {
    setSchoolToDelete(school);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;

    try {
      setDeleteError(null);
      await schoolsAPI.deleteSchool(parseInt(schoolToDelete.id));
      
      // Remove from local state
      setSchools(schools.filter((s) => s.id !== schoolToDelete.id));
      setDeleteDialogOpen(false);
      setSchoolToDelete(null);
    } catch (err) {
      console.error("Failed to delete school:", err);
      
      // Extract error message from API response
      let errorMessage = "Failed to delete school";
      
      if (err instanceof Error) {
        try {
          // Try to parse the error message as JSON (if it's a fetch error with detail)
          const errorText = err.message;
          if (errorText.includes("program(s)")) {
            errorMessage = errorText;
          } else if (errorText.includes("profile(s)")) {
            errorMessage = errorText;
          } else if (errorText.includes("not found")) {
            errorMessage = "School not found";
          } else {
            errorMessage = errorText;
          }
        } catch {
          errorMessage = err.message;
        }
      }
      
      setDeleteError(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      description: "",
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
                <div className="space-y-2">
                  <Label htmlFor="name">
                    School Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter school name"
                    required
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground">Loading schools...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-800">
              <IconSchool className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Failed to load schools</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schools Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <IconSchool className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No schools found</h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by adding your first school
                    </p>
                    <Button onClick={() => setAddSchoolOpen(true)}>
                      <IconPlus className="h-4 w-4 mr-2" />
                      Add School
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredSchools.map((school) => (
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
                    onClick={() => handleDeleteClick(school)}
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
                    <span className="text-xs text-muted-foreground">
                      Programs
                    </span>
                  </div>
                  <div className="text-lg font-semibold">
                    {school.totalPrograms || 0}
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
                    {school.totalCourses || 0}
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
                    {(school.totalStudents || 0).toLocaleString()}
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
        ))
          )}
        </div>
      )}

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
                      {selectedSchool.totalPrograms || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Programs
                    </div>
                  </Card>
                  <Card className="p-4 text-center">
                    <IconBooks className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {selectedSchool.totalCourses || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Courses</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <IconUsers className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {(selectedSchool.totalStudents || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Students
                    </div>
                  </Card>
                  <Card className="p-4 text-center">
                    <IconChalkboard className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {selectedSchool.totalFaculty || 0}
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
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                School Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter school name"
                required
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete School</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this school? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {schoolToDelete && (
            <div className="py-4">
              <div className="bg-stone-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <IconSchool className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{schoolToDelete.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {schoolToDelete.location}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Programs:</span>{" "}
                    <span className="font-medium">{schoolToDelete.totalPrograms || 0}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Courses:</span>{" "}
                    <span className="font-medium">{schoolToDelete.totalCourses || 0}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Students:</span>{" "}
                    <span className="font-medium">{schoolToDelete.totalStudents || 0}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Faculty:</span>{" "}
                    <span className="font-medium">{schoolToDelete.totalFaculty || 0}</span>
                  </div>
                </div>
              </div>

              {deleteError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <IconTrash className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900">Cannot Delete School</h4>
                      <p className="text-sm text-red-700 mt-1">{deleteError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSchoolToDelete(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={!!deleteError}
            >
              <IconTrash className="h-4 w-4 mr-2" />
              Delete School
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

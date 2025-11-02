"use client";

import React, { useState, useEffect } from "react";
import { schoolsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { School, SchoolFormData } from "./types";
import { SchoolCard } from "./SchoolCard";
import { SchoolFilters } from "./SchoolFilters";
import { AddSchoolDrawer } from "./AddSchoolDrawer";
import { ViewSchoolDrawer } from "./ViewSchoolDrawer";
import { EditSchoolDrawer } from "./EditSchoolDrawer";
import { DeleteSchoolDialog } from "./DeleteSchoolDialog";
import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

export function SchoolsManagement() {
  const { toast } = useToast();
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
  const [formData, setFormData] = useState<SchoolFormData>({
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
        setError(
          err instanceof Error ? err.message : "Failed to fetch schools"
        );
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
        toast({
          title: "Validation Error",
          description: "School name is required",
          variant: "destructive",
        });
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
      
      toast({
        title: "Success",
        description: `School "${newSchool.name}" has been created successfully`,
      });
    } catch (err) {
      let errorMessage = "An unexpected error occurred";
      let errorTitle = "Failed to Create School";

      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Customize title based on error type
        if (errorMessage.toLowerCase().includes("already exists")) {
          errorTitle = "School Already Exists";
        } else if (errorMessage.toLowerCase().includes("validation")) {
          errorTitle = "Validation Error";
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedSchool) return;

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast({
          title: "Validation Error",
          description: "School name is required",
          variant: "destructive",
        });
        return;
      }

      // Update school via API - only send fields that have values
      const payload: { name?: string; address?: string; description?: string } =
        {};

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
      
      toast({
        title: "Success",
        description: `School "${updatedSchool.name}" has been updated successfully`,
      });
    } catch (err) {
      let errorMessage = "An unexpected error occurred";
      let errorTitle = "Failed to Update School";

      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Customize title based on error type
        if (errorMessage.toLowerCase().includes("not found")) {
          errorTitle = "School Not Found";
        } else if (errorMessage.toLowerCase().includes("already exists")) {
          errorTitle = "Name Already Exists";
        } else if (errorMessage.toLowerCase().includes("validation")) {
          errorTitle = "Validation Error";
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
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
      const schoolName = schoolToDelete.name;
      await schoolsAPI.deleteSchool(parseInt(schoolToDelete.id));

      // Remove from local state
      setSchools(schools.filter((s) => s.id !== schoolToDelete.id));
      setDeleteDialogOpen(false);
      setSchoolToDelete(null);
      
      toast({
        title: "Success",
        description: `School "${schoolName}" has been deleted successfully`,
      });
    } catch (err) {
      // Extract error message from API response
      let errorMessage = "Failed to delete school";
      let errorTitle = "Failed to Delete School";

      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Customize title based on error type for better UX
        if (errorMessage.includes("program(s) associated")) {
          errorTitle = "Cannot Delete School";
        } else if (errorMessage.includes("profile(s) associated")) {
          errorTitle = "Cannot Delete School";
        } else if (errorMessage.toLowerCase().includes("not found")) {
          errorTitle = "School Not Found";
          errorMessage = "The school you're trying to delete was not found.";
        }
      }

      // Show error in dialog (keeps it visible for user to read)
      setDeleteError(errorMessage);
      
      // Also show toast notification (temporary notification)
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
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

  const handleClearFilters = () => {
    setStatusFilter("all");
    setLocationFilter("all");
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
          <SchoolFilters
            open={filterOpen}
            onOpenChange={setFilterOpen}
            statusFilter={statusFilter}
            locationFilter={locationFilter}
            onStatusFilterChange={setStatusFilter}
            onLocationFilterChange={setLocationFilter}
            onClearFilters={handleClearFilters}
          />
          <AddSchoolDrawer
            open={addSchoolOpen}
            onOpenChange={setAddSchoolOpen}
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={handleAddSchool}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* Error State */}
      {error && !loading && <ErrorState error={error} />}

      {/* Schools Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.length === 0 ? (
            <EmptyState onAddSchool={() => setAddSchoolOpen(true)} />
          ) : (
            filteredSchools.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                onView={handleViewSchool}
                onEdit={handleEditSchool}
                onDelete={handleDeleteClick}
              />
            ))
          )}
        </div>
      )}

      {/* Drawers and Dialogs */}
      <ViewSchoolDrawer
        open={viewSchoolOpen}
        onOpenChange={setViewSchoolOpen}
        school={selectedSchool}
      />

      <EditSchoolDrawer
        open={editSchoolOpen}
        onOpenChange={setEditSchoolOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSaveEdit}
      />

      <DeleteSchoolDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setSchoolToDelete(null);
            setDeleteError(null);
          }
        }}
        school={schoolToDelete}
        error={deleteError}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

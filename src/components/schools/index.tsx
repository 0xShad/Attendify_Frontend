"use client";

import React, { useState, useEffect } from "react";
import { schoolsAPI } from "@/lib/api";
import type { School as APISchool } from "@/lib/api/schools";
import { useToast } from "@/hooks/use-toast";
import type { School, SchoolFormData } from "./types";
import { SchoolCard } from "./SchoolCard";
import { SchoolFilters, type FilterValues } from "./SchoolFilters";
import { SearchBar } from "./SearchBar";
import { AddSchoolDrawer } from "./AddSchoolDrawer";
import { ViewSchoolDrawer } from "./ViewSchoolDrawer";
import { EditSchoolDrawer } from "./EditSchoolDrawer";
import { DeleteSchoolDialog } from "./DeleteSchoolDialog";
import { PaginationControls } from "./PaginationControls";
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSchools, setTotalSchools] = useState(0);
  const itemsPerPage = 12; // 12 items per page (4x3 grid on large screens)

  // Filter states
  const [filters, setFilters] = useState<FilterValues>({});
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({});
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  // Form states
  const [formData, setFormData] = useState<SchoolFormData>({
    name: "",
    address: "",
    description: "",
    accreditation: "",
    establishedYear: undefined,
    principalName: "",
    academicLevel: "",
  });

  // Fetch schools on component mount and when page changes
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Calculate skip based on current page
        const skip = (currentPage - 1) * itemsPerPage;
        
        const apiSchools = await schoolsAPI.listSchools({ 
          skip, 
          limit: itemsPerPage,
          ...appliedFilters
        });

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
          accreditation: apiSchool.academic_data?.accreditation,
          establishedYear: apiSchool.academic_data?.established_year,
          principalName: apiSchool.academic_data?.principal_name,
          academicLevel: apiSchool.academic_data?.academic_level,
        }));

        setSchools(transformedSchools);
        
        // If we got a full page, there might be more
        // This is a simple estimate - ideally backend should return total count
        if (apiSchools.length === itemsPerPage) {
          setTotalSchools(currentPage * itemsPerPage + 1);
        } else {
          setTotalSchools((currentPage - 1) * itemsPerPage + apiSchools.length);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch schools"
        );
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if not searching
    if (!isSearching) {
      fetchSchools();
    }
  }, [currentPage, isSearching, appliedFilters]);

  // No client-side filtering needed - backend handles it all
  const filteredSchools = schools;

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, exit search mode and reset
      setIsSearching(false);
      setCurrentPage(1);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch all schools and filter client-side for search
      const results = await schoolsAPI.listSchools({
        skip: 0,
        limit: 100, // Get more results for client-side filtering
        type: "Academic",
        ...appliedFilters
      });
      
      // Filter results client-side by name
      const searchLower = searchQuery.trim().toLowerCase();
      const filteredResults = results.filter(school => 
        school.name.toLowerCase().includes(searchLower)
      );
      
      // Transform results to component format
      const transformedSchools: School[] = filteredResults.map((apiSchool) => ({
        id: apiSchool.id.toString(),
        name: apiSchool.name,
        location: apiSchool.address || "No address provided",
        description: apiSchool.description || "No description available",
        address: apiSchool.address || "No address provided",
        contact: "N/A",
        email: "N/A",
        totalPrograms: apiSchool.programs_count,
        totalCourses: apiSchool.courses_count,
        totalStudents: apiSchool.students_count,
        totalFaculty: apiSchool.faculty_count,
        status: "Active" as const,
        accreditation: apiSchool.academic_data?.accreditation,
        establishedYear: apiSchool.academic_data?.established_year,
        principalName: apiSchool.academic_data?.principal_name,
        academicLevel: apiSchool.academic_data?.academic_level,
      }));
      
      setSchools(transformedSchools);
      setTotalSchools(transformedSchools.length);
      setCurrentPage(1);
      setIsSearching(true); // Set this AFTER updating schools state
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Search failed"
      );
      setSchools([]);
      setTotalSchools(0);
      setIsSearching(true); // Still set searching even on error
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setCurrentPage(1);
    // Clear schools to force a fresh fetch
    setSchools([]);
  };

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
        accreditation: fullSchoolDetails.academic_data?.accreditation,
        establishedYear: fullSchoolDetails.academic_data?.established_year,
        principalName: fullSchoolDetails.academic_data?.principal_name,
        academicLevel: fullSchoolDetails.academic_data?.academic_level,
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
      accreditation: school.accreditation || "",
      establishedYear: school.establishedYear,
      principalName: school.principalName || "",
      academicLevel: school.academicLevel || "",
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

      // Build academic_data object
      const academicData: {
        accreditation?: string;
        established_year?: number;
        principal_name?: string;
        academic_level?: string;
      } = {};

      if (formData.accreditation && formData.accreditation.trim()) {
        academicData.accreditation = formData.accreditation.trim();
      }
      if (formData.establishedYear) {
        academicData.established_year = formData.establishedYear;
      }
      if (formData.principalName && formData.principalName.trim()) {
        academicData.principal_name = formData.principalName.trim();
      }
      if (formData.academicLevel && formData.academicLevel.trim()) {
        academicData.academic_level = formData.academicLevel.trim();
      }

      // Create school via API
      const payload: { 
        name: string; 
        type: "Academic";
        address?: string; 
        description?: string;
        academic_data?: typeof academicData;
      } = {
        name: formData.name.trim(),
        type: "Academic", // Always Academic for schools
      };

      // Only include optional fields if they have values
      if (formData.address && formData.address.trim()) {
        payload.address = formData.address.trim();
      }

      if (formData.description && formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      // Only include academic_data if at least one field is set
      if (Object.keys(academicData).length > 0) {
        payload.academic_data = academicData;
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
        accreditation: newSchool.academic_data?.accreditation,
        establishedYear: newSchool.academic_data?.established_year,
        principalName: newSchool.academic_data?.principal_name,
        academicLevel: newSchool.academic_data?.academic_level,
      };

      setSchools([...schools, transformedSchool]);
      setAddSchoolOpen(false);
      resetForm();
      
      // Reset to first page to see the new school
      setCurrentPage(1);
      
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

      // Build academic_data object
      const academicData: {
        accreditation?: string;
        established_year?: number;
        principal_name?: string;
        academic_level?: string;
      } = {};

      if (formData.accreditation && formData.accreditation.trim()) {
        academicData.accreditation = formData.accreditation.trim();
      }
      if (formData.establishedYear) {
        academicData.established_year = formData.establishedYear;
      }
      if (formData.principalName && formData.principalName.trim()) {
        academicData.principal_name = formData.principalName.trim();
      }
      if (formData.academicLevel && formData.academicLevel.trim()) {
        academicData.academic_level = formData.academicLevel.trim();
      }

      // Update school via API - only send fields that have values
      const payload: { 
        name?: string; 
        address?: string; 
        description?: string;
        academic_data?: typeof academicData;
      } = {};

      if (formData.name && formData.name.trim()) {
        payload.name = formData.name.trim();
      }

      if (formData.address !== undefined && formData.address.trim()) {
        payload.address = formData.address.trim();
      }

      if (formData.description !== undefined && formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      // Only include academic_data if at least one field is set
      if (Object.keys(academicData).length > 0) {
        payload.academic_data = academicData;
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
        accreditation: updatedSchool.academic_data?.accreditation,
        establishedYear: updatedSchool.academic_data?.established_year,
        principalName: updatedSchool.academic_data?.principal_name,
        academicLevel: updatedSchool.academic_data?.academic_level,
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
      
      // If current page becomes empty and it's not page 1, go to previous page
      if (schools.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
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
      accreditation: "",
      establishedYear: undefined,
      principalName: "",
      academicLevel: "",
    });
    setSelectedSchool(null);
  };

  const handleClearFilters = () => {
    setFilters({});
    setAppliedFilters({});
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setCurrentPage(1); // Reset to first page when applying filters
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
      </div>

      {/* Search Bar and Actions */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            onClear={handleClearSearch}
            isSearching={isSearching}
            disabled={loading}
          />
          <SchoolFilters
            open={filterOpen}
            onOpenChange={setFilterOpen}
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
            onApplyFilters={handleApplyFilters}
          />
        </div>
        <AddSchoolDrawer
          open={addSchoolOpen}
          onOpenChange={setAddSchoolOpen}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleAddSchool}
        />
      </div>

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* Error State */}
      {error && !loading && <ErrorState error={error} />}

      {/* Schools Grid */}
      {!loading && !error && (
        <>
          {/* Results Summary */}
          {filteredSchools.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalSchools)} of{" "}
                {totalSchools} schools
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.length === 0 ? (
              <EmptyState 
                onAddSchool={() => setAddSchoolOpen(true)} 
                isFiltered={isSearching || Object.keys(appliedFilters).length > 0}
              />
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

          {/* Pagination Controls - Hide when searching */}
          {!isSearching && filteredSchools.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalItems={totalSchools}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </>
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

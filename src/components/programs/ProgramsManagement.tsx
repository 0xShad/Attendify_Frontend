"use client";

import React, { useState, useEffect } from "react";
import { programsAPI } from "@/lib/api/programs";
import type { Program as APIProgram } from "@/lib/api/programs";
import { useToast } from "@/hooks/use-toast";
import type { Program, ProgramFormData } from "./types";
import { SearchBar } from "./SearchBar";
import { ColumnCustomizer } from "./ColumnCustomizer";
import { ProgramsTable } from "./ProgramsTable";
import { SummaryCards } from "./SummaryCards";
import { AddProgramDrawer } from "./AddProgramDrawer";
import { ViewProgramDrawer } from "./ViewProgramDrawer";
import { EditProgramDrawer } from "./EditProgramDrawer";
import { DeleteProgramDialog } from "./DeleteProgramDialog";
import { ProgramFilters, type FilterValues } from "./ProgramFilters";
import { PaginationControls } from "./PaginationControls";

export function ProgramsManagement() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [addProgramOpen, setAddProgramOpen] = useState(false);
  const [viewProgramOpen, setViewProgramOpen] = useState(false);
  const [editProgramOpen, setEditProgramOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const itemsPerPage = 12;

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<ProgramFormData>({
    name: "",
    code: "",
    school: "",
    duration: "4 Years",
    status: "Active",
    description: "",
  });

  // Get unique schools for dropdown
  const schools = Array.from(new Set(programs.map((p) => p.school)));

  // Transform API program to local Program type
  const transformProgram = (apiProgram: APIProgram): Program => ({
    id: apiProgram.id.toString(),
    name: apiProgram.name,
    code: apiProgram.code,
    school: apiProgram.school_name || "Unknown School",
    duration: "4 Years", // Default value since backend doesn't have this
    status: "Active", // Default value since backend doesn't have this
    totalStudents: apiProgram.students_count,
    totalCourses: apiProgram.courses_count,
    description: apiProgram.description || "",
  });

  // Fetch programs from API
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);

      const skip = (currentPage - 1) * itemsPerPage;
      
      const apiPrograms = await programsAPI.listPrograms({
        skip,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        min_courses: appliedFilters.min_courses,
        max_courses: appliedFilters.max_courses,
        min_students: appliedFilters.min_students,
        max_students: appliedFilters.max_students,
      });

      const transformedPrograms = apiPrograms.map(transformProgram);
      setPrograms(transformedPrograms);
      
      // Note: Backend should return total count for proper pagination
      // For now, we'll estimate based on returned results
      if (apiPrograms.length === itemsPerPage) {
        setTotalPrograms(currentPage * itemsPerPage + 1); // At least one more page
      } else {
        setTotalPrograms((currentPage - 1) * itemsPerPage + apiPrograms.length);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch programs";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Fetch programs on mount and when dependencies change
  useEffect(() => {
    fetchPrograms();
  }, [currentPage, searchQuery, appliedFilters]);

  const handleSearch = () => {
    setSearchQuery(searchTerm);
    setCurrentPage(1); // Reset to first page on new search
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setCurrentPage(1); // Reset to first page when applying filters
  };

  const handleViewProgram = (program: Program) => {
    setSelectedProgram(program);
    setViewProgramOpen(true);
  };

  const handleEditProgram = (program: Program) => {
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
  };

  const handleDeleteProgram = (program: Program) => {
    setSelectedProgram(program);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProgram) return;

    try {
      await programsAPI.deleteProgram(parseInt(selectedProgram.id));
      
      toast({
        title: "Success",
        description: `Program "${selectedProgram.name}" has been deleted successfully`,
      });

      setDeleteDialogOpen(false);
      setSelectedProgram(null);
      
      // Refresh the list
      fetchPrograms();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete program";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      school: "",
      duration: "4 Years",
      status: "Active",
      description: "",
    });
    setSelectedProgram(null);
  };

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

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={handleSearch}
            onClear={handleClearSearch}
            disabled={loading}
          />
          <ProgramFilters
            open={filterOpen}
            onOpenChange={setFilterOpen}
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
            onApplyFilters={handleApplyFilters}
          />
        </div>
        <div className="flex items-center gap-2">
          <ColumnCustomizer />
          <AddProgramDrawer
            open={addProgramOpen}
            onOpenChange={setAddProgramOpen}
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={() => console.log("Add program")}
            schools={schools}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading programs...</div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error: {error}</div>
        </div>
      )}

      {/* Programs Table */}
      {!loading && !error && (
        <ProgramsTable
          programs={programs}
          onView={handleViewProgram}
          onEdit={handleEditProgram}
          onDelete={handleDeleteProgram}
        />
      )}

      {/* Summary Cards */}
      {!loading && !error && <SummaryCards programs={programs} />}

      {/* Pagination */}
      {!loading && !error && (
        <PaginationControls
          currentPage={currentPage}
          totalItems={totalPrograms}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Drawers and Dialogs */}
      <ViewProgramDrawer
        open={viewProgramOpen}
        onOpenChange={setViewProgramOpen}
        program={selectedProgram}
      />

      <EditProgramDrawer
        open={editProgramOpen}
        onOpenChange={setEditProgramOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={() => console.log("Edit program")}
        schools={schools}
      />

      <DeleteProgramDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        program={selectedProgram}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

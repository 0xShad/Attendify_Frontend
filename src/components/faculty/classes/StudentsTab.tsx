"use client";

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IconTrash } from "@tabler/icons-react";
import { useToast } from "@/hooks/use-toast";
import AddStudentDialog from "@/components/faculty/classes/AddStudentDialog";

type Props = { classId?: number | null };

type Student = { id: string; name: string; email: string };

export default function StudentsTab({ classId }: Props) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    // Placeholder: load mock students when classId changes
    setLoading(true);
    setTimeout(() => {
      if (!classId) {
        setStudents([]);
      } else {
        setStudents([
          { id: `${classId}-s1`, name: "Alice Cooper", email: "alice.cooper@student.edu" },
          { id: `${classId}-s2`, name: "Bob Wilson", email: "bob.wilson@student.edu" },
        ]);
      }
      setLoading(false);
    }, 250);
  }, [classId]);

  const handleRemove = (id: string) => {
    if (!confirm("Remove student from class?")) return;
    setStudents((s) => s.filter((x) => x.id !== id));
    toast({ title: "Removed", description: "Student removed (local placeholder)" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Students</h3>
        <div>
          <Button size="sm" variant="outline" onClick={() => setAddOpen((v) => !v)} disabled={!classId}>
            Add Student
          </Button>
        </div>
      </div>

      {/* Use the faculty AddStudentDialog when Add Student is clicked */}
      <AddStudentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        classId={classId}
        onAdded={() => {
          // Simple local update to show a newly added placeholder student
          setStudents((s) => [{ id: `added-${Date.now()}`, name: "New Student", email: "new.student@example.com" }, ...s]);
        }}
      />

      <div className="overflow-x-auto">
        <div className="max-h-[40vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">Loading students…</TableCell>
                </TableRow>
              )}
              {!loading && students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">No students found for this class.</TableCell>
                </TableRow>
              )}
              {!loading && students.map((e, idx) => (
                <TableRow key={e.id}>
                  <TableCell className="w-12">
                    <div className="w-8 h-8">
                      <Avatar>
                        <AvatarFallback className="text-xs">{String(idx + 1)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell>{e.name}</TableCell>
                  <TableCell className="font-mono">—</TableCell>
                  <TableCell className="text-right">
                    <button title="Remove" className="p-1 rounded hover:bg-gray-100 text-rose-600" onClick={() => handleRemove(e.id)}>
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

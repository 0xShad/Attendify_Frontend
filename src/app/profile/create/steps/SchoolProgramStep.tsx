import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { programsAPI } from "@/lib/api/programs";

interface SchoolOption {
  id: number;
  name: string;
}

interface SchoolProgramStepProps {
  form: any;
  schools: SchoolOption[];
  schoolsLoading: boolean;
  schoolsError: string | null;
  schoolSearch: string;
  setSchoolSearch: (s: string) => void;
  handleSelectSchool: (val: string) => void;
  onProgramChange: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function SchoolProgramStep({
  form,
  schools,
  schoolsLoading,
  schoolsError,
  schoolSearch,
  setSchoolSearch,
  handleSelectSchool,
  onProgramChange,
  onBack,
  onNext,
}: SchoolProgramStepProps) {
  // Do not call `getMyProgramOptions` here: endpoint logic is incorrect.
  // Use the static fallback program list below until API is fixed.
  const [programOptions, setProgramOptions] = useState<Array<{ id: number; code: string; name?: string }>>([]);
  const [programsLoading, setProgramsLoading] = useState(false);

  // Load program codes when a school (organization) is selected
  useEffect(() => {
    let mounted = true;
    async function loadProgramsForOrg(orgIdStr?: string) {
      if (!orgIdStr) {
        setProgramOptions([]);
        return;
      }
      const orgId = Number(orgIdStr);
      if (!Number.isFinite(orgId) || orgId <= 0) {
        setProgramOptions([]);
        return;
      }
      setProgramsLoading(true);
      try {
        const opts = await programsAPI.getProgramCodesByOrganization(orgId);
        if (!mounted) return;
        if (Array.isArray(opts)) {
          setProgramOptions(opts.map((o: any) => ({ id: Number(o.id), code: String(o.code), name: o.name ?? undefined })));
        } else {
          setProgramOptions([]);
        }
      } catch (err) {
        console.debug('Failed to load programs for organization', err);
        if (!mounted) return;
        setProgramOptions([]);
      } finally {
        if (mounted) setProgramsLoading(false);
      }
    }

    loadProgramsForOrg(form?.school);

    return () => { mounted = false; };
  }, [form?.school]);
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Label htmlFor="school" className="font-semibold">School</Label>
        {schoolsLoading ? (
          <div className="mt-2 text-sm text-muted-foreground">Loading schools...</div>
        ) : schoolsError ? (
          <div className="mt-2 text-sm text-red-600">{schoolsError}</div>
        ) : schools.length === 0 ? (
          <div className="mt-2 text-sm text-red-600">No schools found.</div>
        ) : (
          <Select value={form.school} onValueChange={(val) => { handleSelectSchool(val); setSchoolSearch(""); }}>
            <SelectTrigger className="mt-2 w-full rounded-xl shadow-sm border-blue-200">
              <SelectValue placeholder="Select your school" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto rounded-xl shadow-lg">
              <div className="px-2 py-1">
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={e => setSchoolSearch(e.target.value)}
                  placeholder="Search school..."
                  className="w-full px-2 py-1 rounded border border-gray-200 text-sm mb-1"
                  autoFocus
                />
              </div>
              {schools
                .filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase()))
                .map(school => (
                  <SelectItem key={school.id} value={String(school.id)}>{school.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div>
        <Label htmlFor="program" className="font-semibold">Program / Department</Label>
        <Select
          value={form.program}
          onValueChange={onProgramChange}
          disabled={!form.school}
        >
          <SelectTrigger className="mt-2 w-full rounded-xl shadow-sm border-blue-200" disabled={!form.school}>
            <SelectValue placeholder={form.school ? "Select your program/department" : "Select a school first"} />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto rounded-xl shadow-lg">
            {programsLoading ? (
              <div className="p-3 text-sm text-muted-foreground">Loading programs…</div>
            ) : programOptions && programOptions.length > 0 ? (
                programOptions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name ? `${p.code} — ${p.name}` : p.code}</SelectItem>
              ))
            ) : (
              <>
                <SelectItem value="BS Computer Science">BS Computer Science</SelectItem>
                <SelectItem value="BS Information Technology">BS Information Technology</SelectItem>
                <SelectItem value="BS Accountancy">BS Accountancy</SelectItem>
                <SelectItem value="BS Psychology">BS Psychology</SelectItem>
                <SelectItem value="BA Communication">BA Communication</SelectItem>
                <SelectItem value="BS Civil Engineering">BS Civil Engineering</SelectItem>
                <SelectItem value="BS Nursing">BS Nursing</SelectItem>
                <SelectItem value="BS Business Administration">BS Business Administration</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl px-8 py-2 text-base font-semibold">
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={!form.school || !form.program} className="rounded-xl px-8 py-2 text-base font-semibold bg-blue-600 hover:bg-blue-700">
          Next
        </Button>
      </div>
    </div>
  );
}

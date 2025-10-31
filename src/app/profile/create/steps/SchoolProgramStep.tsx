import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import React from "react";

interface SchoolRow {
  region: string;
  name: string;
  type: string;
  province: string;
  city: string;
  website: string;
  contact: string;
}

interface SchoolProgramStepProps {
  form: any;
  regionOptions: string[];
  csvLoading: boolean;
  csvError: string | null;
  getProvinceOptions: (region: string) => string[];
  getSchoolOptions: (region: string, province: string) => SchoolRow[];
  regionSearch: string;
  setRegionSearch: (s: string) => void;
  provinceSearch: string;
  setProvinceSearch: (s: string) => void;
  schoolSearch: string;
  setSchoolSearch: (s: string) => void;
  handleSelectRegion: (val: string) => void;
  handleSelectProvince: (val: string) => void;
  handleSelectSchool: (val: string) => void;
  onProgramChange: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function SchoolProgramStep({
  form,
  regionOptions,
  csvLoading,
  csvError,
  getProvinceOptions,
  getSchoolOptions,
  regionSearch,
  setRegionSearch,
  provinceSearch,
  setProvinceSearch,
  schoolSearch,
  setSchoolSearch,
  handleSelectRegion,
  handleSelectProvince,
  handleSelectSchool,
  onProgramChange,
  onBack,
  onNext,
}: SchoolProgramStepProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Label htmlFor="region" className="font-semibold">Region</Label>
        {csvLoading ? (
          <div className="mt-2 text-sm text-muted-foreground">Loading regions...</div>
        ) : csvError ? (
          <div className="mt-2 text-sm text-red-600">{csvError}</div>
        ) : regionOptions.length === 0 ? (
          <div className="mt-2 text-sm text-red-600">No regions found. Check CSV data.</div>
        ) : (
          <Select value={form.region} onValueChange={(val) => { handleSelectRegion(val); setRegionSearch(""); }}>
            <SelectTrigger className="mt-2 w-full rounded-xl shadow-sm border-blue-200">
              <SelectValue placeholder="Select your region" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto rounded-xl shadow-lg">
              <div className="px-2 py-1">
                <input
                  type="text"
                  value={regionSearch}
                  onChange={e => setRegionSearch(e.target.value)}
                  placeholder="Search region..."
                  className="w-full px-2 py-1 rounded border border-gray-200 text-sm mb-1"
                  autoFocus
                />
              </div>
              {regionOptions
                .filter(region => region.replace(/^\d+\s*-\s*/, '').toLowerCase().includes(regionSearch.toLowerCase()))
                .map(region => {
                  const displayRegion = region.replace(/^\d+\s*-\s*/, '');
                  return (
                    <SelectItem key={region} value={region}>{displayRegion}</SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        )}
      </div>
      <div>
        <Label htmlFor="province" className="font-semibold">Province</Label>
        <Select value={form.province} onValueChange={(val) => { handleSelectProvince(val); setProvinceSearch(""); }} disabled={!form.region}>
          <SelectTrigger className="mt-2 w-full rounded-xl shadow-sm border-blue-200" disabled={!form.region}>
            <SelectValue placeholder="Select your province" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto rounded-xl shadow-lg">
            <div className="px-2 py-1">
              <input
                type="text"
                value={provinceSearch}
                onChange={e => setProvinceSearch(e.target.value)}
                placeholder="Search province..."
                className="w-full px-2 py-1 rounded border border-gray-200 text-sm mb-1"
                autoFocus
                disabled={!form.region}
              />
            </div>
            {getProvinceOptions(form.region)
              .filter(province => province.toLowerCase().includes(provinceSearch.toLowerCase()))
              .map(province => (
                <SelectItem key={province} value={province}>{province}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="school" className="font-semibold">School</Label>
        <Select value={form.school} onValueChange={(val) => { handleSelectSchool(val); setSchoolSearch(""); }} disabled={!form.region || !form.province}>
          <SelectTrigger className="mt-2 w-full rounded-xl shadow-sm border-blue-200" disabled={!form.region || !form.province}>
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
                disabled={!form.region || !form.province}
              />
            </div>
            {getSchoolOptions(form.region, form.province)
              .filter(school => school.name.toLowerCase().includes(schoolSearch.toLowerCase()))
              .map(school => (
                <SelectItem key={school.name} value={school.name}>{school.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>
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
            <SelectItem value="BS Computer Science">BS Computer Science</SelectItem>
            <SelectItem value="BS Information Technology">BS Information Technology</SelectItem>
            <SelectItem value="BS Accountancy">BS Accountancy</SelectItem>
            <SelectItem value="BS Psychology">BS Psychology</SelectItem>
            <SelectItem value="BA Communication">BA Communication</SelectItem>
            <SelectItem value="BS Civil Engineering">BS Civil Engineering</SelectItem>
            <SelectItem value="BS Nursing">BS Nursing</SelectItem>
            <SelectItem value="BS Business Administration">BS Business Administration</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl px-8 py-2 text-base font-semibold">
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={!form.region || !form.province || !form.school || !form.program} className="rounded-xl px-8 py-2 text-base font-semibold bg-blue-600 hover:bg-blue-700">
          Next
        </Button>
      </div>
    </div>
  );
}

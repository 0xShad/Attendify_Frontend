"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CameraIcon, UserIcon, SchoolIcon, SmileIcon } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";



import Papa from "papaparse";

type SchoolRow = {
  region: string;
  name: string;
  type: string;
  province: string;
  city: string;
  website: string;
  contact: string;
};

export default function ProfileCreatePage() {
  // Search state for dropdowns
  const [regionSearch, setRegionSearch] = useState("");
  const [provinceSearch, setProvinceSearch] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  // State for parsed school data
  const [schoolOptions, setSchoolOptions] = useState<SchoolRow[]>([]);
  const [regionOptions, setRegionOptions] = useState<string[]>([]);
  const [csvLoading, setCsvLoading] = useState(true);
  const [csvError, setCsvError] = useState<string | null>(null);
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Load and parse CSV on mount
  useEffect(() => {
    setCsvLoading(true);
    setCsvError(null);
    fetch("/LIST_OF_HEI.csv")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch CSV");
        return res.text();
      })
      .then((csvText) => {
  // Remove BOM and trim whitespace
  let cleanCsv = csvText.replace(/^\uFEFF/, '').trim();
  // Normalize line endings to \n
  cleanCsv = cleanCsv.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Remove trailing commas from each line
  cleanCsv = cleanCsv.split('\n').map(line => line.replace(/,(\s*)$/, '')).join('\n');
        Papa.parse(cleanCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Build a map of trimmed header -> original header
            const headerMap: Record<string, string> = {};
            if (results.meta.fields) {
              for (const h of results.meta.fields) {
                headerMap[h.trim()] = h;
              }
            }
            // Map CSV headers to our SchoolRow type using trimmed keys
            const rows: SchoolRow[] = (results.data as any[]).map((row) => ({
              region: row[headerMap["REGION"]]?.trim() || "",
              name: row[headerMap["INSTITUTION NAME"]]?.trim() || "",
              type: row[headerMap["INSTITUTION TYPE"]]?.trim() || "",
              province: row[headerMap["PROVINCE"]]?.trim() || "",
              city: row[headerMap["MUNICIPALITY/CITY"]]?.trim() || "",
              website: row[headerMap["WEBSITE ADDRESS"]]?.trim() || "",
              contact: row[headerMap["FAX/TELEPHONE NO."]] ?.trim() || "",
            })).filter(r => r.region && r.name && r.province);
            setSchoolOptions(rows);
            setRegionOptions(Array.from(new Set(rows.map(r => r.region))).sort());
            setCsvLoading(false);
            setCsvError(null);
          },
          error: (err) => {
            setCsvError("CSV parse error: " + err.message);
            setCsvLoading(false);
          },
        });
      })
      .catch((err) => {
        setCsvError("CSV fetch error: " + err.message);
        setCsvLoading(false);
      });
  }, []);
  const [form, setForm] = useState({
    bio: "",
    face_image: "",
    region: "",
    province: "",
    school: "",
    program: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("/default_profile_image.png");
  const [loading, setLoading] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarFile(null);
      setAvatarPreview("/default_profile_image.png");
    }
  };

  const handleSelectRegion = (value: string) => {
    setForm(f => ({ ...f, region: value, province: "", school: "" }));
  };
  const handleSelectProvince = (value: string) => {
    setForm(f => ({ ...f, province: value, school: "" }));
  };
  const handleSelectSchool = (value: string) => {
    setForm(f => ({ ...f, school: value }));
  };

  function getProvinceOptions(region: string) {
    return Array.from(new Set(schoolOptions.filter(s => s.region === region).map(s => s.province))).sort();
  }

  function getSchoolOptions(region: string, province: string) {
    return schoolOptions.filter(s => s.region === region && s.province === province);
  }

  const handleNext = () => setStep((s) => Math.min(s + 1, 2));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Replace with actual API call to create profile
      await new Promise((res) => setTimeout(res, 1000));
      router.push("/profile");
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  // Stepper progress calculation
  const stepProgress = [33, 66, 100][step];

  return (
  <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-700 via-slate-200 to-slate-500 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 p-4">
    <Card className="w-full max-w-lg p-0 overflow-hidden shadow-2xl border-0 rounded-3xl bg-linear-to-br from-blue-600/70 via-blue-500/15 to-indigo-600/10 dark:from-blue-900/40 dark:via-indigo-900/30 backdrop-blur-md">
      <div className="bg-linear-to-r from-blue-600 to-slate-600 px-8 py-6 text-white">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Create Your Profile</h1>
        <p className="text-sm opacity-90 mb-2">
          {step === 0 && "Let us know who you are!"}
          {step === 1 && "Tell us your school and program."}
          {step === 2 && "Submit a face photo to complete your profile."}
        </p>
        <Progress value={stepProgress} className="h-2 bg-white/80" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-8 px-8 py-8 bg-white/90 dark:bg-neutral-950/90 rounded-b-3xl">
          {/* Stepper UI */}
          <Tabs value={String(step)} className="mb-8">
            <TabsList className="w-full flex justify-between bg-transparent shadow-none p-0 gap-2">
              <TabsTrigger
                value="0"
                disabled={step !== 0}
                className={`flex-1 rounded-xl flex flex-col items-center py-2 px-1 transition-all duration-200 ${step === 0 ? 'bg-slate-100 text-black shadow-lg scale-105' : 'bg-slate-100 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 opacity-80'}`}
              >
                <UserIcon className="mb-1 mx-auto" size={22} />
                <span className="font-bold text-sm tracking-wide">About You</span>
                <span className="text-xs font-normal opacity-70">Basic info</span>
              </TabsTrigger>
              <TabsTrigger
                value="1"
                disabled={step !== 1}
                className={`flex-1 rounded-xl flex flex-col items-center py-2 px-1 transition-all duration-200 ${step === 1 ? 'bg-slate-100 text-black shadow-lg scale-105' : 'bg-slate-100 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 opacity-80'}`}
              >
                <SchoolIcon className="mb-1 mx-auto" size={22} />
                <span className="font-bold text-sm tracking-wide">School & Program</span>
                <span className="text-xs font-normal opacity-70">Academic details</span>
              </TabsTrigger>
              <TabsTrigger
                value="2"
                disabled={step !== 2}
                className={`flex-1 rounded-xl flex flex-col items-center py-2 px-1 transition-all duration-200 ${step === 2 ? 'bg-slate-100 text-black shadow-lg scale-105' : 'bg-slate-100 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 opacity-80'}`}
              >
                <SmileIcon className="mb-1 mx-auto" size={22} />
                <span className="font-bold text-sm tracking-wide">Face Submission</span>
                <span className="text-xs font-normal opacity-70">Photo upload</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Divider line between stepper and content */}
          <div className="w-full flex items-center justify-center mb-6">
              <div className="w-full h-1 rounded-full bg-linear-to-br from-blue-600/70 via-blue-500/55 to-indigo-600/40 dark:from-blue-900/40 dark:via-indigo-900/30" />
          </div>

          {/* Step 1: Avatar/Bio */}
          {step === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 shadow-lg ring-4 ring-blue-100 dark:ring-blue-900">
                  <AvatarImage src={avatarPreview} alt="Avatar" />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div className="w-full flex flex-col items-center gap-2">
                  <Label htmlFor="avatar_file" className="font-semibold mb-1">Avatar Image</Label>
                  <label htmlFor="avatar_file" className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow cursor-pointer transition-all duration-150 focus:ring-2 focus:ring-blue-300">
                    <CameraIcon size={18} className="mr-1" />
                    {avatarFile ? "Change Image" : "Upload Image"}
                    <Input
                      id="avatar_file"
                      name="avatar_file"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  {avatarFile && <span className="text-xs text-muted-foreground mt-1">{avatarFile.name}</span>}
                </div>
              </div>
              <div>
                <Label htmlFor="bio" className="font-semibold">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  className="mt-2 min-h-20 rounded-xl shadow-inner"
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={handleNext} className="rounded-xl px-8 py-2 text-base font-semibold bg-blue-600 hover:bg-blue-700">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: School/Program */}
        {step === 1 && (
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
              <Input
                id="program"
                name="program"
                value={form.program}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="mt-2 rounded-xl shadow-inner"
              />
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack} className="rounded-xl px-8 py-2 text-base font-semibold">
                Back
              </Button>
              <Button type="button" onClick={handleNext} disabled={!form.region || !form.province || !form.school || !form.program} className="rounded-xl px-8 py-2 text-base font-semibold bg-blue-600 hover:bg-blue-700">
                Next
              </Button>
            </div>
          </div>
        )}
        {/* Step 3: Face Submission Placeholder */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label htmlFor="face_image" className="font-semibold">Face Image URL</Label>
              <Input
                id="face_image"
                name="face_image"
                value={form.face_image}
                onChange={handleChange}
                placeholder="https://..."
                className="mt-2 rounded-xl shadow-inner"
              />
              <p className="text-xs text-muted-foreground mt-2">(Face submission coming soon. For now, paste a photo URL.)</p>
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack} className="rounded-xl px-8 py-2 text-base font-semibold">
                Back
              </Button>
              <Button type="submit" className="rounded-xl px-8 py-2 text-base font-semibold bg-blue-600 hover:bg-blue-700" disabled={loading || !form.face_image}>
                {loading ? "Creating..." : "Create Profile"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Card>
  </div>
  );
}

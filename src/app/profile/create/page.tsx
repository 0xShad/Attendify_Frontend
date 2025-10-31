"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserIcon, SchoolIcon, SmileIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import AboutYouStep from "./steps/AboutYouStep";
import SchoolProgramStep from "./steps/SchoolProgramStep";
import FaceSubmissionStep from "./steps/FaceSubmissionStep";



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
    degreeType: "",
    customDegreeType: "",
    fieldOfStudy: "",
    major: "",
  });

  function expandFieldAbbreviation(field: string) {
    const map: Record<string, string> = {
      "IT": "Information Technology",
      "CS": "Computer Science",
      "Eng": "Engineering",
      "Acctg": "Accountancy",
      "Mgmt": "Management",
      "Econ": "Economics",
      // Add more as needed
    };
    const trimmed = field.trim();
    return map[trimmed] || trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  function formatProgram(degreeType: string = "", field: string = "", major: string = "") {
    let deg = degreeType?.trim();
    if (!deg) return "";
    if (deg === "Other") deg = form.customDegreeType?.trim() || "";
    let str = deg;
    if (field) str += ` ${expandFieldAbbreviation(field)}`;
    if (major) str += ` Major in ${major.trim()}`;
    return str;
  }
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
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Create Your Profile</h1>
          <button
            type="button"
            onClick={() => router.push('/auth/logout')}
            className="ml-4 bg-red-800 hover:bg-red-700 text-white font-semibold px-4 py-1.5 rounded-xl text-sm shadow transition-all"
          >
            Logout
          </button>
        </div>
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
            <AboutYouStep
              form={form}
              avatarFile={avatarFile}
              avatarPreview={avatarPreview}
              loading={loading}
              onChange={handleChange}
              onAvatarChange={handleAvatarChange}
              onNext={handleNext}
            />
          )}

          {/* Step 2: School/Program */}
          {step === 1 && (
            <SchoolProgramStep
              form={form}
              regionOptions={regionOptions}
              csvLoading={csvLoading}
              csvError={csvError}
              getProvinceOptions={getProvinceOptions}
              getSchoolOptions={getSchoolOptions}
              regionSearch={regionSearch}
              setRegionSearch={setRegionSearch}
              provinceSearch={provinceSearch}
              setProvinceSearch={setProvinceSearch}
              schoolSearch={schoolSearch}
              setSchoolSearch={setSchoolSearch}
              handleSelectRegion={handleSelectRegion}
              handleSelectProvince={handleSelectProvince}
              handleSelectSchool={handleSelectSchool}
              onProgramChange={val => setForm(f => ({ ...f, program: val }))}
              onBack={handleBack}
              onNext={handleNext}
            />
          )}
          {/* Step 3: Face Submission Placeholder */}
          {step === 2 && (
            <FaceSubmissionStep
              form={form}
              loading={loading}
              onChange={handleChange}
              onBack={handleBack}
              onSubmit={handleSubmit}
            />
          )}
      </form>
    </Card>
  </div>
  );
}

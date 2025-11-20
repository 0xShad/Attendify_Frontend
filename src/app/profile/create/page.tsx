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



import { programsAPI } from "@/lib/api/programs";
import { REDIRECT_URLS } from '@/config/auth';

export default function ProfileCreatePage() {
  // Search state for dropdowns
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schools, setSchools] = useState<Array<{ id: number; name: string }>>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Load organization options from the programs API (public options endpoint)
  useEffect(() => {
    let mounted = true;
    setSchoolsLoading(true);
    setSchoolsError(null);
    (async () => {
      try {
        const opts = await programsAPI.getOrganizationOptions();
        if (!mounted) return;
        // Map to minimal shape expected by the step
        const mapped = Array.isArray(opts) ? opts.map((o: any) => ({ id: Number(o.id), name: String(o.name) })) : [];
        setSchools(mapped);
      } catch (err: any) {
        console.debug('Failed to load organization options', err);
        if (!mounted) return;
        // Prefer readable error message
        const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        setSchoolsError(msg);
        setSchools([]);
      } finally {
        if (mounted) setSchoolsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const [form, setForm] = useState({
    bio: "",
    face_image: "",
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

  const handleSelectSchool = (value: string) => {
    setForm(f => ({ ...f, school: value }));
  };

  

  const handleNext = () => setStep((s) => Math.min(s + 1, 2));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build multipart/form-data payload and PATCH to /api/profiles/mine (proxy)
      const formData = new FormData();

      // organization (school) id
      if (form.school) {
        const orgId = Number(form.school);
        if (Number.isFinite(orgId)) formData.append('organization_id', String(orgId));
      }

      // program: prefer numeric program_id if user picked one, else send program_code
      if (form.program) {
        const pid = Number(form.program);
        if (Number.isFinite(pid)) {
          formData.append('program_id', String(pid));
        } else {
          formData.append('program_code', String(form.program));
        }
      }

      if (form.bio) formData.append('bio', String(form.bio));

      // Attach avatar file if user uploaded one
      if (avatarFile) {
        formData.append('avatar_file', avatarFile, avatarFile.name);
      }

      // If face_image is a data URL, convert to Blob and attach as face_file
      if (form.face_image && typeof form.face_image === 'string' && form.face_image.startsWith('data:')) {
        const res = await fetch(form.face_image);
        const blob = await res.blob();
        formData.append('face_file', blob, 'face.png');
      }

      const resp = await fetch('/api/profiles/mine', {
        method: 'PATCH',
        body: formData,
        credentials: 'include',
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({ detail: resp.statusText }));
        throw new Error(errBody?.detail || resp.statusText || `HTTP ${resp.status}`);
      }

      // on success, backend returns updated profile; navigate to student dashboard
      router.push(REDIRECT_URLS.STUDENT_DASHBOARD);
    } catch (err) {
      console.error('Failed to create/update profile', err);
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
              schools={schools}
              schoolsLoading={schoolsLoading}
              schoolsError={schoolsError}
              schoolSearch={schoolSearch}
              setSchoolSearch={setSchoolSearch}
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

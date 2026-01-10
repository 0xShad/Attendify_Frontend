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
import { REDIRECT_URLS } from "@/config/auth";

export default function ProfileCreatePage() {
  // Search state for dropdowns
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schools, setSchools] = useState<Array<{ id: number; name: string }>>(
    []
  );
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
        const mapped = Array.isArray(opts)
          ? opts.map((o: any) => ({ id: Number(o.id), name: String(o.name) }))
          : [];
        setSchools(mapped);
      } catch (err: any) {
        console.debug("Failed to load organization options", err);
        if (!mounted) return;
        // Prefer readable error message
        const msg =
          err?.message ||
          (typeof err === "object" ? JSON.stringify(err) : String(err));
        setSchoolsError(msg);
        setSchools([]);
      } finally {
        if (mounted) setSchoolsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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
      IT: "Information Technology",
      CS: "Computer Science",
      Eng: "Engineering",
      Acctg: "Accountancy",
      Mgmt: "Management",
      Econ: "Economics",
      // Add more as needed
    };
    const trimmed = field.trim();
    return map[trimmed] || trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  function formatProgram(
    degreeType: string = "",
    field: string = "",
    major: string = ""
  ) {
    let deg = degreeType?.trim();
    if (!deg) return "";
    if (deg === "Other") deg = form.customDegreeType?.trim() || "";
    let str = deg;
    if (field) str += ` ${expandFieldAbbreviation(field)}`;
    if (major) str += ` Major in ${major.trim()}`;
    return str;
  }
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    "/default_profile_image.png"
  );
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
    setForm((f) => ({ ...f, school: value }));
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
        if (Number.isFinite(orgId))
          formData.append("organization_id", String(orgId));
      }

      // program: prefer numeric program_id if user picked one, else send program_code
      if (form.program) {
        const pid = Number(form.program);
        if (Number.isFinite(pid)) {
          formData.append("program_id", String(pid));
        } else {
          formData.append("program_code", String(form.program));
        }
      }

      if (form.bio) formData.append("bio", String(form.bio));

      // Attach avatar file if user uploaded one
      if (avatarFile) {
        formData.append("avatar_file", avatarFile, avatarFile.name);
      }

      // If face_image is a data URL, convert to Blob and attach as face_file
      if (
        form.face_image &&
        typeof form.face_image === "string" &&
        form.face_image.startsWith("data:")
      ) {
        const res = await fetch(form.face_image);
        const blob = await res.blob();
        formData.append("face_file", blob, "face.png");
      }

      const resp = await fetch("/api/profiles/mine", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      if (!resp.ok) {
        const errBody = await resp
          .json()
          .catch(() => ({ detail: resp.statusText }));
        throw new Error(
          errBody?.detail || resp.statusText || `HTTP ${resp.status}`
        );
      }

      // On success, reload the page to trigger middleware routing
      // Middleware will check the updated profile and redirect to the correct dashboard based on role
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to create/update profile", err);
    } finally {
      setLoading(false);
    }
  };

  // Stepper progress calculation
  const stepProgress = [33, 66, 100][step];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 relative overflow-hidden p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main Animated Blue Blobs */}
        <div className="absolute top-1/4 -left-24 md:-left-12 lg:left-0 w-72 md:w-80 lg:w-96 h-72 md:h-80 lg:h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 -right-24 md:-right-12 lg:right-0 w-64 md:w-72 lg:w-80 h-64 md:h-72 lg:h-80 bg-primary/30 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-2/3 -left-20 md:left-1/4 w-56 md:w-64 lg:w-72 h-56 md:h-64 lg:h-72 bg-blue-400/15 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

        {/* Floating Geometric Shapes */}
        <div className="absolute top-1/4 right-4 md:right-1/4 w-24 md:w-32 h-24 md:h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-4 md:left-1/4 w-16 md:w-24 h-16 md:h-24 bg-primary/15 rounded-full blur-lg animate-pulse delay-700"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgb(var(--primary)) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>
      </div>

      <Card className="w-full max-w-2xl relative z-10 shadow-xl border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 px-6 py-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Create Your Profile
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 0 && "Let us know who you are!"}
                {step === 1 && "Tell us your school and program."}
                {step === 2 && "Submit a face photo to complete your profile."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/auth/logout")}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold px-4 py-2 rounded-lg text-sm shadow-sm transition-colors"
            >
              Logout
            </button>
          </div>
          <Progress value={stepProgress} className="h-2 bg-muted" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {/* Stepper UI */}
          <Tabs value={String(step)} className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-muted/50 p-1 h-auto gap-1">
              <TabsTrigger
                value="0"
                disabled={step !== 0}
                className="flex items-center justify-center gap-2 py-2.5 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <UserIcon size={18} />
                <span className="font-semibold text-sm">About</span>
              </TabsTrigger>
              <TabsTrigger
                value="1"
                disabled={step !== 1}
                className="flex items-center justify-center gap-2 py-2.5 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <SchoolIcon size={18} />
                <span className="font-semibold text-sm">School</span>
              </TabsTrigger>
              <TabsTrigger
                value="2"
                disabled={step !== 2}
                className="flex items-center justify-center gap-2 py-2.5 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <SmileIcon size={18} />
                <span className="font-semibold text-sm">Face</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

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
              onProgramChange={(val) =>
                setForm((f) => ({ ...f, program: val }))
              }
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

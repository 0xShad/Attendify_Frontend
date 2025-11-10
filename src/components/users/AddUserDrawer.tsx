"use client";

import React from "react";
import { IconPlus, IconUpload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import FaceCamera from "@/components/face-camera";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { profilesAPI, OrganizationOption } from "@/lib/api/profiles";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

export interface UserFormData {
  username?: string;
  email?: string;
  firstname?: string;
  middlename?: string;
  lastname?: string;
  role?: string;
  organization?: string;
  password?: string;
  confirmPassword?: string;
  profile_image?: File | string | null;
  face_image?: string | null;
  bio?: string | null;
  program_id?: number | null;
  program_code?: string | null;
}

interface AddUserDrawerProps {
  onCreate?: (data: UserFormData) => void;
}

export function AddUserDrawer({ onCreate }: AddUserDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<UserFormData>({});
  const [roles, setRoles] = React.useState<string[]>([]);
  const [orgs, setOrgs] = React.useState<OrganizationOption[]>([]);
  const [programs, setPrograms] = React.useState<Array<{id:number, code:string}>>([]);
  const [loadingRoles, setLoadingRoles] = React.useState(false);
  const [loadingOrgs, setLoadingOrgs] = React.useState(false);
  const [loadingPrograms, setLoadingPrograms] = React.useState(false);
  const [step, setStep] = React.useState<number>(1);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [faceValidated, setFaceValidated] = React.useState(false);
  const { toast } = useToast();
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    // we intentionally do NOT fetch roles on mount - roles are scoped to the selected organization.
    // Roles will be loaded after the user selects an organization.

    const loadOrgs = async () => {
      try {
        setLoadingOrgs(true);
        if (profilesAPI.listOrganizations) {
          const o = await profilesAPI.listOrganizations();
          if (!mounted) return;
          if (Array.isArray(o)) {
            // ensure we have objects with id/name/type
            const normalized = o.map((x: any) => (typeof x === "string" ? { id: 0, name: x, type: null } : { id: x.id ?? 0, name: x.name ?? String(x), type: x.type ?? null } as OrganizationOption));
            if (!normalized.some((n: any) => n.name === "Attendify")) normalized.unshift({ id: 0, name: 'Attendify', type: null });
            setOrgs(normalized);
          }
        }
      } catch (_) {
      } finally {
        if (mounted) setLoadingOrgs(false);
      }
    };

  // start loading organizations on mount (roles are loaded after org selection)
  loadOrgs();

    return () => { mounted = false; };
  }, []);

  React.useEffect(() => { if (!open) setFaceValidated(false); }, [open]);

  const handleChange = (patch: Partial<UserFormData>) => setForm((s) => ({ ...s, ...patch }));

  const inputClass = (field: string) => {
    const base = 'bg-transparent';
    const normal = 'border border-slate-400 dark:border-slate-700';
    const error = 'border border-red-500 focus-visible:ring-red-500';
    return `${base} ${errors[field] ? error : normal}`;
  };

  // when organization changes, load roles scoped to that organization
  const handleOrganizationChange = async (value: string | undefined) => {
    handleChange({ organization: value, role: undefined });
    setErrors((s) => {
      const copy = { ...s };
      delete copy.organization;
      delete copy.role;
      return copy;
    });

    setRoles([]);
    if (!value) return;

    const org = orgs.find((o) => String(o.id) === String(value));
    const params: any = {};
    // If the selected org is the special Attendify entry (we inserted it with id=0),
    // automatically set the role to Admin and avoid calling the roles endpoint.
    if (org && (org.name === 'Attendify' || org.id === 0)) {
      setRoles(['Admin']);
      handleChange({ role: 'Admin' });
      return;
    }

    if (org && org.id) params.organization_id = Number(org.id);
    if (org && org.type) params.organization_type = org.type;

    try {
      setLoadingRoles(true);
      const opts = await profilesAPI.listRoles(params);
      if (Array.isArray(opts)) setRoles(opts.map((r: any) => (typeof r === 'string' ? r : String(r))));
    } catch (e) {
      console.warn('Failed to load roles for organization', value, e);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
    // If the selected org is Academic and the currently chosen role requires programs,
    // we will fetch programs only after the user selects a role (handled in handleRoleChange).
  };

  // fetch programs for an organization and normalize the result
  const fetchPrograms = async (organizationId: number) => {
    setPrograms([]);
    setLoadingPrograms(true);
    try {
      const res = await (profilesAPI as any).listProgramCodesByOrganization(Number(organizationId));
      let normalized: Array<{id:number, code:string}> = [];
      if (Array.isArray(res)) {
        if (res.length > 0 && typeof res[0] === 'string') {
          normalized = (res as string[]).map((c, i) => ({ id: i + 1, code: c }));
        } else {
          normalized = (res as any[]).map((r) => ({ id: Number(r.id ?? 0), code: String(r.code ?? (r[0] ?? '')) }));
        }
      }
      setPrograms(normalized);
    } catch (e) {
      console.warn('Failed to load programs for organization', organizationId, e);
      setPrograms([]);
    } finally {
      setLoadingPrograms(false);
    }
  };

  // handle role selection; if Academic org and role is Student/Faculty, load programs
  const handleRoleChange = async (value: string | undefined) => {
    handleChange({ role: value, program_id: undefined, program_code: undefined });
    setErrors((s) => {
      const copy = { ...s };
      delete copy.role;
      delete copy.program_id;
      return copy;
    });

    // check if we should fetch programs
    const org = orgs.find((o) => String(o.id) === String(form.organization));
    const isAcademic = org && typeof org.type === 'string' && String(org.type).toLowerCase() === 'academic';
    if (isAcademic && value && ['student', 'faculty'].includes(String(value).toLowerCase())) {
      if (org && org.id) {
        await fetchPrograms(Number(org.id));
      }
    } else {
      setPrograms([]);
    }
  };

  const selectTriggerClass = (field: string) => {
    const normal = 'border border-slate-200 dark:border-slate-700';
    const error = 'border border-red-500';
    return errors[field] ? error : normal;
  };

  const dataUrlToFile = (dataUrl: string, filename = 'capture.png') => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  // map specific field names to the step number where they live
  const getStepForField = (field: string) => {
    const f = field.toLowerCase();
    const step1 = ['email', 'username', 'firstname', 'middlename', 'lastname', 'password', 'confirmpassword', 'confirmPassword', 'confirm_password'];
    const step2 = ['organization', 'role', 'bio', 'profile_image', 'avatar_url', 'avatar_file', 'profile'];
    const step3 = ['face_image', 'face_file', 'face'];
    if (step1.includes(f)) return 1;
    if (step2.includes(f)) return 2;
    if (step3.includes(f)) return 3;
    return 1; // default to step 1 for unknown fields
  };

  const handleServerErrors = (raw: any) => {
    const collect: string[] = [];
    if (!raw) return false;
    if (Array.isArray(raw)) collect.push(...raw.map(String));
    if (raw?.errors && Array.isArray(raw.errors)) collect.push(...raw.errors.map(String));
    if (raw?.detail && Array.isArray(raw.detail)) collect.push(...raw.detail.map(String));
    if (raw?.detail && typeof raw.detail === 'object' && !Array.isArray(raw.detail)) {
      Object.values(raw.detail).forEach((v: any) => {
        if (Array.isArray(v)) collect.push(String(v[0])); else collect.push(String(v));
      });
    }
    if (raw?.errors && typeof raw.errors === 'object' && !Array.isArray(raw.errors)) {
      Object.values(raw.errors).forEach((v: any) => {
        if (Array.isArray(v)) collect.push(String(v[0])); else collect.push(String(v));
      });
    }
    if (raw?.message && typeof raw.message === 'string') collect.push(raw.message);
    const dedup = Array.from(new Set(collect.filter(Boolean)));
    if (dedup.length === 0) return false;
    const mapped: Record<string,string> = {};
    const others: string[] = [];
    dedup.forEach((m) => {
      const lower = m.toLowerCase();
      if (lower.includes('email')) mapped.email = m;
      else if (lower.includes('username')) mapped.username = m;
      else if (lower.includes('first') || lower.includes('firstname')) mapped.firstname = m;
      else if (lower.includes('last') || lower.includes('lastname')) mapped.lastname = m;
      else others.push(m);
    });
    if (Object.keys(mapped).length) setErrors((s) => ({ ...s, ...mapped }));
    const toastMsgs = [...Object.values(mapped), ...others].filter(Boolean);
    // determine which step to open based on mapped field names
    try {
      const mappedFields = Object.keys(mapped || {});
      if (mappedFields.length > 0) {
        const steps = mappedFields.map(getStepForField);
        const target = Math.min(...steps);
        setStep(target);
      } else {
        // fallback: inspect message text for hints
        const lowerAll = dedup.join(' ').toLowerCase();
        if (lowerAll.includes('face') || lowerAll.includes('liveness')) setStep(3);
        else if (lowerAll.includes('avatar') || lowerAll.includes('profile') || lowerAll.includes('organization')) setStep(2);
        else setStep(1);
      }
    } catch (e) {
      // ignore navigation errors
    }
  // Server validation messages are surfaced to the user via toast; no debug logs
    if (toastMsgs.length === 1) {
      toast({ title: 'Failed to create user', description: String(toastMsgs[0]), variant: 'destructive' });
    } else if (toastMsgs.length > 1) {
      // Show messages as a bulleted list (JSX) so line breaks render correctly
      const desc = (
        <div className="flex flex-col gap-1">
          {toastMsgs.map((m, i) => (
            <div key={i} className="leading-tight">{m}</div>
          ))}
        </div>
      );
      toast({ title: 'Failed to create user', description: desc, variant: 'destructive' });
    }
    return true;
  };

  const handleSubmit = async () => {
    const errs: Record<string,string> = {};
  if (!form.email) errs.email = 'Email is required';
    if (!form.username) errs.username = 'Username is required';
    if (!form.firstname) errs.firstname = 'First name is required';
    if (!form.lastname) errs.lastname = 'Last name is required';
  if (!form.organization) errs.organization = 'Organization is required';
  if (!form.role) errs.role = 'Role is required';
  // If organization is academic and role is Student/Faculty, program is required
  const orgForValidation = orgs.find((o) => String(o.id) === String(form.organization));
  if (orgForValidation && orgForValidation.type && String(orgForValidation.type).toLowerCase() === 'academic' && form.role && ['student', 'faculty'].includes(String(form.role).toLowerCase())) {
    if (!form.program_id) errs.program_id = 'Program is required';
  }
    if (!form.password) errs.password = 'Password is required';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('email', form.email as string);
      fd.append('username', form.username as string);
      fd.append('firstname', form.firstname as string);
      if (form.middlename) fd.append('middlename', form.middlename);
      fd.append('lastname', form.lastname as string);
      fd.append('password', form.password as string);
      if (form.role) fd.append('role', form.role);
      // backend expects organization_id (integer) per /options/organizations
      // allow '0' (Attendify) - check for non-empty string/number explicitly
      if (form.organization !== undefined && form.organization !== null && String(form.organization) !== '') {
        fd.append('organization_id', String(Number(form.organization)));
        // also append the organization name for compatibility/debugging if we can resolve it
        const selOrg = orgs.find((o) => String(o.id) === String(form.organization));
        if (selOrg && selOrg.name) fd.append('organization', String(selOrg.name));
      }
      if (form.bio) fd.append('bio', form.bio);
      // If user supplied an existing URL string (no file selected), send it.
      if (form.profile_image && typeof form.profile_image === 'string') {
        fd.append('avatar_url', form.profile_image as string);
      }

      // Prefer the File stored on the form state (set by the hidden file input's onChange)
      const profileImageFile = form.profile_image && typeof form.profile_image !== 'string' ? (form.profile_image as File) : null;
      if (profileImageFile) {
        // Send the uploaded file under the 'avatar_file' field. Do NOT send
        // avatar_url when a file is provided to avoid confusing server-side
        // validators that expect avatar_url to be a URL string.
        fd.append('avatar_file', profileImageFile, profileImageFile.name);
      } else {
        // Fallback: read directly from the hidden file input if present
        const avatarFile = fileInputRef.current?.files?.[0] ?? null;
        if (avatarFile) fd.append('avatar_file', avatarFile, avatarFile.name);
      }
      // Append program_id when explicitly set (allow numeric 0 or other numeric ids).
      if (form.program_id !== undefined && form.program_id !== null) fd.append('program_id', String(form.program_id));
      else if (form.program_code) fd.append('program_code', String(form.program_code));
      if (form.face_image && typeof form.face_image === 'string') {
        try {
          const faceFile = dataUrlToFile(form.face_image as string, 'face.png');
          fd.append('face_file', faceFile, faceFile.name);
        } catch (e) {
          console.warn('face conversion failed', e);
        }
      }

      // Intentionally not logging FormData to console in production or development

      const result = await (profilesAPI as any).createAdminUser(fd);
      const ok = result && (result.success === true || result.user || result.data || result.id || result.profile);
      if (!ok) {
        const body = result ?? {};
        const handled = handleServerErrors(body);
        if (!handled) toast({ title: 'Failed to create user', description: 'Unknown server response', variant: 'destructive' });
        setCreating(false);
        return;
      }

  toast({ title: 'User created', description: 'User was successfully created' });
  // Allow parent handlers to run first
  if (onCreate) onCreate(form);
  // Refresh the app router so any server-rendered tables re-fetch their data
  try { router.refresh(); } catch (e) { /* ignore if router not available */ }
  setOpen(false);
  // reset form and file preview/input
  setForm({});
  try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch (_) { /* ignore */ }
  setPreviewUrl(null);
  setStep(1);
  setErrors({});
    } catch (err: any) {
      const body = err?.body ?? err?.response ?? null;
      const handled = handleServerErrors(body);
      if (!handled) toast({ title: 'Failed to create user', description: err?.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // derived helpers for rendering
  const selectedOrg = orgs.find((o) => String(o.id) === String(form.organization));
  const showProgram = Boolean(selectedOrg && selectedOrg.type && String(selectedOrg.type).toLowerCase() === 'academic' && form.role && ['Student', 'Faculty'].includes(form.role));

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" onClick={() => setOpen(true)}>
          <IconPlus className="mr-2" /> Add user
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-0">
        <DrawerHeader className="px-4">
          <DrawerTitle>Add User</DrawerTitle>
          <DrawerDescription>Fill the details to create a new user account</DrawerDescription>
        </DrawerHeader>

        <div className="flex gap-6 p-4">
          <aside className="w-44">
            <nav className="flex flex-col gap-2">
              <button className={`w-full text-left p-2 rounded-md ${step===1? 'bg-primary text-white': 'hover:bg-slate-100'}`} onClick={() => setStep(1)}>
                <div className="font-medium">1 — Account</div>
                <div className="text-xs text-muted-foreground">Required</div>
              </button>
              <button className={`w-full text-left p-2 rounded-md ${step===2? 'bg-primary text-white': 'hover:bg-slate-100'}`} onClick={() => setStep(2)}>
                <div className="font-medium">2 — Profile</div>
                <div className="text-xs text-muted-foreground">Optional</div>
              </button>
              <button className={`w-full text-left p-2 rounded-md ${step===3? 'bg-primary text-white': 'hover:bg-slate-100'}`} onClick={() => setStep(3)}>
                <div className="font-medium">3 — Face Submission</div>
                <div className="text-xs text-muted-foreground">Optional</div>
              </button>
            </nav>
            <div className="mt-4 text-xs text-muted-foreground">Tip: required fields are validated on step 1.</div>
          </aside>

          <section className="flex-1">
            {/* Form content (condensed) */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input id="email" value={form.email ?? ''} onChange={(e) => handleChange({ email: e.target.value })} className={inputClass('email')} />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
                    <Input id="username" value={form.username ?? ''} onChange={(e) => handleChange({ username: e.target.value })} className={inputClass('username')} />
                    {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>First name</Label>
                    <Input value={form.firstname ?? ''} onChange={(e) => handleChange({ firstname: e.target.value })} className={inputClass('firstname')} />
                    {errors.firstname && <p className="text-sm text-red-500">{errors.firstname}</p>}
                  </div>
                  <div>
                    <Label>Middle name</Label>
                    <Input value={form.middlename ?? ''} onChange={(e) => handleChange({ middlename: e.target.value })} className={inputClass('middlename')} />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input value={form.lastname ?? ''} onChange={(e) => handleChange({ lastname: e.target.value })} className={inputClass('lastname')} />
                    {errors.lastname && <p className="text-sm text-red-500">{errors.lastname}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Password</Label>
                    <Input type="password" value={form.password ?? ''} onChange={(e) => handleChange({ password: e.target.value })} className={inputClass('password')} />
                  </div>
                  <div>
                    <Label>Confirm password</Label>
                    <Input type="password" value={form.confirmPassword ?? ''} onChange={(e) => handleChange({ confirmPassword: e.target.value })} className={inputClass('confirmPassword')} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex gap-6">
                  <div className="w-40">
                    <div className="h-32 w-32 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                      {previewUrl ? <img src={previewUrl} alt="preview" className="h-full w-full object-cover" /> : <div className="text-sm text-muted-foreground">No image</div>}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        id="profile_image"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          handleChange({ profile_image: file });
                          try {
                            if (file) setPreviewUrl(URL.createObjectURL(file)); else setPreviewUrl(null);
                          } catch (_) {
                            // ignore createObjectURL errors
                          }
                        }}
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}><IconUpload className="mr-2" />Upload image</Button>
                      <div className="text-sm text-muted-foreground truncate max-w-56">{form.profile_image && typeof form.profile_image !== 'string' ? (form.profile_image as File).name : (!form.profile_image ? 'No file chosen' : 'Using existing image')}</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="organization">Organization <span className="text-red-500">*</span></Label>
                    {orgs.length > 0 ? (
                      <Select value={form.organization} onValueChange={(v) => handleOrganizationChange(v)}>
                        <SelectTrigger id="organization" aria-required={true} className={selectTriggerClass('organization')}><SelectValue placeholder={loadingOrgs ? 'Loading...' : 'Select organization'} /></SelectTrigger>
                        <SelectContent>{orgs.map(o => <SelectItem key={o.id ?? o.name} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input id="organization" value={form.organization ?? ''} onChange={(e) => handleOrganizationChange(e.target.value)} className={inputClass('organization')} />
                    )}
                    {errors.organization && <p className="text-sm text-red-500">{errors.organization}</p>}
                    <Label htmlFor="role" className="mt-3">Role <span className="text-red-500">*</span></Label>
                    {roles.length > 0 ? (
                      <Select value={form.role} onValueChange={(v) => handleRoleChange(v)}>
                        <SelectTrigger id="role" aria-required={true} disabled={!form.organization} className={selectTriggerClass('role')}><SelectValue placeholder={loadingRoles ? 'Loading roles...' : (!form.organization ? 'Select organization first' : 'Select role')} /></SelectTrigger>
                        <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input id="role" value={form.role ?? ''} onChange={(e) => handleRoleChange(e.target.value)} className={inputClass('role')} readOnly={!form.organization} placeholder={!form.organization ? 'Select organization first' : ''} />
                    )}
                    {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                    {showProgram && (
                      <div className="mt-3">
                        <Label htmlFor="program">Program <span className="text-red-500">*</span></Label>
                        {loadingPrograms ? (
                          <div className="text-sm text-muted-foreground">Loading programs...</div>
                        ) : programs.length > 0 ? (
                          <Select value={String(form.program_id ?? '')} onValueChange={(v) => {
                            // treat empty string as no selection
                            const pid = (v === '' || v === null || v === undefined) ? undefined : Number(v);
                            const p = (typeof pid === 'number' && !Number.isNaN(pid)) ? programs.find(x => Number(x.id) === Number(pid)) : undefined;
                            handleChange({ program_id: (typeof pid === 'number' && !Number.isNaN(pid)) ? pid : undefined, program_code: p ? p.code : undefined });
                          }}>
                            <SelectTrigger id="program" className={selectTriggerClass('program')}><SelectValue placeholder="Select program" /></SelectTrigger>
                            <SelectContent>{programs.map(p => <SelectItem key={p.id ?? p.code} value={String(p.id)}>{p.code}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-muted-foreground">No programs found</div>
                        )}
                        {errors.program_id && <p className="text-sm text-red-500">{errors.program_id}</p>}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Bio</Label>
                  <Input value={form.bio ?? ''} onChange={(e) => handleChange({ bio: e.target.value })} className={inputClass('bio')} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm mb-4">Optionally capture a live face image. Blink to capture.</p>
                  <FaceCamera onCapture={(dataUrl) => { setFaceValidated(true); handleChange({ face_image: dataUrl }); }} onRetake={() => { setFaceValidated(false); handleChange({ face_image: null }); }} />
                  <div className="mt-3">{faceValidated ? <span className="text-green-700">Face validated and attached</span> : <span className="text-muted-foreground">No validated face attached</span>}</div>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2">
              {step > 1 && <Button variant="ghost" onClick={() => setStep(s => Math.max(1, s-1))}>Back</Button>}
              {step < 3 ? <Button onClick={() => { if (step === 1) { const errs: Record<string,string> = {}; if (!form.email) errs.email = 'Email is required'; if (!form.username) errs.username = 'Username is required'; if (!form.firstname) errs.firstname = 'First name is required'; if (!form.lastname) errs.lastname = 'Last name is required'; if (!form.password) errs.password = 'Password is required'; if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'; setErrors(errs); if (Object.keys(errs).length) return; } setStep(s => Math.min(3, s+1)); }} >Next</Button> : <Button onClick={handleSubmit} disabled={creating} aria-busy={creating}>Create user</Button>}
            </div>
          </section>
        </div>

        {/* Close button removed per request */}
      </DrawerContent>
    </Drawer>
  );
}

export default AddUserDrawer;

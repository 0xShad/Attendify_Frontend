"use client";

import React from "react";
import { IconPlus, IconUpload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { profilesAPI } from "@/lib/api/profiles";

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
  bio?: string | null;
}

interface AddUserDrawerProps {
  onCreate?: (data: UserFormData) => void;
}

export function AddUserDrawer({ onCreate }: AddUserDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<UserFormData>({});
  const [roles, setRoles] = React.useState<string[]>([]);
  const [orgs, setOrgs] = React.useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = React.useState(false);
  const [loadingOrgs, setLoadingOrgs] = React.useState(false);
  const [step, setStep] = React.useState<number>(1);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingRoles(true);
        const opts = await profilesAPI.listRoles();
        if (!mounted) return;
        if (Array.isArray(opts)) {
          const normalized = opts.map((o: any) => (typeof o === "string" ? o : (o.label ?? o.value ?? String(o))));
          setRoles(normalized);
        }
      } catch (e) {
        // ignore silently; roles will be empty and user can type/select none
      } finally {
        if (mounted) setLoadingRoles(false);
      }
    };
    // Also try to load organizations; if the API has listOrganizations, use it, otherwise skip
    const loadOrgs = async () => {
      try {
        setLoadingOrgs(true);
        if (profilesAPI.listOrganizations) {
          const o = await profilesAPI.listOrganizations();
          if (!mounted) return;
          if (Array.isArray(o)) {
            const normalized = o.map((x: any) => (typeof x === "string" ? x : (x.name ?? x.label ?? x.value ?? String(x))));
            setOrgs(normalized);
          }
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoadingOrgs(false);
      }
    };

    load();
    loadOrgs();
    return () => { mounted = false; };
  }, []);

  // preview image URL for profile_image File
  React.useEffect(() => {
    if (form.profile_image && typeof form.profile_image !== "string") {
      const f = form.profile_image as File;
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (typeof form.profile_image === "string") {
      setPreviewUrl(form.profile_image as string);
      return;
    }
    setPreviewUrl(null);
  }, [form.profile_image]);

  const handleChange = (patch: Partial<UserFormData>) => setForm((s: UserFormData) => ({ ...s, ...patch }));

  const handleSubmit = async () => {
    // Final submit: basic validation
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = "Email is required";
    if (!form.username) errs.username = "Username is required";
    if (!form.firstname) errs.firstname = "First name is required";
    if (!form.lastname) errs.lastname = "Last name is required";
    if (!form.password) errs.password = "Password is required";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      if (onCreate) await onCreate(form);
      else {
        // eslint-disable-next-line no-console
        console.log("AddUserDrawer onCreate not provided. Form data:", form);
      }
      setOpen(false);
      setForm({});
      setStep(1);
      setErrors({});
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to create user", err);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" variant="default" className="flex items-center gap-2">
          <IconPlus className="h-4 w-4" />
          Add User
        </Button>
      </DrawerTrigger>

      <DrawerContent className="p-0">
        {/* Accessibility: Radix DialogContent requires a DialogTitle for screen readers. Keep it visually hidden. */}
        <DrawerTitle className="sr-only">Create new user</DrawerTitle>
        {/* Custom drawer layout: left stepper + right form panel */}
        <div className="flex h-[80vh] w-[900px] max-w-full">
          {/* Left: stepper */}
          <aside className="w-64 bg-slate-50 dark:bg-slate-900 border-r px-4 py-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Create user</h3>
              <p className="text-sm text-muted-foreground mt-1">Three quick steps to add a user</p>
            </div>
            <nav className="space-y-3">
              <button className={`w-full text-left p-3 rounded ${step === 1 ? 'bg-primary text-white' : 'hover:bg-slate-100'}`} onClick={() => setStep(1)}>
                <div className="font-medium">1 — Account</div>
                <div className="text-xs text-muted-foreground">Email, username & password</div>
              </button>
              <button className={`w-full text-left p-3 rounded ${step === 2 ? 'bg-primary text-white' : 'hover:bg-slate-100'}`} onClick={() => setStep(2)}>
                <div className="font-medium">2 — Profile</div>
                <div className="text-xs text-muted-foreground">Image, role & org</div>
              </button>
              <button className={`w-full text-left p-3 rounded ${step === 3 ? 'bg-primary text-white' : 'hover:bg-slate-100'}`} onClick={() => setStep(3)}>
                <div className="font-medium">3 — More</div>
                <div className="text-xs text-muted-foreground">Optional settings</div>
              </button>
            </nav>
            <div className="mt-8 text-xs text-muted-foreground">Tip: required fields are validated on step 1.</div>
          </aside>

          {/* Right: form panel */}
          <section className="flex-1 bg-white dark:bg-black p-6 flex flex-col">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Add User</h2>
                <p className="text-sm text-muted-foreground">Fill the details and create a new user account</p>
              </div>
              {/* removed header close button per design */}
            </header>

            <div className="mt-6 flex-1 overflow-y-auto">
              <div className="flex gap-6">
                {/* Left column: preview */}
                {step === 2 && (
                  <div className="w-44 shrink-0">
                    <div className="h-36 w-36 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="profile preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-sm text-muted-foreground text-center px-2">No image</div>
                      )}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">Profile image preview</div>

                    {/* Upload controls placed below the preview as requested */}
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        id="profile_image"
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0] ?? null;
                          handleChange({ profile_image: file });
                        }}
                      />

                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <IconUpload className="h-4 w-4 mr-2" />
                        Upload image
                      </Button>

                      <div className="text-sm text-muted-foreground">
                        {form.profile_image && typeof form.profile_image !== 'string'
                          ? (form.profile_image as File).name
                          : (!form.profile_image ? 'No file chosen' : 'Using existing image')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Right column: fields */}
                <div className="flex-1">
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={form.email ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange({ email: e.target.value })} placeholder="user@example.com" />
                          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" value={form.username ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange({ username: e.target.value })} placeholder="username" />
                          {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="firstname">First name</Label>
                          <Input id="firstname" value={form.firstname ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange({ firstname: e.target.value })} />
                          {errors.firstname && <p className="text-sm text-red-500">{errors.firstname}</p>}
                        </div>
                        <div>
                          <Label htmlFor="middlename">Middle name</Label>
                          <Input id="middlename" value={form.middlename ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange({ middlename: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="lastname">Last name</Label>
                          <Input id="lastname" value={form.lastname ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange({ lastname: e.target.value })} />
                          {errors.lastname && <p className="text-sm text-red-500">{errors.lastname}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" value={form.password ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange({ password: e.target.value })} />
                          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm password</Label>
                          <Input id="confirmPassword" type="password" value={form.confirmPassword ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange({ confirmPassword: e.target.value })} />
                          {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="organization">Organization</Label>
                          {orgs.length > 0 ? (
                            <Select onValueChange={(v: string) => handleChange({ organization: v })} value={form.organization}>
                              <SelectTrigger id="organization">
                                <SelectValue placeholder={loadingOrgs ? "Loading..." : "Select organization"} />
                              </SelectTrigger>
                              <SelectContent>
                                {orgs.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input id="organization" value={form.organization ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange({ organization: e.target.value })} placeholder="Organization name" />
                          )}
                        </div>

                        <div>
                          <Label htmlFor="role">Role</Label>
                          {roles.length > 0 ? (
                            <Select onValueChange={(v: string) => handleChange({ role: v })} value={form.role}>
                              <SelectTrigger id="role">
                                <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select role"} />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((r: string) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input id="role" value={form.role ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange({ role: e.target.value })} placeholder="Role" />
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Input id="bio" value={form.bio ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange({ bio: e.target.value })} placeholder="Short bio" />
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">No additional fields configured yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <DrawerFooter className="px-0 pt-4">
          <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>

            <div className="ml-auto flex gap-2">
              {step > 1 && (
                <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</Button>
              )}

              {step < 3 ? (
                <Button onClick={() => {
                  // simple step validation for step 1
                  if (step === 1) {
                    const errs: Record<string,string> = {};
                    if (!form.email) errs.email = "Email is required";
                    if (!form.username) errs.username = "Username is required";
                    if (!form.firstname) errs.firstname = "First name is required";
                    if (!form.lastname) errs.lastname = "Last name is required";
                    if (!form.password) errs.password = "Password is required";
                    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
                    setErrors(errs);
                    if (Object.keys(errs).length > 0) return;
                  }
                  setStep((s) => Math.min(3, s + 1));
                }}>Next</Button>
              ) : (
                <Button onClick={handleSubmit}>Create user</Button>
              )}
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default AddUserDrawer;

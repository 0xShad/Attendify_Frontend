"use client";

import * as React from "react";
import { IconUpload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import FaceCamera from "@/components/face-camera";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { profilesAPI, OrganizationOption } from "@/lib/api/profiles";
import resolveAvatarUrl from "@/lib/utils/resolveAvatarUrl";
import useAvatarSrc from "@/hooks/useAvatarSrc";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

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

interface EditUserDrawerProps {
  profileId?: string | number | null; // profile.primary key
  authUserId?: number | null; // auth user id when available
  onUpdated?: (data?: any) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditUserDrawer({
  profileId,
  authUserId,
  onUpdated,
  open: openProp,
  onOpenChange,
}: EditUserDrawerProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [form, setForm] = React.useState<UserFormData>({});
  const [roles, setRoles] = React.useState<string[]>([]);
  const [orgs, setOrgs] = React.useState<OrganizationOption[]>([]);
  const [programs, setPrograms] = React.useState<
    Array<{ id: number; code: string }>
  >([]);
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
  const [loading, setLoading] = React.useState(false);
  const [initial, setInitial] = React.useState<any>(null);
  const [saving, setSaving] = React.useState(false);

  // Use shared resolver (supports gs://, STORAGE_BASE_URL, and backend origin normalization)
  // For editing and preview, converting to an absolute url is sufficient for display.

  const isControlled =
    typeof openProp === "boolean" && typeof onOpenChange === "function";
  const open = isControlled ? (openProp as boolean) : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  // Avatar preview and refresh resolver
  const { src: avatarSrc, setSrc: setAvatarSrc } = useAvatarSrc(
    (initial?.profile_image as string) ?? null,
    {
      profilePath: initial
        ? `/api/profiles/${initial?.id ?? profileId}`
        : undefined,
    }
  );

  React.useEffect(() => {
    if (avatarSrc) setPreviewUrl(avatarSrc);
  }, [avatarSrc]);

  React.useEffect(() => {
    let mounted = true;
    const loadOrgs = async () => {
      try {
        setLoadingOrgs(true);
        if (profilesAPI.listOrganizations) {
          const o = await profilesAPI.listOrganizations();
          if (!mounted) return;
          if (Array.isArray(o)) {
            const normalized = o.map((x: any) =>
              typeof x === "string"
                ? { id: 0, name: x, type: null }
                : ({
                    id: x.id ?? 0,
                    name: x.name ?? String(x),
                    type: x.type ?? null,
                  } as OrganizationOption)
            );
            if (!normalized.some((n: any) => n.name === "Attendify"))
              normalized.unshift({ id: 0, name: "Attendify", type: null });
            setOrgs(normalized);
          }
        }
      } catch (_) {
      } finally {
        if (mounted) setLoadingOrgs(false);
      }
    };

    loadOrgs();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!open) setFaceValidated(false);
  }, [open]);

  // Prefill when opening: try authUserId then fallback to profileId
  React.useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        let profile: any = null;
        if (authUserId) {
          try {
            profile = await profilesAPI.getProfile(Number(authUserId));
          } catch (err: any) {
            if (err?.status !== 404) throw err;
          }
        }
        if (!profile && profileId) {
          profile = await (profilesAPI as any).getProfileByProfileId(
            Number(profileId)
          );
        }
        if (!profile) {
          toast({
            title: "Failed to load user",
            description: "Profile not found",
            variant: "destructive",
          });
          setOpen(false);
          return;
        }

        // loaded profile (no debug logging emitted)

        if (!mounted) return;
        const seed: UserFormData = {
          email: profile.email ?? undefined,
          username: profile.username ?? undefined,
          firstname: profile.firstname ?? undefined,
          middlename: profile.middlename ?? null,
          role: profile.role ?? undefined,
          organization:
            profile.organization_data &&
            profile.organization_data.id !== undefined
              ? String(profile.organization_data.id)
              : profile.organization_id
              ? String(profile.organization_id)
              : undefined,
          bio: profile.bio ?? undefined,
          profile_image: profile.avatar_url ?? undefined,
          face_image: profile.face_image ?? undefined,
          // Prefer top-level program_id (newer backend responses) then fallback
          // to nested academic_data.program_id for older responses.
          program_id:
            (profile as any).program_id ??
            profile.academic_data?.program_id ??
            undefined,
          program_code: undefined,
        };
        setInitial(seed);
        setForm(seed);
        if (seed.profile_image && typeof seed.profile_image === "string")
          setPreviewUrl(resolveAvatarUrl(String(seed.profile_image)) ?? null);

        // seeded form values derived from profile (no debug logging emitted)

        // Populate organization -> roles -> programs hierarchy so dropdowns are prefilled
        try {
          if (seed.organization) {
            const orgIdNum = Number(seed.organization);

            // Load roles for the organization without triggering the handlers that
            // clear program values. This avoids racing with program resolution.
            try {
              const params: any = {};
              if (!Number.isNaN(orgIdNum) && orgIdNum > 0)
                params.organization_id = orgIdNum;
              const opts = await profilesAPI.listRoles(params);
              if (Array.isArray(opts))
                setRoles(
                  opts.map((r: any) => (typeof r === "string" ? r : String(r)))
                );
              // roles loaded
              // set the role from seed so the UI shows it
              if (seed.role) handleChange({ role: seed.role });
            } catch (e) {
              console.warn(
                "[EditUserDrawer] failed to load roles during prefill",
                e
              );
              setRoles([]);
            }

            // Always attempt to fetch programs when an organization id exists
            if (!Number.isNaN(orgIdNum) && orgIdNum > 0) {
              const normalized = await fetchPrograms(orgIdNum);
              const seeded = seed.program_id as any;
              const {
                programs: updatedPrograms,
                resolvedId,
                resolvedCode,
              } = resolveSeededProgram(
                normalized,
                seeded,
                (seed as any).program_code
              );
              // ensure UI programs list reflects any injected fallback entries
              if (Array.isArray(updatedPrograms)) setPrograms(updatedPrograms);
              handleChange({
                program_id: resolvedId ?? undefined,
                program_code: resolvedCode ?? undefined,
              });
            }
          }
        } catch (e) {
          console.warn(
            "[EditUserDrawer] failed to populate organization/role/program during prefill",
            e
          );
        }
      } catch (err: any) {
        console.error("Failed to load profile for edit", err);
        toast({
          title: "Failed to load user",
          description: err?.message || "Could not fetch user data",
          variant: "destructive",
        });
        setOpen(false);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, profileId, authUserId, toast]);

  const handleChange = (patch: Partial<UserFormData>) =>
    setForm((s) => ({ ...s, ...patch }));

  const inputClass = (field: string) => {
    const base = "bg-transparent";
    const normal = "border border-slate-400 dark:border-slate-700";
    const error = "border border-red-500 focus-visible:ring-red-500";
    return `${base} ${errors[field] ? error : normal}`;
  };

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
    if (org && (org.name === "Attendify" || org.id === 0)) {
      setRoles(["Admin"]);
      handleChange({ role: "Admin" });
      return;
    }

    if (org && org.id) params.organization_id = Number(org.id);
    if (org && org.type) params.organization_type = org.type;

    try {
      setLoadingRoles(true);
      const opts = await profilesAPI.listRoles(params);
      if (Array.isArray(opts))
        setRoles(opts.map((r: any) => (typeof r === "string" ? r : String(r))));
    } catch (e) {
      console.warn("Failed to load roles for organization", value, e);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchPrograms = async (organizationId: number) => {
    setPrograms([]);
    setLoadingPrograms(true);
    try {
      const res = await (profilesAPI as any).listProgramCodesByOrganization(
        Number(organizationId)
      );
      let normalized: Array<{ id: number; code: string }> = [];
      if (Array.isArray(res)) {
        if (res.length > 0 && typeof res[0] === "string") {
          normalized = (res as string[]).map((c, i) => ({
            id: i + 1,
            code: c,
          }));
        } else {
          normalized = (res as any[]).map((r) => ({
            id: Number(r.id ?? 0),
            code: String(r.code ?? r[0] ?? ""),
          }));
        }
      }
      setPrograms(normalized);
      return normalized;
    } catch (e) {
      console.warn(
        "Failed to load programs for organization",
        organizationId,
        e
      );
      setPrograms([]);
      return [] as Array<{ id: number; code: string }>;
    } finally {
      setLoadingPrograms(false);
    }
  };

  // Helper to resolve a seeded program value against a list of programs.
  // Returns an object with possibly-updated programs array and resolved id/code.
  const resolveSeededProgram = (
    list: Array<{ id: number; code: string }>,
    seeded: any,
    seededCode?: string
  ) => {
    const programsCopy = Array.isArray(list) ? list.slice() : [];
    let resolvedId: number | undefined;
    let resolvedCode: string | undefined;

    const hasSeed = seeded !== undefined && seeded !== null;
    if (hasSeed) {
      const seededStr = String(seeded);
      const n = Number(seededStr);
      if (!Number.isNaN(n)) {
        const found = programsCopy.find((p) => Number(p.id) === n);
        if (found) {
          resolvedId = found.id;
          resolvedCode = found.code;
        } else {
          const foundByCode = programsCopy.find(
            (p) => String(p.code).toLowerCase() === seededStr.toLowerCase()
          );
          if (foundByCode) {
            resolvedId = foundByCode.id;
            resolvedCode = foundByCode.code;
          }
        }
      } else {
        const foundByCode = programsCopy.find(
          (p) => String(p.code).toLowerCase() === seededStr.toLowerCase()
        );
        if (foundByCode) {
          resolvedId = foundByCode.id;
          resolvedCode = foundByCode.code;
        }
      }
    }

    // If not resolved yet and seeded is numeric, inject numeric fallback
    if (!resolvedId && hasSeed && !Number.isNaN(Number(seeded))) {
      const numericSeed = Number(seeded);
      if (!programsCopy.find((p) => Number(p.id) === numericSeed)) {
        const fallbackCode = seededCode ?? `Program ${numericSeed}`;
        programsCopy.unshift({ id: numericSeed, code: String(fallbackCode) });
      }
      resolvedId = numericSeed;
      resolvedCode = seededCode ?? `Program ${numericSeed}`;
    }

    // If seeded is a non-numeric code and not found, inject negative fallback id
    if (!resolvedId && hasSeed && Number.isNaN(Number(String(seeded)))) {
      const seededStr = String(seeded);
      if (
        !programsCopy.find(
          (p) => String(p.code).toLowerCase() === seededStr.toLowerCase()
        )
      ) {
        const fallbackId = -Math.floor(Date.now() % 1000000);
        programsCopy.unshift({ id: fallbackId, code: seededStr });
        resolvedId = fallbackId;
        resolvedCode = seededStr;
      } else {
        const found = programsCopy.find(
          (p) => String(p.code).toLowerCase() === seededStr.toLowerCase()
        );
        resolvedId = found?.id;
        resolvedCode = found?.code;
      }
    }

    // If still unresolved and no seeded value, but only one program exists, choose it.
    if (!resolvedId && !hasSeed && programsCopy.length === 1) {
      resolvedId = programsCopy[0].id;
      resolvedCode = programsCopy[0].code;
    }

    return { programs: programsCopy, resolvedId, resolvedCode };
  };

  // Ensure form.program_id is set when programs become available.
  // This handles the case where programs are fetched *after* the initial prefill
  // (for example: user -> org -> role -> programs). We try resolving by numeric
  // id first, then by code. If still not found we inject a fallback option so the
  // Select can display the seeded program value.
  React.useEffect(() => {
    if (!open) return;
    if (!initial) return;
    if (initial.program_id === undefined || initial.program_id === null) return;
    // If form already has a matching program_id, nothing to do
    if (form.program_id !== undefined && form.program_id !== null) return;
    // Resolve against current programs list using helper
    if (programs && programs.length > 0) {
      const {
        programs: updatedPrograms,
        resolvedId,
        resolvedCode,
      } = resolveSeededProgram(
        programs,
        initial.program_id,
        initial.program_code
      );
      if (Array.isArray(updatedPrograms)) setPrograms(updatedPrograms);
      if (resolvedId !== undefined)
        handleChange({ program_id: resolvedId, program_code: resolvedCode });
    }
  }, [programs, initial, open]);

  const handleRoleChange = async (value: string | undefined) => {
    handleChange({
      role: value,
      program_id: undefined,
      program_code: undefined,
    });
    setErrors((s) => {
      const copy = { ...s };
      delete copy.role;
      delete copy.program_id;
      return copy;
    });

    const org = orgs.find((o) => String(o.id) === String(form.organization));
    const isAcademic =
      org &&
      typeof org.type === "string" &&
      String(org.type).toLowerCase() === "academic";
    if (
      isAcademic &&
      value &&
      ["student", "faculty"].includes(String(value).toLowerCase())
    ) {
      if (org && org.id) {
        await fetchPrograms(Number(org.id));
      }
    } else {
      setPrograms([]);
    }
  };

  const selectTriggerClass = (field: string) => {
    const normal = "border border-slate-200 dark:border-slate-700";
    const error = "border border-red-500";
    return errors[field] ? error : normal;
  };

  const dataUrlToFile = (dataUrl: string, filename = "capture.png") => {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const getStepForField = (field: string) => {
    const f = field.toLowerCase();
    const step1 = [
      "email",
      "username",
      "firstname",
      "middlename",
      "lastname",
      "password",
      "confirmpassword",
      "confirmPassword",
      "confirm_password",
    ];
    const step2 = [
      "organization",
      "role",
      "bio",
      "profile_image",
      "avatar_url",
      "avatar_file",
      "profile",
    ];
    const step3 = ["face_image", "face_file", "face"];
    if (step1.includes(f)) return 1;
    if (step2.includes(f)) return 2;
    if (step3.includes(f)) return 3;
    return 1;
  };

  const handleServerErrors = (raw: any) => {
    const collect: string[] = [];
    if (!raw) return false;
    if (Array.isArray(raw)) collect.push(...raw.map(String));
    if (raw?.errors && Array.isArray(raw.errors))
      collect.push(...raw.errors.map(String));
    if (raw?.detail && Array.isArray(raw.detail))
      collect.push(...raw.detail.map(String));
    if (
      raw?.detail &&
      typeof raw.detail === "object" &&
      !Array.isArray(raw.detail)
    ) {
      Object.values(raw.detail).forEach((v: any) => {
        if (Array.isArray(v)) collect.push(String(v[0]));
        else collect.push(String(v));
      });
    }
    if (
      raw?.errors &&
      typeof raw.errors === "object" &&
      !Array.isArray(raw.errors)
    ) {
      Object.values(raw.errors).forEach((v: any) => {
        if (Array.isArray(v)) collect.push(String(v[0]));
        else collect.push(String(v));
      });
    }
    if (raw?.message && typeof raw.message === "string")
      collect.push(raw.message);
    const dedup = Array.from(new Set(collect.filter(Boolean)));
    if (dedup.length === 0) return false;
    const mapped: Record<string, string> = {};
    const others: string[] = [];
    dedup.forEach((m) => {
      const lower = m.toLowerCase();
      if (lower.includes("email")) mapped.email = m;
      else if (lower.includes("username")) mapped.username = m;
      else if (lower.includes("first") || lower.includes("firstname"))
        mapped.firstname = m;
      else if (lower.includes("last") || lower.includes("lastname"))
        mapped.lastname = m;
      else others.push(m);
    });
    if (Object.keys(mapped).length) setErrors((s) => ({ ...s, ...mapped }));
    const toastMsgs = [...Object.values(mapped), ...others].filter(Boolean);
    try {
      const mappedFields = Object.keys(mapped || {});
      if (mappedFields.length > 0) {
        const steps = mappedFields.map(getStepForField);
        const target = Math.min(...steps);
        setStep(target);
      } else {
        const lowerAll = dedup.join(" ").toLowerCase();
        if (lowerAll.includes("face") || lowerAll.includes("liveness"))
          setStep(3);
        else if (
          lowerAll.includes("avatar") ||
          lowerAll.includes("profile") ||
          lowerAll.includes("organization")
        )
          setStep(2);
        else setStep(1);
      }
    } catch (e) {}
    // Server validation messages are surfaced to the user via toast; no debug logs
    if (toastMsgs.length === 1) {
      toast({
        title: "Failed to update user",
        description: String(toastMsgs[0]),
        variant: "destructive",
      });
    } else if (toastMsgs.length > 1) {
      const desc = (
        <div className="flex flex-col gap-1">
          {toastMsgs.map((m, i) => (
            <div key={i} className="leading-tight">
              {m}
            </div>
          ))}
        </div>
      );
      toast({
        title: "Failed to update user",
        description: desc,
        variant: "destructive",
      });
    }
    return true;
  };

  const selectedOrg = orgs.find(
    (o) => String(o.id) === String(form.organization)
  );
  const showProgram = Boolean(
    selectedOrg &&
      selectedOrg.type &&
      String(selectedOrg.type).toLowerCase() === "academic" &&
      form.role &&
      ["student", "faculty"].includes(String(form.role).toLowerCase())
  );

  const buildPatch = () => {
    const payload: Record<string, any> = {};
    if (!initial) return payload;
    const fields = [
      "email",
      "username",
      "firstname",
      "middlename",
      "lastname",
      "password",
      "bio",
      "role",
      "is_active",
      "is_superuser",
      "is_email_verified",
    ];
    for (const f of fields) {
      if (
        (form as any)[f] !== undefined &&
        (form as any)[f] !== (initial as any)[f]
      )
        payload[f] = (form as any)[f];
    }
    if (
      form.organization !== undefined &&
      String(form.organization) !== String((initial as any).organization)
    ) {
      const orgId = Number(form.organization);
      if (!Number.isNaN(orgId)) payload.organization_id = orgId;
    }
    if (
      form.program_id !== undefined &&
      form.program_id !== (initial as any).program_id
    )
      payload.program_id = form.program_id;
    if (
      form.program_code !== undefined &&
      form.program_code !== (initial as any).program_code
    )
      payload.program_code = form.program_code;

    // Safety: if we injected a negative fallback id for display, don't send it as program_id to the backend.
    // Prefer sending program_code when available.
    if (
      payload.program_id !== undefined &&
      typeof payload.program_id === "number" &&
      payload.program_id < 0
    ) {
      if (payload.program_code) {
        delete payload.program_id;
      } else {
        // No program_code available; drop program_id to avoid sending an invalid id
        delete payload.program_id;
      }
    }
    return payload;
  };

  // Ensure that when organization is Attendify and role is Admin, is_superuser is true.
  // This helper will update a patch object (used for JSON and FormData flows).
  const ensureSuperuserFlag = (patchObj: Record<string, any>) => {
    try {
      const selOrg = orgs.find(
        (o) => String(o.id) === String(form.organization)
      );
      if (
        selOrg &&
        selOrg.name === "Attendify" &&
        form.role &&
        String(form.role).toLowerCase() === "admin"
      ) {
        // If the backend expects a boolean, include true; during FormData we stringify.
        patchObj.is_superuser = true;
      }
    } catch (e) {
      // no-op
    }
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = "Email is required";
    if (!form.username) errs.username = "Username is required";
    if (!form.firstname) errs.firstname = "First name is required";
    if (!form.lastname) errs.lastname = "Last name is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const patch = buildPatch();
    // Ensure the superuser flag is set when appropriate
    ensureSuperuserFlag(patch);
    if (Object.keys(patch).length === 0) {
      toast({
        title: "No changes",
        description: "No fields were changed",
        variant: "default",
      });
      setOpen(false);
      return;
    }

    try {
      setSaving(true);
      // The backend admin update route now expects profile_id in the URL.
      // Prefer using the provided profileId prop. If only authUserId is available,
      // resolve it to the profile id via the profiles API.
      let targetProfileId: number | null = null;
      if (profileId) targetProfileId = Number(profileId);
      else if (authUserId) {
        const p = await (profilesAPI as any).getProfile(Number(authUserId));
        if (p && p.id) targetProfileId = Number(p.id);
      }
      if (!targetProfileId)
        throw new Error("Could not determine target profile id for update");

      // If files are present (avatar or captured face), send multipart/form-data
      const hasProfileImageFile =
        form.profile_image && typeof form.profile_image !== "string";
      const fallbackAvatarFile = fileInputRef.current?.files?.[0] ?? null;
      const profileImageFile = hasProfileImageFile
        ? (form.profile_image as File)
        : fallbackAvatarFile;

      let faceFile: File | null = null;
      if (form.face_image && typeof form.face_image === "string") {
        try {
          faceFile = dataUrlToFile(form.face_image as string, "face.png");
        } catch (e) {
          console.warn("face conversion failed", e);
          faceFile = null;
        }
      }

      let res: any = null;
      if (profileImageFile || faceFile) {
        const fd = new FormData();

        // Append any scalar fields from the patch
        for (const [k, v] of Object.entries(patch)) {
          // Skip undefined/null
          if (v === undefined || v === null) continue;
          // Form fields expect strings for primitives
          fd.append(k, String(v));
        }

        // If the form stores a profile_image as a URL and no file was provided,
        // include it as avatar_url so the backend can accept it.
        if (form.profile_image && typeof form.profile_image === "string") {
          fd.append("avatar_url", form.profile_image as string);
        }

        if (profileImageFile)
          fd.append(
            "avatar_file",
            profileImageFile,
            (profileImageFile as File).name
          );
        if (faceFile) fd.append("face_file", faceFile, faceFile.name);

        // Ensure program_id/program_code appended when present on form (respect buildPatch safety already applied)
        if (form.program_id !== undefined && form.program_id !== null)
          fd.append("program_id", String(form.program_id));
        else if (form.program_code)
          fd.append("program_code", String(form.program_code));

        // Send multipart/form-data to same-origin proxy so cookie is forwarded
        const proxyUrl = `/api/admin/users/${targetProfileId}`;
        const proxyResp = await fetch(proxyUrl, {
          method: "PATCH",
          body: fd,
          credentials: "include",
        });

        try {
          res = await proxyResp.json();
        } catch (e) {
          res = { detail: proxyResp.statusText };
        }

        if (!proxyResp.ok) {
          const message =
            res?.detail ||
            res?.message ||
            proxyResp.statusText ||
            `HTTP ${proxyResp.status}`;
          const err: any = new Error(message);
          err.status = proxyResp.status;
          err.body = res;
          throw err;
        }
      } else {
        // No files: use JSON PATCH path
        res = await (profilesAPI as any).updateAdminUser(
          targetProfileId,
          patch
        );
      }

      toast({
        title: "User updated",
        description: "User was successfully updated",
      });
      if (onUpdated) onUpdated(res);
      try {
        router.refresh();
      } catch (e) {}
      setOpen(false);
      setForm({});
      setPreviewUrl(null);
      setStep(1);
      setErrors({});
    } catch (err: any) {
      const body = err?.body ?? err?.response ?? null;
      const handled = handleServerErrors(body);
      if (!handled)
        toast({
          title: "Failed to update user",
          description: err?.message || "An error occurred",
          variant: "destructive",
        });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" onClick={() => setOpen(true)}>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Fill the details to update the user account
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-44">
            <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              <button
                className={`shrink-0 md:w-full text-left p-2 rounded-md ${
                  step === 1 ? "bg-primary text-white" : "hover:bg-slate-100"
                }`}
                onClick={() => setStep(1)}
              >
                <div className="font-medium whitespace-nowrap">1 — Account</div>
                <div className="text-xs text-muted-foreground hidden md:block">
                  Required
                </div>
              </button>
              <button
                className={`shrink-0 md:w-full text-left p-2 rounded-md ${
                  step === 2 ? "bg-primary text-white" : "hover:bg-slate-100"
                }`}
                onClick={() => setStep(2)}
              >
                <div className="font-medium whitespace-nowrap">2 — Profile</div>
                <div className="text-xs text-muted-foreground hidden md:block">
                  Optional
                </div>
              </button>
              <button
                className={`shrink-0 md:w-full text-left p-2 rounded-md ${
                  step === 3 ? "bg-primary text-white" : "hover:bg-slate-100"
                }`}
                onClick={() => setStep(3)}
              >
                <div className="font-medium whitespace-nowrap">
                  3 — Face Submission
                </div>
                <div className="text-xs text-muted-foreground hidden md:block">
                  Optional
                </div>
              </button>
            </nav>
            <div className="mt-4 text-xs text-muted-foreground hidden md:block">
              Tip: required fields are validated on step 1.
            </div>
          </aside>

          <section className="flex-1">
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      value={form.email ?? ""}
                      onChange={(e) => handleChange({ email: e.target.value })}
                      className={inputClass("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="username">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      value={form.username ?? ""}
                      onChange={(e) =>
                        handleChange({ username: e.target.value })
                      }
                      className={inputClass("username")}
                    />
                    {errors.username && (
                      <p className="text-sm text-red-500">{errors.username}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>First name</Label>
                    <Input
                      value={form.firstname ?? ""}
                      onChange={(e) =>
                        handleChange({ firstname: e.target.value })
                      }
                      className={inputClass("firstname")}
                    />
                    {errors.firstname && (
                      <p className="text-sm text-red-500">{errors.firstname}</p>
                    )}
                  </div>
                  <div>
                    <Label>Middle name</Label>
                    <Input
                      value={form.middlename ?? ""}
                      onChange={(e) =>
                        handleChange({ middlename: e.target.value })
                      }
                      className={inputClass("middlename")}
                    />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input
                      value={form.lastname ?? ""}
                      onChange={(e) =>
                        handleChange({ lastname: e.target.value })
                      }
                      className={inputClass("lastname")}
                    />
                    {errors.lastname && (
                      <p className="text-sm text-red-500">{errors.lastname}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={form.password ?? ""}
                      onChange={(e) =>
                        handleChange({ password: e.target.value })
                      }
                      className={inputClass("password")}
                    />
                  </div>
                  <div>
                    <Label>Confirm password</Label>
                    <Input
                      type="password"
                      value={form.confirmPassword ?? ""}
                      onChange={(e) =>
                        handleChange({ confirmPassword: e.target.value })
                      }
                      className={inputClass("confirmPassword")}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-40">
                    <div className="h-32 w-32 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center mx-auto md:mx-0">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
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
                            if (file) setPreviewUrl(URL.createObjectURL(file));
                            else setPreviewUrl(null);
                          } catch (_) {}
                        }}
                      />
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <IconUpload className="mr-2" />
                        Upload
                      </Button>
                      <div className="text-sm text-muted-foreground truncate max-w-full sm:max-w-56">
                        {form.profile_image &&
                        typeof form.profile_image !== "string"
                          ? (form.profile_image as File).name
                          : !form.profile_image
                          ? "No file chosen"
                          : "Using existing image"}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="organization">
                      Organization <span className="text-red-500">*</span>
                    </Label>
                    {orgs.length > 0 ? (
                      <Select
                        value={form.organization}
                        onValueChange={(v) => handleOrganizationChange(v)}
                      >
                        <SelectTrigger
                          id="organization"
                          aria-required={true}
                          className={selectTriggerClass("organization")}
                        >
                          <SelectValue
                            placeholder={
                              loadingOrgs ? "Loading..." : "Select organization"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {orgs.map((o) => (
                            <SelectItem
                              key={o.id ?? o.name}
                              value={String(o.id)}
                            >
                              {o.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="organization"
                        value={form.organization ?? ""}
                        onChange={(e) =>
                          handleOrganizationChange(e.target.value)
                        }
                        className={inputClass("organization")}
                      />
                    )}
                    {errors.organization && (
                      <p className="text-sm text-red-500">
                        {errors.organization}
                      </p>
                    )}
                    <Label htmlFor="role" className="mt-3">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    {roles.length > 0 ? (
                      <Select
                        value={form.role}
                        onValueChange={(v) => handleRoleChange(v)}
                      >
                        <SelectTrigger
                          id="role"
                          aria-required={true}
                          disabled={!form.organization}
                          className={selectTriggerClass("role")}
                        >
                          <SelectValue
                            placeholder={
                              loadingRoles
                                ? "Loading roles..."
                                : !form.organization
                                ? "Select organization first"
                                : "Select role"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="role"
                        value={form.role ?? ""}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className={inputClass("role")}
                        readOnly={!form.organization}
                        placeholder={
                          !form.organization ? "Select organization first" : ""
                        }
                      />
                    )}
                    {errors.role && (
                      <p className="text-sm text-red-500">{errors.role}</p>
                    )}
                    {showProgram && (
                      <div className="mt-3">
                        <Label htmlFor="program">
                          Program <span className="text-red-500">*</span>
                        </Label>
                        {loadingPrograms ? (
                          <div className="text-sm text-muted-foreground">
                            Loading programs...
                          </div>
                        ) : programs.length > 0 ? (
                          <Select
                            value={String(form.program_id ?? "")}
                            onValueChange={(v) => {
                              const pid = Number(v);
                              const p = programs.find(
                                (x) => String(x.id) === String(pid)
                              );
                              handleChange({
                                program_id: pid || undefined,
                                program_code: p ? p.code : undefined,
                              });
                            }}
                          >
                            <SelectTrigger
                              id="program"
                              className={selectTriggerClass("program")}
                            >
                              <SelectValue placeholder="Select program" />
                            </SelectTrigger>
                            <SelectContent>
                              {programs.map((p) => (
                                <SelectItem
                                  key={p.id ?? p.code}
                                  value={String(p.id)}
                                >
                                  {p.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No programs found
                          </div>
                        )}
                        {errors.program_id && (
                          <p className="text-sm text-red-500">
                            {errors.program_id}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Bio</Label>
                  <Input
                    value={form.bio ?? ""}
                    onChange={(e) => handleChange({ bio: e.target.value })}
                    className={inputClass("bio")}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm mb-4">
                    Optionally capture a live face image. Blink to capture.
                  </p>
                  <FaceCamera
                    onCapture={(dataUrl) => {
                      setFaceValidated(true);
                      handleChange({ face_image: dataUrl });
                    }}
                    onRetake={() => {
                      setFaceValidated(false);
                      handleChange({ face_image: null });
                    }}
                  />
                  <div className="mt-3">
                    {faceValidated ? (
                      <span className="text-green-700">
                        Face validated and attached
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        No validated face attached
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              {step > 1 && (
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                >
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (step === 1) {
                      const errs: Record<string, string> = {};
                      if (!form.email) errs.email = "Email is required";
                      if (!form.username)
                        errs.username = "Username is required";
                      if (!form.firstname)
                        errs.firstname = "First name is required";
                      if (!form.lastname)
                        errs.lastname = "Last name is required";
                      if (!form.password)
                        errs.password = "Password is required";
                      if (form.password !== form.confirmPassword)
                        errs.confirmPassword = "Passwords do not match";
                      setErrors(errs);
                      if (Object.keys(errs).length) return;
                    }
                    setStep((s) => Math.min(3, s + 1));
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleSubmit}
                  disabled={saving}
                  aria-busy={saving}
                >
                  Save
                </Button>
              )}
            </div>
          </section>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} aria-busy={saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditUserDrawer;

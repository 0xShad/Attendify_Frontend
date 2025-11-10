"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { profilesAPI } from "@/lib/api/profiles";
import { useToast } from "@/hooks/use-toast";

interface ViewUserDrawerProps {
  profileId?: string | number | null;
  authUserId?: number | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ViewUserDrawer({ profileId, authUserId, open: openProp, onOpenChange }: ViewUserDrawerProps) {
  const isControlled = typeof openProp === 'boolean' && typeof onOpenChange === 'function';
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = isControlled ? (openProp as boolean) : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v); else setInternalOpen(v);
  };

  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState<any>(null);
  const { toast } = useToast();

  const getAvatarSrc = (avatar?: string | null) => {
    if (!avatar) return undefined;
    if (/^https?:\/\//i.test(avatar)) return avatar;
    const raw = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";
    const origin = raw.replace(/\/api\/(v\d+|v1)\/?$/i, "");
    const path = avatar.startsWith('/') ? avatar : `/${avatar}`;
    return `${origin}${path}`;
  };

  React.useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        let p: any = null;
        if (authUserId) {
          try {
            try { console.info(`[ViewUserDrawer] calling /api/profiles/${authUserId}`); } catch (e) {}
            p = await profilesAPI.getProfile(Number(authUserId));
          } catch (err: any) { if (err?.status !== 404) throw err; }
        }
        if (!p && profileId) {
          try { console.info(`[ViewUserDrawer] calling /api/profiles/id/${profileId}`); } catch (e) {}
          p = await (profilesAPI as any).getProfileByProfileId(Number(profileId));
        }
        if (!p) {
          toast({ title: 'Failed to load user', description: 'Profile not found', variant: 'destructive' });
          setOpen(false);
          return;
        }
        if (!mounted) return;
  // NOTE: removed dev-only console logging
        setProfile(p);

        // If backend did not include program_name but a program_id is present,
        // try to resolve a human-friendly program label from the programs endpoint
        // (some backends return program lists as objects with id/code/name).
        try {
          const hasProgramId = (p as any).program_id || (p as any).academic_data?.program_id;
          const orgId = (p as any).organization_id ?? (p as any).organization_data?.id;
          if (!((p as any).program_name) && hasProgramId && orgId && (profilesAPI as any).listProgramCodesByOrganization) {
            const programs = await (profilesAPI as any).listProgramCodesByOrganization(Number(orgId));
            if (Array.isArray(programs) && programs.length > 0) {
              // programs may be array of strings or objects { id, code, name }
              const pid = Number((p as any).program_id ?? (p as any).academic_data?.program_id);
              let resolved: string | undefined;
              if (typeof programs[0] === 'string') {
                // no ids to match - leave unresolved
                resolved = undefined;
              } else {
                const found = (programs as any[]).find((pr) => Number(pr.id) === pid || String(pr.code).toLowerCase() === String((p as any).program_code ?? '').toLowerCase());
                if (found) resolved = found.name ?? found.code ?? String(found.id ?? '');
              }
              if (resolved) setProfile((prev: any) => ({ ...(prev || {}), program_name: resolved }));
            }
          }
        } catch (e) {
          /* non-fatal: unable to resolve program list */
        }
      } catch (err: any) {
        toast({ title: 'Failed to load user', description: err?.message || 'Could not fetch user data', variant: 'destructive' });
        setOpen(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, profileId, authUserId, toast]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost">View</Button>
      </DrawerTrigger>
      <DrawerContent className="px-0">
        <DrawerHeader className="px-4">
          <DrawerTitle>User details</DrawerTitle>
          <DrawerDescription>Read-only profile information</DrawerDescription>
        </DrawerHeader>

        <div className="p-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : profile ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  {profile.avatar_url ? (
                    <AvatarImage src={getAvatarSrc(profile.avatar_url)} alt={profile.username ?? 'avatar'} />
                  ) : (
                    <AvatarFallback className="bg-slate-500 text-white">{(profile.firstname || profile.username || 'U').charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="text-lg font-semibold">{[profile.firstname, profile.middlename, profile.lastname].filter(Boolean).join(' ') || profile.username}</div>
                  {profile.email && <div className="text-sm text-muted-foreground">{profile.email}</div>}
                  <div className="text-xs text-muted-foreground">ID: {profile.id ?? profile.user_id}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Organization</Label>
                  <div className="mt-1 text-sm">{(profile.organization_data && profile.organization_data.name) || 'Attendify'}</div>
                </div>
                <div>
                  <Label>Role</Label>
                  <div className="mt-1 text-sm">{profile.role ?? '-'}</div>
                </div>
                <div>
                  <Label>Program</Label>
                      <div className="mt-1 text-sm">
                        {(() => {
                          // Prefer human-friendly program_name, then top-level program_code,
                          // then academic_data.program_code, then program_id. Treat empty strings as absent.
                          const maybe = (v: any) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? undefined : v);
                          const pName = maybe(profile.program_name) ?? maybe((profile as any).program);
                          const pCode = maybe((profile as any).program_code) ?? maybe(profile.academic_data?.program_code) ?? maybe((profile as any).program_code);
                          const pId = maybe(profile.academic_data?.program_id) ?? maybe(profile.program_id);
                          const display = pName ?? pCode ?? (pId ? `ID: ${pId}` : undefined) ?? '-';
                          return display;
                        })()}
                      </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1 text-sm">{profile.last_active ? 'Active' : 'Inactive'}</div>
                </div>
              </div>

              <div>
                <Label>Bio</Label>
                <div className="mt-1 text-sm">{profile.bio ?? '-'}</div>
              </div>

              {profile.face_image && (
                <div>
                  <Label>Face image</Label>
                  <div className="mt-2">
                    <img src={getAvatarSrc(profile.face_image)} alt="face" className="w-48 h-48 object-cover rounded-md" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No user selected</div>
          )}
        </div>

        <DrawerFooter>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { parseISO, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Edit } from "lucide-react";
import resolveAvatarUrl from "@/lib/utils/resolveAvatarUrl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  profileData: any;
  setProfileData: (p: any) => void;
  isEditing: boolean;
  setIsEditing?: (v: boolean) => void;
  onSave?: () => Promise<void> | void;
  onCancel?: () => void;
  isSaving?: boolean;
  isLoading?: boolean;
};

export default function BasicInfo({
  profileData,
  setProfileData,
  isEditing,
  setIsEditing,
  onSave,
  onCancel,
  isSaving = false,
  isLoading = false,
}: Props) {
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmailEduPh = (email?: string | null) => {
    if (!email) return false;
    // accept any email with @
    return /@/.test(email.trim());
  };

  const handleSaveClick = async () => {
    // validate email when present
    const email = profileData?.email ?? null;
    if (email && !validateEmailEduPh(String(email))) {
      setEmailError("Email must contain an @ symbol");
      return;
    }
    setEmailError(null);
    if (onSave) {
      await Promise.resolve(onSave());
    }
  };
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    // store the File object so the parent can upload it when saving
    setProfileData({
      ...profileData,
      avatar_preview: url,
      avatar_file_name: file.name,
      avatar_file: file,
    });
  };

  const first = profileData.firstname ?? profileData.firstName ?? "User";
  const middle = profileData.middlename ?? profileData.middleName ?? "";
  const last = profileData.lastname ?? profileData.lastName ?? "";
  const displayName = [first, middle, last].filter(Boolean).join(" ");
  const initials = (
    String(profileData.firstname || "")[0] || "U"
  ).toUpperCase();

  // Parse last active timestamp into a friendly relative string and an absolute Manila time for tooltip
  const rawLastActive =
    profileData.last_active ?? profileData.lastActive ?? profileData.lastSeen;
  let lastActiveText = "Just now";
  let formattedManila: string | undefined = undefined;
  if (rawLastActive) {
    try {
      const parsed =
        typeof rawLastActive === "string"
          ? parseISO(rawLastActive)
          : new Date(rawLastActive);
      if (!isNaN(parsed.getTime())) {
        lastActiveText = formatDistanceToNow(parsed, { addSuffix: true });
        try {
          formattedManila = new Intl.DateTimeFormat("en-PH", {
            timeZone: "Asia/Manila",
            dateStyle: "medium",
            timeStyle: "short",
          }).format(parsed);
        } catch (err) {
          // ignore formatting errors; leave formattedManila undefined
          formattedManila = undefined;
        }
      }
    } catch (e) {
      // fallback to raw value if parsing fails
      lastActiveText = String(rawLastActive);
      formattedManila = String(rawLastActive);
    }
  }
  return (
    <Card className="w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-slate-100 shadow-xl">
      <div className="flex flex-col md:flex-row">
        {/* LEFT COLUMN: Sidebar */}
        <div className="relative flex w-full flex-col items-center justify-start border-b border-slate-700/50 md:w-[320px] md:border-b-0 md:border-r bg-slate-900/20 p-8 text-center">
          <div className="absolute top-0 left-0 right-0 h-px bg-white/5" />

          {/* Avatar Section */}
          <div className="relative mb-6 z-10 mt-4">
            <div className="absolute -inset-4 rounded-full bg-slate-500/20 blur-2xl opacity-50" />
            {isLoading ? (
              <div className="h-36 w-36 rounded-full bg-slate-700/30 animate-pulse" />
            ) : (
              <Avatar className="relative h-36 w-36 border-4 border-slate-700 shadow-md">
                {(() => {
                  // Prefer local preview (blob/data URL) if present, otherwise resolve backend URL
                  const preview = profileData?.avatar_preview;
                  const raw =
                    profileData?.avatar_url ??
                    profileData?.avatarUrl ??
                    profileData?.avatar;
                  const avatarSrc = preview
                    ? String(preview)
                    : raw
                    ? resolveAvatarUrl(String(raw)) ?? undefined
                    : undefined;
                  return avatarSrc ? (
                    <AvatarImage
                      src={String(avatarSrc)}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="text-4xl font-bold bg-slate-700 text-slate-300">
                      {initials}
                    </AvatarFallback>
                  );
                })()}
              </Avatar>
            )}
          </div>

          {/* Identity Info */}
          <div className="mb-8 space-y-3 z-10">
            {isLoading ? (
              <>
                <div className="h-6 w-40 rounded bg-slate-700/30 animate-pulse mx-auto" />
                <div className="h-3 w-32 rounded bg-slate-700/20 animate-pulse mx-auto mt-2" />
              </>
            ) : (
              <>
                <h3 className="font-bold text-2xl tracking-tight text-white">
                  {displayName || "New User"}
                </h3>
                <div className="flex flex-col items-center gap-2">
                  <Badge className="px-4 py-1.5 font-medium capitalize bg-slate-700 text-slate-200 hover:bg-slate-600 border-0">
                    {profileData.role ?? "Student"}
                  </Badge>
                  <span
                    className="text-xs font-medium text-slate-400 mt-1"
                    title={
                      formattedManila
                        ? `Asia/Manila — ${formattedManila}`
                        : undefined
                    }
                  >
                    Last seen: {lastActiveText}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3 z-10">
            {isLoading ? (
              <>
                <div className="h-10 w-full rounded bg-slate-700/20 animate-pulse" />
                <div className="h-8 w-full rounded bg-slate-700/10 animate-pulse" />
              </>
            ) : isEditing ? (
              <>
                <label className="w-full cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                  <div className="flex w-full items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-bold shadow hover:bg-blue-500 hover:-translate-y-0.5 transition-all">
                    Upload Photo
                  </div>
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-400 hover:text-red-400 hover:bg-slate-700/50"
                  onClick={() =>
                    setProfileData({
                      ...profileData,
                      avatar_preview: undefined,
                      avatar_file_name: undefined,
                      avatar_url: undefined,
                    })
                  }
                >
                  Remove Picture
                </Button>
              </>
            ) : (
              <p className="text-xs text-slate-400 px-4 leading-relaxed">
                Switch to edit mode to make changes.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Form Details */}
        <div className="flex-1 p-8 lg:p-12">
          <div className="mb-8 pb-4 border-b border-slate-700/50">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  General Information
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Manage the basic details displayed on your public profile.
                </p>
              </div>
              <div>
                {!isEditing && setIsEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : null}

                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        void handleSaveClick();
                      }}
                      disabled={isSaving || isLoading}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-slate-700 text-slate-100 hover:bg-slate-600 hover:text-white border-slate-600"
                      onClick={() => {
                        if (onCancel) onCancel();
                        else if (setIsEditing) setIsEditing(false);
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Name Row: First, Middle, Last (always show Middle) */}
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <Label className="text-sm">First Name</Label>
                {isLoading ? (
                  <div className="h-10 w-full rounded bg-slate-700/20 animate-pulse" />
                ) : (
                  <Input
                    value={profileData.firstname ?? profileData.firstName ?? ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        firstname: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    placeholder="First name"
                  />
                )}
              </div>

              <div>
                <Label className="text-sm">Middle Name</Label>
                {isLoading ? (
                  <div className="h-10 w-full rounded bg-slate-700/20 animate-pulse" />
                ) : (
                  <Input
                    value={
                      profileData.middlename ?? profileData.middleName ?? ""
                    }
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        middlename: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    placeholder="Middle name"
                  />
                )}
              </div>

              <div>
                <Label className="text-sm">Last Name</Label>
                {isLoading ? (
                  <div className="h-10 w-full rounded bg-slate-700/20 animate-pulse" />
                ) : (
                  <Input
                    value={profileData.lastname ?? profileData.lastName ?? ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lastname: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    placeholder="Last name"
                  />
                )}
              </div>
            </div>

            {/* Contact Row */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Email Address</Label>
                {isLoading ? (
                  <div className="h-10 w-full rounded bg-slate-700/20 animate-pulse" />
                ) : (
                  <>
                    <Input
                      type="email"
                      value={profileData.email ?? ""}
                      onChange={(e: any) => {
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        });
                        setEmailError(null);
                      }}
                      disabled={!isEditing}
                    />
                    {emailError ? (
                      <p className="text-xs text-red-400 mt-1">{emailError}</p>
                    ) : null}
                  </>
                )}
              </div>
              <div className="relative">
                <Label className="text-sm">Username</Label>
                {isLoading ? (
                  <div className="h-10 w-full rounded bg-slate-700/20 animate-pulse pl-8" />
                ) : (
                  <>
                    <Input
                      id="username"
                      value={profileData.username ?? ""}
                      onChange={(e: any) =>
                        setProfileData({
                          ...profileData,
                          username: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-[1.95rem] text-slate-400 font-medium">
                      @
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Bio Section */}
            <div className="space-y-2.5">
              <Label
                htmlFor="bio"
                className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400"
              >
                About You
              </Label>
              {isLoading ? (
                <div className="h-36 w-full rounded bg-slate-700/20 animate-pulse" />
              ) : (
                <>
                  <textarea
                    id="bio"
                    value={profileData.bio ?? ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, bio: e.target.value })
                    }
                    disabled={!isEditing}
                    // Changed background to lighter slate-700/40 and lighter border
                    className="flex min-h-[140px] w-full rounded-lg border border-slate-600 bg-slate-700/40 px-4 py-3 text-sm text-slate-100 ring-offset-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 resize-none hover:bg-slate-700/60"
                    placeholder="Tell the community a little about yourself..."
                  />
                  <p className="text-[0.75rem] text-slate-500 text-right font-medium">
                    {profileData.bio?.length || 0} / 240 characters
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Updated Input Component for Lighter Fields
function LighterInput({
  id,
  label,
  value,
  onChange,
  disabled,
  type = "text",
  className = "",
}: any) {
  return (
    <div className="space-y-2.5">
      <Label
        htmlFor={id}
        className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400"
      >
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        // KEY CHANGE: bg-slate-700/40 (lighter) instead of slate-900 (darker)
        // Border is also lighter (slate-600)
        className={`h-11 border-slate-600 bg-slate-700/40 text-slate-100 placeholder:text-slate-400 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/60 transition-colors ${className}`}
      />
    </div>
  );
}

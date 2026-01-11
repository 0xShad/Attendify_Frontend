"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react";

import { changeMyPassword } from "@/lib/api/auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  passwordData: any;
  setPasswordData: (p: any) => void;
  isSaving?: boolean;
  handleUpdatePassword?: () => Promise<void> | void;
  faceDataStatus?: any;
  isProcessingFace?: boolean;
  startFaceDataUpdate?: () => void;
  deleteFaceData?: () => Promise<void>;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (v: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
};

export default function SecuritySettings({
  passwordData,
  setPasswordData,
  isSaving,
  handleUpdatePassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: Props) {
  const [localSaving, setLocalSaving] = useState(false);
  const { toast } = useToast();

  const effectiveSaving = Boolean(isSaving) || localSaving;

  async function internalUpdatePassword() {
    // basic validation
    if (!passwordData?.currentPassword || !passwordData?.newPassword) {
      toast({
        title: "Missing fields",
        description: "Please provide current and new password (min length 6).",
        variant: "destructive",
      });
      return;
    }

    if ((passwordData.newPassword || "").length < 6) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (
      passwordData.confirmPassword &&
      passwordData.confirmPassword !== passwordData.newPassword
    ) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLocalSaving(true);
      await changeMyPassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword,
      });

      // clear fields on success
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Password Updated",
        description: "Your password has been changed.",
      });
    } catch (err: any) {
      const msg =
        err?.body?.message || err?.message || "Failed to update password";
      toast({
        title: "Failed to update password",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLocalSaving(false);
    }
  }
  return (
    <Card className="w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-slate-100 shadow-2xl">
      <CardHeader className="border-b border-slate-700/50 pb-5 bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-900/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Security Settings
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              Manage your password and account security
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 lg:p-10 space-y-10">
        {/* Current Password Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/50">
              <LockKeyhole className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-200">
              Current Password
            </h3>
          </div>

          <div className="relative">
            <Label htmlFor="currentPassword" className="sr-only">
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              placeholder="Enter your current password"
              className="h-12 border-slate-600 bg-slate-700/40 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 pr-12 transition-all hover:bg-slate-700/60 text-base"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-4 text-slate-400 hover:text-slate-200 hover:bg-slate-600/30"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

        {/* New Password Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <LockKeyhole className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-slate-200">
              Set New Password
            </h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label
                htmlFor="newPassword"
                className="text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Enter new password"
                  className="h-12 border-slate-600 bg-slate-700/40 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 pr-12 transition-all hover:bg-slate-700/60 text-base"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-4 text-slate-400 hover:text-slate-200 hover:bg-slate-600/30"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                  className="h-12 border-slate-600 bg-slate-700/40 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 pr-12 transition-all hover:bg-slate-700/60 text-base"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-4 text-slate-400 hover:text-slate-200 hover:bg-slate-600/30"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-slate-700/20 border border-slate-700/50 rounded-xl p-4 mt-4">
            <p className="text-xs font-semibold text-slate-400 mb-2">
              Password Requirements:
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
              <li>Minimum 6 characters long</li>
              <li>Both passwords must match</li>
              <li>Use a strong, unique password</li>
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-6">
          <Button
            onClick={async () => {
              if (handleUpdatePassword) {
                // delegate to parent-provided handler
                try {
                  await handleUpdatePassword();
                } catch (e) {
                  // parent should handle errors; we keep a fallback
                  console.error(e);
                }
              } else {
                await internalUpdatePassword();
              }
            }}
            disabled={effectiveSaving}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-xl shadow-blue-900/30 px-8 py-6 text-base rounded-xl transition-all hover:-translate-y-0.5"
          >
            {effectiveSaving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Update Password
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

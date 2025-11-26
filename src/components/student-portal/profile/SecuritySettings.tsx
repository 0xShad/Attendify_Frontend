"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Save, ShieldCheck, LockKeyhole } from "lucide-react";

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
      toast({ title: "Missing fields", description: "Please provide current and new password (min length 6).", variant: "destructive" });
      return;
    }

    if ((passwordData.newPassword || "").length < 6) {
      toast({ title: "Password Too Short", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    if (
      passwordData.confirmPassword &&
      passwordData.confirmPassword !== passwordData.newPassword
    ) {
      toast({ title: "Password Mismatch", description: "New password and confirmation do not match.", variant: "destructive" });
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
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Password Updated", description: "Your password has been changed." });
    } catch (err: any) {
      const msg = err?.body?.message || err?.message || "Failed to update password";
      toast({ title: "Failed to update password", description: msg, variant: "destructive" });
    } finally {
      setLocalSaving(false);
    }
  }
  return (
    <Card className="w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-slate-100 shadow-xl">
      <CardHeader className="border-b border-slate-700/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-white">Security Settings</CardTitle>
            <CardDescription className="text-slate-400">Manage your password and account security</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 lg:p-8 space-y-8">
        
        {/* Current Password Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <LockKeyhole className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-300">Current Password</h3>
          </div>
          
          <div className="relative">
            <Label htmlFor="currentPassword" className="sr-only">Current Password</Label>
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              placeholder="Enter your current password"
              className="h-11 border-slate-600 bg-slate-700/40 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 pr-10 transition-colors hover:bg-slate-700/60"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-200 hover:bg-transparent"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-slate-700/50" />

        {/* New Password Section */}
        <div className="space-y-5">
           <div className="flex items-center gap-2 mb-2">
            <LockKeyhole className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-medium text-slate-300">Set New Password</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="h-11 border-slate-600 bg-slate-700/40 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 pr-10 transition-colors hover:bg-slate-700/60"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-200 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="h-11 border-slate-600 bg-slate-700/40 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 pr-10 transition-colors hover:bg-slate-700/60"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-200 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
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
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-900/20 px-6"
          >
            {effectiveSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Update Password
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
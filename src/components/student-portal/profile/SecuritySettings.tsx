"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Save, Camera, Trash2, Scan } from "lucide-react";

type Props = {
  passwordData: any;
  setPasswordData: (p: any) => void;
  isSaving: boolean;
  handleUpdatePassword: () => Promise<void> | void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (v: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
  faceDataStatus: any;
  isProcessingFace: boolean;
  startFaceDataUpdate: () => void;
  deleteFaceData: () => Promise<void> | void;
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
  faceDataStatus,
  isProcessingFace,
  startFaceDataUpdate,
  deleteFaceData,
}: Props) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                placeholder="Enter current password"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={handleUpdatePassword} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Face Recognition Card */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Face Recognition</CardTitle>
          <CardDescription>Manage your biometric authentication data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {faceDataStatus.isRegistered ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium">Face data registered</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label>Last Updated</Label>
                  <p className="font-medium">{faceDataStatus.lastUpdated}</p>
                </div>
                <div>
                  <Label>Recognition Accuracy</Label>
                  <p className="font-medium">{faceDataStatus.accuracy}%</p>
                </div>
                <div>
                  <Label>Backup Images</Label>
                  <p className="font-medium">{faceDataStatus.backupImages} images</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={startFaceDataUpdate} disabled={isProcessingFace}>
                  <Camera className="w-4 h-4 mr-2" /> Update Face Data
                </Button>
                <Button variant="destructive" onClick={deleteFaceData} disabled={isProcessingFace}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Face Data
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium">No face data registered</span>
              </div>

              <div className="flex gap-2">
                <Button onClick={startFaceDataUpdate} disabled={isProcessingFace}>
                  <Camera className="w-4 h-4 mr-2" /> Register Face Data
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

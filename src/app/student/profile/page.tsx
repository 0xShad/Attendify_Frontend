"use client";

import React, { useState, useEffect } from "react";
import {
  Camera,
  Trash2,
  Scan,
  Loader2,
  Edit,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BasicInfo from "@/components/student-portal/profile/BasicInfo";
import AcademicInfo from "@/components/student-portal/profile/AcademicInfo";
import SecuritySettings from "@/components/student-portal/profile/SecuritySettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
// Alert component not available - will use Card instead
import { useToast } from "@/hooks/use-toast";

export default function StudentProfile() {
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [faceDataDrawerOpen, setFaceDataDrawerOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isProcessingFace, setIsProcessingFace] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile data - start empty so UI shows loading skeletons instead of sample data
  const [profileData, setProfileData] = useState<any>({});

  // Start as loading so the first render shows skeletons immediately
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [faceDataStatus, setFaceDataStatus] = useState({
    isRegistered: true,
    lastUpdated: "2025-10-01",
    accuracy: 98.5,
    backupImages: 5,
  });

  const enrolledClasses = [
    { id: "CS101", name: "Introduction to Computer Science", code: "CS101" },
    { id: "MATH201", name: "Calculus II", code: "MATH201" },
    { id: "ENG102", name: "English Composition", code: "ENG102" },
  ];

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Build editable fields
      const payload: any = {
        firstname: profileData.firstname ?? profileData.firstName,
        lastname: profileData.lastname ?? profileData.lastName,
        middlename: profileData.middlename ?? profileData.middleName,
        email: profileData.email,
        username: profileData.username,
        bio: profileData.bio,
      };

      const avatarFile = profileData?.avatar_file as File | undefined;
      let resp: Response;

      if (avatarFile) {
        // Multipart form when a file is present
        const fd = new FormData();
        // append only defined values
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append('avatar_file', avatarFile, avatarFile.name);

        resp = await fetch('/api/profiles/mine', {
          method: 'PATCH',
          body: fd,
        });
      } else {
        resp = await fetch('/api/profiles/mine', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        toast({ title: 'Failed to save profile', description: txt || `Status ${resp.status}`, variant: 'destructive' });
        return;
      }

      // After successful save, re-fetch authoritative profile from backend
      setIsLoadingProfile(true);
      const refresh = await fetch('/api/profiles/mine', { headers: { Accept: 'application/json' } });
      if (refresh.ok) {
        const data = await refresh.json();
        setProfileData((prev) => ({
          ...prev,
          ...data,
          firstName: data.firstname ?? data.firstName ?? prev.firstName,
          lastName: data.lastname ?? data.lastName ?? prev.lastName,
          firstname: data.firstname ?? data.firstName ?? prev.firstname,
          lastname: data.lastname ?? data.lastName ?? prev.lastname,
          avatar_url: data.avatar_url ?? data.avatarUrl ?? prev.avatar_url,
          face_image: data.face_image ?? data.faceImage ?? prev.face_image,
          email: data.email ?? prev.email,
          username: data.username ?? prev.username,
          bio: data.bio ?? prev.bio,
          organization_id: data.organization_id ?? data.organizationId ?? prev.organization_id,
          program_id: data.program_id ?? data.programId ?? prev.program_id,
        }));
      }

      setIsEditing(false);
      toast({ title: 'Profile saved', description: 'Your changes have been saved.' });
    } catch (err: any) {
      console.error('Save failed', err);
      toast({ title: 'Error saving', description: err?.message ?? String(err), variant: 'destructive' });
    } finally {
      setIsSaving(false);
      setIsLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    setIsSaving(true);
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Password Mismatch", description: "New password and confirmation don't match.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({ title: "Password Too Short", description: "Password must be at least 8 characters long.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    // Simulate server update
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast({ title: "Password Updated", description: "Your password has been changed." });
  };

  const startFaceDataUpdate = () => {
    setFaceDataDrawerOpen(true);
    setCameraActive(true);
  };

  const deleteFaceData = async () => {
    setIsProcessingFace(true);
    // Simulate deletion
    await new Promise((r) => setTimeout(r, 800));
    setIsProcessingFace(false);
    setFaceDataStatus({ isRegistered: false, lastUpdated: "", accuracy: 0, backupImages: 0 });
    toast({ title: "Face Data Deleted", description: "Your face data has been removed.", variant: "destructive" });
  };

  const handleFaceDataUpdate = async () => {
    setIsProcessingFace(true);
    // Simulate capture and upload
    await new Promise((r) => setTimeout(r, 1200));
    setIsProcessingFace(false);
    setFaceDataStatus({ isRegistered: true, lastUpdated: new Date().toISOString().slice(0, 10), accuracy: 98.0, backupImages: 3 });
    setFaceDataDrawerOpen(false);
    setCameraActive(false);
    toast({ title: "Face Data Updated", description: "Face data registered/updated successfully." });
  };

  // Load profile on mount (merge returned fields into profileData)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoadingProfile(true);
      try {
        const resp = await fetch('/api/profiles/mine', { headers: { Accept: 'application/json' } });
        if (!mounted) return;
        if (!resp.ok) {
          const txt = await resp.text().catch(() => '');
          if (resp.status === 401) {
            toast({ title: 'Not authenticated', description: 'Please sign in to load your profile.', variant: 'destructive' });
          } else if (resp.status === 404) {
            toast({ title: 'Profile not found', description: 'No local profile exists for this account.', variant: 'destructive' });
          } else {
            toast({ title: 'Failed to load profile', description: txt || `Status ${resp.status}`, variant: 'destructive' });
          }
          setIsLoadingProfile(false);
          return;
        }

        const data = await resp.json();
        // Merge data into local profileData shape, be tolerant of different key names
        setProfileData((prev) => ({
          ...prev,
          ...data,
          firstName: data.firstname ?? data.firstName ?? prev.firstName,
          lastName: data.lastname ?? data.lastName ?? prev.lastName,
          firstname: data.firstname ?? data.firstName ?? prev.firstname,
          lastname: data.lastname ?? data.lastName ?? prev.lastname,
          avatar_url: data.avatar_url ?? data.avatarUrl ?? prev.avatar_url,
          face_image: data.face_image ?? data.faceImage ?? prev.face_image,
          email: data.email ?? prev.email,
          username: data.username ?? prev.username,
          bio: data.bio ?? prev.bio,
          organization_id: data.organization_id ?? data.organizationId ?? prev.organization_id,
          program_id: data.program_id ?? data.programId ?? prev.program_id,
        }));

        // If face image present, update faceDataStatus
        if (data.face_image || data.faceImage) {
          setFaceDataStatus((s) => ({ ...s, isRegistered: true }));
        }
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        toast({ title: 'Error', description: err?.message ?? String(err), variant: 'destructive' });
      } finally {
        if (mounted) setIsLoadingProfile(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4 mt-4 md:space-y-6">
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Personal Information - single merged component */}
            <TabsContent value="personal" className="space-y-6">
              <BasicInfo
                profileData={profileData}
                setProfileData={setProfileData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onSave={handleSaveProfile}
                onCancel={() => setIsEditing(false)}
                isSaving={isSaving}
                isLoading={isLoadingProfile}
              />
            </TabsContent>

        {/* Academic Information */}
        <TabsContent value="academic" className="space-y-6">
          <AcademicInfo />
        </TabsContent>

        {/* Security Settings (modularized) */}
        <TabsContent value="security" className="space-y-6">
          <SecuritySettings
            passwordData={passwordData}
            setPasswordData={setPasswordData}
            isSaving={isSaving}
            handleUpdatePassword={handleUpdatePassword}
            showCurrentPassword={showCurrentPassword}
            setShowCurrentPassword={setShowCurrentPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            faceDataStatus={faceDataStatus}
            isProcessingFace={isProcessingFace}
            startFaceDataUpdate={startFaceDataUpdate}
            deleteFaceData={deleteFaceData}
          />
        </TabsContent>
      </Tabs>

      {/* Face Data Update Drawer */}
      <Drawer
        open={faceDataDrawerOpen}
        onOpenChange={(open: boolean) => {
          setFaceDataDrawerOpen(open);
          if (!open) {
            setCameraActive(false);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {faceDataStatus.isRegistered
                ? "Update Face Data"
                : "Register Face Data"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-4">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-64 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  {isProcessingFace ? (
                    <div className="space-y-2">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                      <p className="text-sm text-muted-foreground">
                        Processing...
                      </p>
                    </div>
                  ) : cameraActive ? (
                    <div className="space-y-2">
                      <div className="w-32 h-32 border-2 border-blue-500 rounded-lg flex items-center justify-center animate-pulse">
                        <Camera className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Look straight at the camera
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-muted-foreground">
                        Camera starting...
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Keep your face well-lit and clearly visible</p>
                  <p>• Remove any face coverings</p>
                  <p>• Look directly at the camera</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleFaceDataUpdate}
                  disabled={isProcessingFace || !cameraActive}
                  className="flex-1"
                >
                  {isProcessingFace ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      {faceDataStatus.isRegistered ? "Update" : "Register"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFaceDataDrawerOpen(false)}
                  disabled={isProcessingFace}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
          <DrawerFooter className="px-4 pb-4">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Camera,
  Upload,
  Trash2,
  Scan,
  Loader2,
  Check,
  X,
  Edit,
  Save,
  Eye,
  EyeOff,
  Bell,
  Shield,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Settings,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  // Profile data
  const [profileData, setProfileData] = useState({
    // Basic Info
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex.johnson@student.edu",
    phone: "+1 (555) 123-4567",
    studentId: "ST202400123",
    dateOfBirth: "1999-05-15",

    // Academic Info
    major: "Computer Science",
    minor: "Mathematics",
    year: "Junior",
    expectedGraduation: "Spring 2026",
    gpa: "3.85",

    // Contact Info
    address: "123 Campus Drive, Apt 4B",
    city: "University City",
    state: "NY",
    zipCode: "12345",
    emergencyContact: "Jane Johnson",
    emergencyPhone: "+1 (555) 987-6543",

    // Preferences
    theme: "system",
    language: "en",
    timezone: "America/New_York",

    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    attendanceReminders: true,
    gradeUpdates: true,
    announcementAlerts: true,

    // Privacy
    profileVisibility: "students",
    showEmail: false,
    showPhone: false,
  });

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
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setIsEditing(false);

    toast({
      title: "Profile Updated ✓",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    toast({
      title: "Password Updated ✓",
      description: "Your password has been changed successfully.",
    });
  };

  const startFaceDataUpdate = () => {
    setFaceDataDrawerOpen(true);
    setCameraActive(true);
  };

  const handleFaceDataUpdate = async () => {
    setIsProcessingFace(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsProcessingFace(false);
    setCameraActive(false);
    setFaceDataDrawerOpen(false);

    setFaceDataStatus({
      ...faceDataStatus,
      lastUpdated: new Date().toISOString().split("T")[0],
      accuracy: 99.2,
      backupImages: 6,
    });

    toast({
      title: "Face Data Updated ✓",
      description: "Your face recognition data has been updated successfully.",
    });
  };

  const deleteFaceData = async () => {
    setIsProcessingFace(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsProcessingFace(false);

    setFaceDataStatus({
      isRegistered: false,
      lastUpdated: "",
      accuracy: 0,
      backupImages: 0,
    });

    toast({
      title: "Face Data Deleted",
      description:
        "Your face recognition data has been removed from the system.",
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>

        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal" className="space-y-6">
          {/* Profile Picture & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="/avatars/student-alex.jpg" />
                  <AvatarFallback className="text-lg font-semibold bg-purple-100 text-purple-700">
                    {profileData.firstName[0]}
                    {profileData.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div>
                    <Label>Profile Picture</Label>
                    <p className="text-sm text-muted-foreground">
                      Update your profile picture (recommended: 400x400px)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={!isEditing}>
                      <Upload className="w-3 h-3 mr-2" />
                      Upload New
                    </Button>
                    <Button size="sm" variant="outline" disabled={!isEditing}>
                      <Trash2 className="w-3 h-3 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        firstName: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lastName: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={profileData.studentId}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        dateOfBirth: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Your address and emergency contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData({ ...profileData, address: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profileData.city}
                    onChange={(e) =>
                      setProfileData({ ...profileData, city: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profileData.state}
                    onChange={(e) =>
                      setProfileData({ ...profileData, state: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={profileData.zipCode}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        zipCode: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={profileData.emergencyContact}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        emergencyContact: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={profileData.emergencyPhone}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        emergencyPhone: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Information */}
        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>
                Your academic program and course details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    value={profileData.major}
                    onChange={(e) =>
                      setProfileData({ ...profileData, major: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="minor">Minor</Label>
                  <Input
                    id="minor"
                    value={profileData.minor}
                    onChange={(e) =>
                      setProfileData({ ...profileData, minor: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Academic Year</Label>
                  <Select
                    value={profileData.year}
                    onValueChange={(value) =>
                      setProfileData({ ...profileData, year: value })
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Freshman">Freshman</SelectItem>
                      <SelectItem value="Sophomore">Sophomore</SelectItem>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expectedGraduation">
                    Expected Graduation
                  </Label>
                  <Input
                    id="expectedGraduation"
                    value={profileData.expectedGraduation}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        expectedGraduation: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="gpa">Current GPA</Label>
                  <Input
                    id="gpa"
                    value={profileData.gpa}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrolled Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Classes</CardTitle>
              <CardDescription>
                Classes you're currently enrolled in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {enrolledClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.code}
                      </p>
                    </div>
                    <Badge variant="outline">Enrolled</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          {/* Password Change */}
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
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
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
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Enter new password"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
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
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button onClick={handleUpdatePassword} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Face Recognition Data */}
          <Card>
            <CardHeader>
              <CardTitle>Face Recognition</CardTitle>
              <CardDescription>
                Manage your biometric authentication data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {faceDataStatus.isRegistered ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Face data registered</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label>Last Updated</Label>
                      <p className="font-medium">
                        {faceDataStatus.lastUpdated}
                      </p>
                    </div>
                    <div>
                      <Label>Recognition Accuracy</Label>
                      <p className="font-medium">{faceDataStatus.accuracy}%</p>
                    </div>
                    <div>
                      <Label>Backup Images</Label>
                      <p className="font-medium">
                        {faceDataStatus.backupImages} images
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={startFaceDataUpdate}
                      disabled={isProcessingFace}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Update Face Data
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={deleteFaceData}
                      disabled={isProcessingFace}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Face Data
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-medium">No face data registered</span>
                  </div>

                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="flex items-start gap-3 p-4">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <p className="text-yellow-700 text-sm">
                        Face recognition is required for in-person attendance.
                        Please register your face data to mark attendance.
                      </p>
                    </CardContent>
                  </Card>

                  <Button
                    onClick={startFaceDataUpdate}
                    disabled={isProcessingFace}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Register Face Data
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Choose which notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.emailNotifications}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your device
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.pushNotifications}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      pushNotifications: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Attendance Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded before classes start
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.attendanceReminders}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      attendanceReminders: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Grade Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when grades are posted
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.gradeUpdates}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      gradeUpdates: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Announcement Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about class announcements
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.announcementAlerts}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      announcementAlerts: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Display & Privacy</CardTitle>
              <CardDescription>
                Customize your display settings and privacy preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={profileData.theme}
                  onValueChange={(value) =>
                    setProfileData({ ...profileData, theme: value })
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={profileData.language}
                  onValueChange={(value) =>
                    setProfileData({ ...profileData, language: value })
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={profileData.timezone}
                  onValueChange={(value) =>
                    setProfileData({ ...profileData, timezone: value })
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">
                      Eastern Time
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      Central Time
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      Mountain Time
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Email to Other Students</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow classmates to see your email
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.showEmail}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      showEmail: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Phone to Other Students</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow classmates to see your phone number
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.showPhone}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      showPhone: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
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

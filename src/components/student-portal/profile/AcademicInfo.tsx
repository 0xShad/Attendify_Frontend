"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type EnrolledClass = { id: string; name: string; code: string };

type Props = {
  profileData: any;
  setProfileData: (p: any) => void;
  isEditing: boolean;
  enrolledClasses: EnrolledClass[];
};

export default function AcademicInfo({ profileData, setProfileData, isEditing, enrolledClasses }: Props) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Academic Information</CardTitle>
          <CardDescription>Your academic program and course details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                value={profileData.major || ""}
                onChange={(e) => setProfileData({ ...profileData, major: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="minor">Minor</Label>
              <Input
                id="minor"
                value={profileData.minor || ""}
                onChange={(e) => setProfileData({ ...profileData, minor: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="year">Academic Year</Label>
              <Select
                value={profileData.year || ""}
                onValueChange={(value) => setProfileData({ ...profileData, year: value })}
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
              <Label htmlFor="expectedGraduation">Expected Graduation</Label>
              <Input
                id="expectedGraduation"
                value={profileData.expectedGraduation || ""}
                onChange={(e) => setProfileData({ ...profileData, expectedGraduation: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="gpa">Current GPA</Label>
              <Input id="gpa" value={profileData.gpa || ""} disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrolled Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Classes</CardTitle>
          <CardDescription>Classes you&apos;re currently enrolled in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {enrolledClasses.map((cls) => (
              <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{cls.name}</p>
                  <p className="text-sm text-muted-foreground">{cls.code}</p>
                </div>
                <Badge variant="outline">Enrolled</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import { Camera, Clock, Loader2, Scan } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActiveSessions from "@/components/student-portal/attendance/ActiveSessions";
import AttendanceHistory from "@/components/student-portal/attendance/AttendanceHistory";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";

type AttendanceSession = {
  id: string;
  classId: string;
  className: string;
  instructor: string;
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  mode: "Online" | "In-Person";
  location: string;
  requiresFaceRecognition: boolean;
  allowOnlineMode: boolean;
  cutoffTime: number;
  studentsPresent: number;
  totalStudents: number;
  timeRemaining: number;
};

export default function StudentAttendance() {
  const { toast } = useToast();

  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [faceRecognitionOpen, setFaceRecognitionOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // attendanceHistory is now handled inside `AttendanceHistory` via API

  useEffect(() => {
    // Coordinates/location removed — no-op
  }, []);

  // Camera helpers
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      toast({ title: "Camera Error", description: "Unable to access camera. Please check permissions.", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); setStream(null); }
    setCameraActive(false);
  };

  const handleFaceRecognition = async () => {
    if (!selectedSession) return;
    setIsProcessing(true);
    try {
      // Simulate processing delay — replace with real face-recognition flow
      await new Promise((r) => setTimeout(r, 2000));
      toast({ title: "✓ Attendance Recorded", description: `Present for ${selectedSession.className}` });
    } catch (err: any) {
      toast({ title: "Failed", description: String(err), variant: "destructive" });
    } finally {
      setIsProcessing(false);
      stopCamera();
      setFaceRecognitionOpen(false);
      setSelectedSession(null);
    }
  };

  const handleOnlineAttendance = async () => {
    // kept for parity but UI no longer exposes online check-in
    if (!selectedSession) return;
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsProcessing(false);
    toast({ title: "✓ Online Attendance Recorded", description: `Present for ${selectedSession.className}` });
    setSelectedSession(null);
  };

  const handleStartAttendance = (session: AttendanceSession, mode?: "face" | "online") => {
    setSelectedSession(session);
    if (mode === "face") { setFaceRecognitionOpen(true); startCamera(); }
    else handleOnlineAttendance();
  };

  // Coordinates/location helpers removed

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 0) return "Session ended";
    if (minutes === 0) return "Starting now";
    const hours = Math.floor(minutes / 60); const mins = minutes % 60;
    return hours === 0 ? `${mins}m` : `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Record attendance and view your attendance history</p>
      </div>

      {/* Location/camera permission messaging removed — coordinates are no longer used */}

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Sessions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <ActiveSessions
            handleStartAttendance={handleStartAttendance}
            formatTimeRemaining={formatTimeRemaining}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <AttendanceHistory />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Summary statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">Overview</div>
                    <div className="text-2xl font-bold">92.5%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">This Week</div>
                    <div className="text-2xl font-bold">95%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">This Month</div>
                    <div className="text-2xl font-bold">90.2%</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

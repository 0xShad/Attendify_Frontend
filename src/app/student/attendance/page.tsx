"use client";
import React, { useState, useEffect } from "react";
import { Camera, MapPin, Clock, AlertTriangle, Loader2, Scan } from "lucide-react";
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
  coordinates?: { lat: number; lng: number } | null;
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
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Small attendance history sample — can be replaced with real API later
  const [attendanceHistory] = useState(() => [
    { id: 1, classId: "CS101", className: "Introduction to Computer Science", date: "2025-10-16", status: "Present", sessionType: "In-Person", timestamp: "09:05 AM", method: "Face Recognition" },
    { id: 2, classId: "MATH201", className: "Calculus II", date: "2025-10-15", status: "Present", sessionType: "In-Person", timestamp: "14:02 PM", method: "Face Recognition" },
    { id: 3, classId: "ENG102", className: "English Composition", date: "2025-10-14", status: "Present", sessionType: "Online", timestamp: "11:00 AM", method: "Online Check-in" },
  ] as any[]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => setLocationError("Location access denied. Some features may be limited.")
      );
    }
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

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; const toRad = (d: number) => (d * Math.PI) / 180;
    const φ1 = toRad(lat1), φ2 = toRad(lat2), Δφ = toRad(lat2 - lat1), Δλ = toRad(lng2 - lng1);
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const isWithinLocationRange = (session: AttendanceSession) => {
    if (!currentLocation || !session.coordinates) return true;
    const d = calculateDistance(currentLocation.lat, currentLocation.lng, session.coordinates.lat, session.coordinates.lng);
    return d <= 100;
  };

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

      {locationError && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <p className="text-yellow-700 text-sm">{locationError}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Sessions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <ActiveSessions
            currentLocation={currentLocation}
            isWithinLocationRange={isWithinLocationRange}
            handleStartAttendance={handleStartAttendance}
            formatTimeRemaining={formatTimeRemaining}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <AttendanceHistory attendanceHistory={attendanceHistory} />
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

      <Drawer open={faceRecognitionOpen} onOpenChange={(open: boolean) => { setFaceRecognitionOpen(open); if (!open) { stopCamera(); setSelectedSession(null); } }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Face Recognition Attendance</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4">
            <div className="text-center">
              <div className="relative mx-auto w-64 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                {isProcessing ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                    <p className="text-sm text-muted-foreground">Processing face recognition...</p>
                  </div>
                ) : cameraActive ? (
                  <div className="space-y-2">
                    <div className="w-32 h-32 border-2 border-blue-500 rounded-lg flex items-center justify-center animate-pulse">
                      <Camera className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Position your face in the frame</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-sm text-muted-foreground">Starting camera...</p>
                  </div>
                )}
              </div>
              {selectedSession && (
                <div className="text-sm mt-3">
                  <div className="font-medium">{selectedSession.className}</div>
                  <div className="text-muted-foreground">{selectedSession.date} • {selectedSession.startTime}</div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFaceRecognition} disabled={isProcessing || !cameraActive} className="flex-1">
                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scan className="w-4 h-4 mr-2" />} Record Attendance
              </Button>
              <Button variant="outline" onClick={() => setFaceRecognitionOpen(false)} disabled={isProcessing}>Cancel</Button>
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

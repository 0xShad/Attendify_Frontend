"use client";

import React, { useState, useEffect } from "react";
import {
  Camera,
  MapPin,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Scan,
  Video,
  Mic,
  MicOff,
  VideoOff,
  RefreshCw,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts";

export default function StudentAttendance() {
  const { toast } = useToast();

  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [faceRecognitionOpen, setFaceRecognitionOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<"face" | "online">(
    "face"
  );
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Mock data
  const activeSessions = [
    {
      id: "SESSION001",
      classId: "CS101",
      className: "Introduction to Computer Science",
      instructor: "Dr. Sarah Johnson",
      date: "2025-10-17",
      startTime: "09:00",
      endTime: "10:30",
      isActive: true,
      mode: "Online" as const,
      location: "Room 202",
      coordinates: { lat: 40.7128, lng: -74.006 },
      requiresFaceRecognition: true,
      allowOnlineMode: true,
      cutoffTime: 10,
      studentsPresent: 42,
      totalStudents: 45,
      timeRemaining: 45, // minutes
    },
    {
      id: "SESSION002",
      classId: "MATH201",
      className: "Calculus II",
      instructor: "Prof. Michael Chen",
      date: "2025-10-17",
      startTime: "14:00",
      endTime: "15:30",
      isActive: false,
      mode: "In-Person" as const,
      location: "Math Building 104",
      coordinates: { lat: 40.712, lng: -74.005 },
      requiresFaceRecognition: true,
      allowOnlineMode: false,
      cutoffTime: 15,
      studentsPresent: 0,
      totalStudents: 28,
      timeRemaining: 240, // minutes until start
    },
  ];

  const attendanceHistory = [
    {
      id: 1,
      classId: "CS101",
      className: "Introduction to Computer Science",
      date: "2025-10-16",
      status: "Present" as const,
      sessionType: "In-Person" as const,
      timestamp: "09:05 AM",
      method: "Face Recognition",
    },
    {
      id: 2,
      classId: "MATH201",
      className: "Calculus II",
      date: "2025-10-15",
      status: "Present" as const,
      sessionType: "In-Person" as const,
      timestamp: "14:02 PM",
      method: "Face Recognition",
    },
    {
      id: 3,
      classId: "ENG102",
      className: "English Composition",
      date: "2025-10-14",
      status: "Present" as const,
      sessionType: "Online" as const,
      timestamp: "11:00 AM",
      method: "Online Check-in",
    },
    {
      id: 4,
      classId: "CS101",
      className: "Introduction to Computer Science",
      date: "2025-10-14",
      status: "Late" as const,
      sessionType: "In-Person" as const,
      timestamp: "09:15 AM",
      method: "Face Recognition",
    },
    {
      id: 5,
      classId: "MATH201",
      className: "Calculus II",
      date: "2025-10-10",
      status: "Absent" as const,
      sessionType: "In-Person" as const,
      timestamp: null,
      method: null,
    },
  ];

  // Attendance statistics
  const attendanceStats = {
    overall: 92.5,
    thisWeek: 95.0,
    thisMonth: 90.2,
    trend: "up" as const,
  };

  // Weekly attendance chart data
  const weeklyData = [
    { day: "Mon", attendance: 100 },
    { day: "Tue", attendance: 100 },
    { day: "Wed", attendance: 0 }, // Absent
    { day: "Thu", attendance: 100 },
    { day: "Fri", attendance: 100 },
  ];

  const chartConfig = {
    attendance: {
      label: "Attendance",
      color: "hsl(217, 91%, 60%)",
    },
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError(
            "Location access denied. Some features may be limited."
          );
        }
      );
    }
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const isWithinLocationRange = (session: any) => {
    if (!currentLocation || !session.coordinates) return true;
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      session.coordinates.lat,
      session.coordinates.lng
    );
    return distance <= 100; // 100 meters range
  };

  const handleStartAttendance = (session: any, mode: "face" | "online") => {
    setSelectedSession(session);
    setAttendanceMode(mode);

    if (mode === "face") {
      setFaceRecognitionOpen(true);
      startCamera();
    } else {
      handleOnlineAttendance();
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      setStream(mediaStream);
      setCameraActive(true);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const handleFaceRecognition = async () => {
    if (!selectedSession) return;

    setIsProcessing(true);

    // Simulate face recognition processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsProcessing(false);
    stopCamera();
    setFaceRecognitionOpen(false);

    // Simulate different outcomes
    const outcomes = ["success", "invalid", "duplicate", "location_error"];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    switch (outcome) {
      case "success":
        toast({
          title: "✓ Attendance Recorded Successfully",
          description: `Present for ${
            selectedSession.className
          } at ${new Date().toLocaleTimeString()}`,
        });
        break;
      case "invalid":
        toast({
          title: "✗ Face Recognition Failed",
          description:
            "Face not recognized. Please try again or contact support.",
          variant: "destructive",
        });
        break;
      case "duplicate":
        toast({
          title: "⚠ Already Recorded",
          description: "Your attendance for this session was already recorded.",
        });
        break;
      case "location_error":
        toast({
          title: "📍 Location Required",
          description:
            "You must be within the classroom area to mark attendance.",
          variant: "destructive",
        });
        break;
    }

    setSelectedSession(null);
  };

  const handleOnlineAttendance = async () => {
    if (!selectedSession) return;

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);

    toast({
      title: "✓ Online Attendance Recorded",
      description: `Present for ${selectedSession.className}`,
    });

    setSelectedSession(null);
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 0) return "Session ended";
    if (minutes === 0) return "Starting now";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "text-green-600 bg-green-50 border-green-200";
      case "Late":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Absent":
        return "text-red-600 bg-red-50 border-red-200";
      case "Excused":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">
          Record attendance and view your attendance history
        </p>
      </div>

      {/* Location Alert */}
      {locationError && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <p className="text-yellow-700 text-sm">
              {locationError}
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Sessions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Active Sessions */}
        <TabsContent value="active" className="space-y-4">
          {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Sessions</h3>
                <p className="text-muted-foreground text-center">
                  There are no attendance sessions currently active. Sessions
                  will appear here when they start.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => {
                const isNearby = isWithinLocationRange(session);
                const canMarkAttendance =
                  session.isActive &&
                  session.timeRemaining > -session.cutoffTime;

                return (
                  <Card
                    key={session.id}
                    className={`${
                      session.isActive
                        ? "border-green-200 bg-green-50/30"
                        : "border-gray-200"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {session.className}
                            {session.isActive && (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                                Live
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {session.instructor} • {session.date}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {formatTimeRemaining(session.timeRemaining)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Session Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {session.startTime} - {session.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{session.location}</span>
                        </div>
                      </div>

                      {/* Attendance Progress */}
                      {session.isActive && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Class Attendance</span>
                            <span>
                              {session.studentsPresent}/{session.totalStudents}{" "}
                              present
                            </span>
                          </div>
                          <Progress
                            value={
                              (session.studentsPresent /
                                session.totalStudents) *
                              100
                            }
                            className="h-2"
                          />
                        </div>
                      )}

                      {/* Location Check */}
                      {session.requiresFaceRecognition && currentLocation && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin
                            className={`w-4 h-4 ${
                              isNearby ? "text-green-500" : "text-red-500"
                            }`}
                          />
                          <span
                            className={
                              isNearby ? "text-green-700" : "text-red-700"
                            }
                          >
                            {isNearby
                              ? "Within classroom range"
                              : "Too far from classroom"}
                          </span>
                        </div>
                      )}

                      {/* Cutoff Warning */}
                      {session.isActive &&
                        session.timeRemaining <= session.cutoffTime &&
                        session.timeRemaining > 0 && (
                          <Card className="border-yellow-200 bg-yellow-50">
                            <CardContent className="flex items-center gap-2 p-3">
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              <p className="text-yellow-700 text-sm">
                                Attendance closes in {session.timeRemaining}{" "}
                                minutes!
                              </p>
                            </CardContent>
                          </Card>
                        )}

                      {/* Action Buttons */}
                      {canMarkAttendance ? (
                        <div className="flex gap-2">
                          {session.requiresFaceRecognition && (
                            <Button
                              onClick={() =>
                                handleStartAttendance(session, "face")
                              }
                              disabled={!isNearby && session.mode !== "Online"}
                              className="flex-1"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Face Recognition
                            </Button>
                          )}
                          {session.allowOnlineMode && (
                            <Button
                              onClick={() =>
                                handleStartAttendance(session, "online")
                              }
                              variant={
                                session.requiresFaceRecognition
                                  ? "outline"
                                  : "default"
                              }
                              className="flex-1"
                            >
                              <Wifi className="w-4 h-4 mr-2" />
                              Online Check-in
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          {session.timeRemaining <= -session.cutoffTime ? (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200"
                            >
                              Attendance Closed
                            </Badge>
                          ) : !session.isActive ? (
                            <Badge
                              variant="outline"
                              className="bg-gray-50 text-gray-700 border-gray-200"
                            >
                              Session Not Started
                            </Badge>
                          ) : null}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Attendance History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>
                Your attendance record for the past sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceHistory.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          record.status === "Present"
                            ? "bg-green-500"
                            : record.status === "Late"
                            ? "bg-yellow-500"
                            : record.status === "Absent"
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {record.className}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.date} • {record.sessionType}
                          {record.timestamp && ` • ${record.timestamp}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={getStatusColor(record.status)}
                      >
                        {record.status}
                      </Badge>
                      {record.method && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {record.method}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics */}
        <TabsContent value="stats" className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall</p>
                    <p className="text-2xl font-bold">
                      {attendanceStats.overall}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">
                      {attendanceStats.thisWeek}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">
                      {attendanceStats.thisMonth}%
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance</CardTitle>
              <CardDescription>
                Your attendance pattern for this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-48 w-full">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                >
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="attendance"
                    fill="var(--color-attendance)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Face Recognition Drawer */}
      <Drawer
        open={faceRecognitionOpen}
        onOpenChange={(open: boolean) => {
          setFaceRecognitionOpen(open);
          if (!open) {
            stopCamera();
            setSelectedSession(null);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Face Recognition Attendance</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4">
          <div className="space-y-4">
            <div className="text-center space-y-4">
              {/* Camera Preview */}
              <div className="relative mx-auto w-64 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                {isProcessing ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                    <p className="text-sm text-muted-foreground">
                      Processing face recognition...
                    </p>
                  </div>
                ) : cameraActive ? (
                  <div className="space-y-2">
                    <div className="w-32 h-32 border-2 border-blue-500 rounded-lg flex items-center justify-center animate-pulse">
                      <Camera className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Position your face in the frame
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-sm text-muted-foreground">
                      Starting camera...
                    </p>
                  </div>
                )}
              </div>

              {selectedSession && (
                <div className="text-sm space-y-1">
                  <p className="font-medium">{selectedSession.className}</p>
                  <p className="text-muted-foreground">
                    {selectedSession.date} • {selectedSession.startTime}
                  </p>
                  {selectedSession.location && (
                    <p className="text-muted-foreground flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedSession.location}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleFaceRecognition}
                disabled={isProcessing || !cameraActive}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 mr-2" />
                    Record Attendance
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setFaceRecognitionOpen(false)}
                disabled={isProcessing}
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

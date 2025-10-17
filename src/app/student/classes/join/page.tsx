"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconSearch,
  IconLoader2,
  IconCheck,
  IconX,
  IconMapPin,
  IconClock,
  IconUsers,
  IconBook,
  IconCalendar,
  IconWifi,
  IconVideo,
  IconSchool,
  IconArrowLeft,
} from "@tabler/icons-react";
import {
  Users,
  Clock,
  MapPin,
  Video,
  Wifi,
  BookOpen,
  Calendar,
  School,
  Star,
  CheckCircle,
  XCircle,
  ArrowLeft,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";

export default function JoinClass() {
  const { toast } = useToast();
  const router = useRouter();

  const [classCode, setClassCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [joinReason, setJoinReason] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [joinDrawerOpen, setJoinDrawerOpen] = useState(false);

  // Mock available classes
  const availableClasses = [
    {
      id: "PHY101",
      name: "Physics I: Mechanics",
      code: "PHY101",
      instructor: "Dr. James Wilson",
      instructorAvatar: "/avatars/physics-prof.jpg",
      schedule: "Mon, Wed, Fri 10:00 AM",
      mode: "Hybrid",
      location: "Physics Lab 201 / Online",
      enrolledCount: 45,
      maxCapacity: 60,
      credits: 4,
      semester: "Fall 2024",
      department: "Physics",
      description:
        "Introduction to classical mechanics including kinematics, dynamics, energy, and momentum. Laboratory work included.",
      prerequisites: ["MATH 101", "High School Physics"],
      rating: 4.2,
      difficulty: "Moderate",
      workload: "15-20 hours/week",
      status: "Open" as const,
    },
    {
      id: "CHEM102",
      name: "General Chemistry Lab",
      code: "CHEM102",
      instructor: "Prof. Lisa Chen",
      instructorAvatar: "/avatars/chem-prof.jpg",
      schedule: "Tue, Thu 2:00 PM",
      mode: "In-Person",
      location: "Chemistry Lab A",
      enrolledCount: 20,
      maxCapacity: 24,
      credits: 1,
      semester: "Fall 2024",
      department: "Chemistry",
      description:
        "Hands-on laboratory experience to complement General Chemistry lecture course.",
      prerequisites: ["CHEM 101 (concurrent)"],
      rating: 4.5,
      difficulty: "Easy",
      workload: "8-10 hours/week",
      status: "Open" as const,
    },
    {
      id: "HIST205",
      name: "World History: Modern Era",
      code: "HIST205",
      instructor: "Dr. Amanda Rodriguez",
      instructorAvatar: "/avatars/history-prof.jpg",
      schedule: "Mon, Wed 1:00 PM",
      mode: "Online",
      location: "Online Only",
      enrolledCount: 180,
      maxCapacity: 200,
      credits: 3,
      semester: "Fall 2024",
      department: "History",
      description:
        "Survey of world history from 1500 to the present, focusing on major political, social, and cultural developments.",
      prerequisites: [],
      rating: 4.0,
      difficulty: "Moderate",
      workload: "12-15 hours/week",
      status: "Open" as const,
    },
    {
      id: "CS301",
      name: "Advanced Data Structures",
      code: "CS301",
      instructor: "Prof. David Kim",
      instructorAvatar: "/avatars/cs-prof.jpg",
      schedule: "Tue, Thu 4:00 PM",
      mode: "In-Person",
      location: "Computer Lab 305",
      enrolledCount: 35,
      maxCapacity: 35,
      credits: 3,
      semester: "Fall 2024",
      department: "Computer Science",
      description:
        "Advanced study of data structures including trees, graphs, and hash tables. Implementation and analysis.",
      prerequisites: ["CS 201", "CS 202"],
      rating: 4.3,
      difficulty: "Hard",
      workload: "20-25 hours/week",
      status: "Waitlist" as const,
    },
  ];

  // Filter classes based on search
  const filteredClasses = availableClasses.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinByCode = async () => {
    if (!classCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid class code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsJoining(false);

    // Simulate different outcomes
    const outcomes = ["success", "not-found", "full", "pending"];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    switch (outcome) {
      case "success":
        toast({
          title: "Successfully Joined! ✓",
          description: `You've been enrolled in ${classCode}`,
        });
        router.push("/student/classes");
        break;
      case "not-found":
        toast({
          title: "Class Not Found",
          description:
            "The class code you entered doesn't exist or is inactive",
          variant: "destructive",
        });
        break;
      case "full":
        toast({
          title: "Class Full",
          description:
            "This class has reached its maximum capacity. You've been added to the waitlist.",
        });
        break;
      case "pending":
        toast({
          title: "Request Sent",
          description:
            "Your join request has been sent to the instructor for approval",
        });
        break;
    }
  };

  const handleJoinRequest = async (classItem: any) => {
    setSelectedClass(classItem);
    if (classItem.status === "Waitlist") {
      // Direct join to waitlist
      setIsJoining(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsJoining(false);

      toast({
        title: "Added to Waitlist",
        description: `You've been added to the waitlist for ${classItem.name}`,
      });
    } else {
      // Show join drawer for open classes
      setJoinDrawerOpen(true);
    }
  };

  const confirmJoinRequest = async () => {
    if (!selectedClass) return;

    setIsJoining(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsJoining(false);
    setJoinDrawerOpen(false);

    toast({
      title: "Request Sent ✓",
      description: `Your request to join ${selectedClass.name} has been sent to ${selectedClass.instructor}`,
    });

    setSelectedClass(null);
    setJoinReason("");
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "Online":
        return <Wifi className="w-4 h-4" />;
      case "In-Person":
        return <MapPin className="w-4 h-4" />;
      case "Hybrid":
        return <Video className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "Online":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "In-Person":
        return "bg-green-100 text-green-700 border-green-200";
      case "Hybrid":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-700 border-green-200";
      case "Waitlist":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Closed":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-600";
      case "Moderate":
        return "text-yellow-600";
      case "Hard":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Join a Class</h1>
          <p className="text-muted-foreground">
            Enter a class code or browse available classes
          </p>
        </div>
      </div>

      <Tabs defaultValue="code" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="code">Class Code</TabsTrigger>
          <TabsTrigger value="browse">Browse Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Join with Class Code</CardTitle>
              <CardDescription>
                Enter the class code provided by your instructor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="class-code">Class Code</Label>
                <Input
                  id="class-code"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="e.g., CS101-001-FALL24"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Class codes are usually provided by your instructor via email
                  or course materials
                </p>
              </div>

              <Button
                onClick={handleJoinByCode}
                disabled={isJoining || !classCode.trim()}
                className="w-full"
              >
                {isJoining ? (
                  <>
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <IconPlus className="w-4 h-4 mr-2" />
                    Join Class
                  </>
                )}
              </Button>

              {/* Recent Codes (if any) */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">
                  Recently Used Codes
                </h4>
                <div className="text-sm text-muted-foreground">
                  No recent codes available
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by class name, code, instructor, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Classes Grid */}
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No classes found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or contact your academic advisor
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredClasses.map((classItem) => (
                <Card
                  key={classItem.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2">
                          {classItem.name}
                        </CardTitle>
                        <CardDescription>
                          {classItem.code} • {classItem.department} •{" "}
                          {classItem.credits} credits
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Badge
                          variant="outline"
                          className={getStatusColor(classItem.status)}
                        >
                          {classItem.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-medium">
                            {classItem.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Instructor */}
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={classItem.instructorAvatar} />
                        <AvatarFallback>
                          {classItem.instructor
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {classItem.instructor}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Instructor
                        </p>
                      </div>
                    </div>

                    {/* Class Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{classItem.schedule}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {getModeIcon(classItem.mode)}
                        <span className="truncate flex-1">
                          {classItem.location}
                        </span>
                        <Badge
                          variant="outline"
                          className={getModeColor(classItem.mode)}
                        >
                          {classItem.mode}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {classItem.enrolledCount}/{classItem.maxCapacity}{" "}
                          students
                        </span>
                      </div>
                    </div>

                    {/* Prerequisites */}
                    {classItem.prerequisites.length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">
                          Prerequisites:{" "}
                        </span>
                        <span>{classItem.prerequisites.join(", ")}</span>
                      </div>
                    )}

                    {/* Class Stats */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">
                          Difficulty:{" "}
                        </span>
                        <span
                          className={`font-medium ${getDifficultyColor(
                            classItem.difficulty
                          )}`}
                        >
                          {classItem.difficulty}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Workload:{" "}
                        </span>
                        <span className="font-medium">
                          {classItem.workload}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {classItem.description}
                    </p>

                    {/* Enrollment Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Enrollment</span>
                        <span>
                          {Math.round(
                            (classItem.enrolledCount / classItem.maxCapacity) *
                              100
                          )}
                          % full
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${
                              (classItem.enrolledCount /
                                classItem.maxCapacity) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleJoinRequest(classItem)}
                      disabled={isJoining}
                      variant={
                        classItem.status === "Open" ? "default" : "outline"
                      }
                      className="w-full"
                    >
                      {isJoining ? (
                        <>
                          <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : classItem.status === "Waitlist" ? (
                        <>
                          <IconClock className="w-4 h-4 mr-2" />
                          Join Waitlist
                        </>
                      ) : (
                        <>
                          <IconPlus className="w-4 h-4 mr-2" />
                          Request to Join
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Join Request Drawer */}
      <Drawer open={joinDrawerOpen} onOpenChange={setJoinDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Request to Join Class</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4">
          {selectedClass && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedClass.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedClass.code} • {selectedClass.instructor}
                </p>
              </div>

              <div>
                <Label htmlFor="join-reason">
                  Reason for Joining (Optional)
                </Label>
                <Textarea
                  id="join-reason"
                  value={joinReason}
                  onChange={(e) => setJoinReason(e.target.value)}
                  placeholder="Briefly explain why you want to join this class..."
                  rows={3}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This helps the instructor understand your interest in the
                  course
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={confirmJoinRequest}
                  disabled={isJoining}
                  className="flex-1"
                >
                  {isJoining ? (
                    <>
                      <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <IconCheck className="w-4 h-4 mr-2" />
                      Send Request
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setJoinDrawerOpen(false)}
                  disabled={isJoining}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
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

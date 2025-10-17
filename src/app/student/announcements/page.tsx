"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  BookOpen,
  User,
  Pin,
  PinOff,
  Archive,
  Trash2,
  MoreVertical,
  Star,
  StarOff,
  Check,
  X,
  Megaphone,
  Calendar,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";

export default function StudentAnnouncements() {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [announcementDetailsOpen, setAnnouncementDetailsOpen] = useState(false);

  // Mock data
  const [announcements, setAnnouncements] = useState([
    {
      id: "ANN001",
      title: "Midterm Exam Schedule Released",
      content:
        "The midterm examination schedule has been posted on the course portal. Please check your individual class pages for specific exam dates, times, and locations. Make sure to review the exam format and allowed materials for each course.",
      fullContent:
        "Dear Students,\n\nThe midterm examination schedule for the Fall 2024 semester has been released. Please visit your individual class pages on the course portal to view the specific details for each of your enrolled courses.\n\nImportant Information:\n• Exam dates: October 21-25, 2024\n• All exams will be held during regular class times unless otherwise noted\n• Bring a valid student ID to all examinations\n• Review the exam format and allowed materials for each course\n• Contact your instructor immediately if you have scheduling conflicts\n\nStudy Tips:\n• Form study groups with your classmates\n• Utilize office hours for clarification on course material\n• Visit the Academic Success Center for tutoring support\n\nGood luck with your preparations!\n\nBest regards,\nAcademic Affairs Office",
      classId: "CS101",
      className: "Introduction to Computer Science",
      instructor: "Dr. Sarah Johnson",
      instructorAvatar: "/avatars/instructor1.jpg",
      date: "2025-10-15",
      time: "2:30 PM",
      priority: "High" as const,
      isRead: false,
      isPinned: true,
      isStarred: false,
      category: "Exam",
      attachments: ["midterm-schedule.pdf", "exam-guidelines.pdf"],
    },
    {
      id: "ANN002",
      title: "Assignment 3 Due Friday",
      content:
        "Don't forget that Assignment 3 is due this Friday at 11:59 PM. Please submit through the course portal. Late submissions will be penalized according to the syllabus policy.",
      fullContent:
        "Reminder: Assignment 3 Due Date\n\nThis is a friendly reminder that Programming Assignment 3: Data Structures Implementation is due this Friday, October 18, 2024, at 11:59 PM.\n\nSubmission Requirements:\n• Submit all source code files (.java, .py, etc.)\n• Include a README file with compilation and execution instructions\n• Provide test cases and expected outputs\n• Submit through the course portal only\n\nGrading Criteria:\n• Code functionality (60%)\n• Code quality and style (25%)\n• Documentation and comments (15%)\n\nLate Policy:\n• 10% deduction for each day late\n• No submissions accepted after 3 days\n\nIf you're experiencing difficulties, please reach out during office hours or schedule an appointment.\n\nGood luck!\nDr. Sarah Johnson",
      classId: "CS101",
      className: "Introduction to Computer Science",
      instructor: "Dr. Sarah Johnson",
      instructorAvatar: "/avatars/instructor1.jpg",
      date: "2025-10-14",
      time: "10:15 AM",
      priority: "Medium" as const,
      isRead: false,
      isPinned: false,
      isStarred: true,
      category: "Assignment",
      attachments: ["assignment3-spec.pdf"],
    },
    {
      id: "ANN003",
      title: "Class Cancelled - October 16",
      content:
        "Due to a faculty conference, our Wednesday class (October 16) is cancelled. We will cover the missed material in our next session on Friday. Please review Chapter 5 in preparation.",
      fullContent:
        "Class Cancellation Notice\n\nDear Students,\n\nI will be attending the National Mathematics Conference this week, and as a result, our Wednesday class on October 16, 2025, is cancelled.\n\nWhat to do:\n• Review Chapter 5: Integration Techniques in your textbook\n• Complete the practice problems on pages 234-238\n• Watch the supplementary video lectures posted on the course portal\n\nMake-up Plan:\n• We will cover the missed material during our Friday session\n• The class will run an additional 15 minutes to accommodate the extra content\n• Homework deadline extended by one day\n\nOffice Hours:\n• Regular office hours on Thursday remain unchanged\n• Available via email for urgent questions\n\nThank you for your understanding.\n\nProf. Michael Chen\nMathematics Department",
      classId: "MATH201",
      className: "Calculus II",
      instructor: "Prof. Michael Chen",
      instructorAvatar: "/avatars/instructor2.jpg",
      date: "2025-10-14",
      time: "8:45 AM",
      priority: "High" as const,
      isRead: true,
      isPinned: false,
      isStarred: false,
      category: "Schedule",
      attachments: [],
    },
    {
      id: "ANN004",
      title: "Office Hours Change",
      content:
        "Starting next week, my office hours will change from Tuesday 2-4 PM to Wednesday 3-5 PM. This change is permanent for the remainder of the semester.",
      fullContent:
        "Office Hours Schedule Change\n\nDear Students,\n\nEffective Monday, October 21, 2024, my office hours will be changing to better accommodate student needs and departmental scheduling.\n\nNew Schedule:\n• Day: Wednesday\n• Time: 3:00 PM - 5:00 PM\n• Location: Faculty Office 215B (unchanged)\n\nPrevious Schedule (discontinued):\n• Day: Tuesday\n• Time: 2:00 PM - 4:00 PM\n\nThis change is permanent for the remainder of the Fall 2024 semester.\n\nAdditional Support:\n• Email responses within 24 hours during weekdays\n• Virtual office hours available by appointment\n• Teaching assistant office hours: Fridays 1-3 PM in Lab 104\n\nPlease update your calendars accordingly. I apologize for any inconvenience this may cause.\n\nBest regards,\nDr. Emily Rodriguez\nEnglish Department",
      classId: "ENG102",
      className: "English Composition",
      instructor: "Dr. Emily Rodriguez",
      instructorAvatar: "/avatars/instructor3.jpg",
      date: "2025-10-13",
      time: "4:20 PM",
      priority: "Low" as const,
      isRead: true,
      isPinned: false,
      isStarred: false,
      category: "Schedule",
      attachments: [],
    },
    {
      id: "ANN005",
      title: "Guest Lecture: Industry Perspectives on AI",
      content:
        "We're excited to host Ms. Jennifer Park, Senior AI Engineer at TechCorp, for a guest lecture next Tuesday. She'll share insights on real-world AI applications and career opportunities.",
      fullContent:
        "Special Guest Lecture Announcement\n\nWe are thrilled to announce a special guest lecture by Ms. Jennifer Park, Senior AI Engineer at TechCorp, one of the leading technology companies in artificial intelligence and machine learning.\n\nEvent Details:\n• Date: Tuesday, October 22, 2024\n• Time: During regular class time (9:00 AM - 10:30 AM)\n• Location: Lecture Hall A (Room 150)\n• Topic: 'From Classroom to Boardroom: AI in Industry'\n\nWhat to Expect:\n• Real-world applications of AI and machine learning\n• Career pathways in technology\n• Current industry trends and challenges\n• Q&A session with networking opportunity\n\nPreparation:\n• Review your AI/ML coursework\n• Prepare thoughtful questions about industry practices\n• Bring business cards if you have them\n• Professional attire recommended\n\nThis is an excellent opportunity to:\n• Gain industry insights\n• Network with a professional\n• Understand practical applications of your studies\n• Explore potential career paths\n\nAttendance is highly encouraged and will count toward your participation grade.\n\nLooking forward to seeing you there!\nDr. Sarah Johnson",
      classId: "CS101",
      className: "Introduction to Computer Science",
      instructor: "Dr. Sarah Johnson",
      instructorAvatar: "/avatars/instructor1.jpg",
      date: "2025-10-12",
      time: "11:30 AM",
      priority: "Medium" as const,
      isRead: true,
      isPinned: false,
      isStarred: false,
      category: "Event",
      attachments: ["guest-speaker-bio.pdf"],
    },
    {
      id: "ANN006",
      title: "Library Research Workshop - Optional",
      content:
        "The library is hosting a research methodology workshop this Thursday at 3 PM. Learn advanced search techniques and citation management. RSVP required.",
      fullContent:
        "Library Research Workshop Invitation\n\nThe University Library, in partnership with the Academic Success Center, is hosting a comprehensive research methodology workshop designed to enhance your academic research skills.\n\nWorkshop Details:\n• Date: Thursday, October 17, 2024\n• Time: 3:00 PM - 4:30 PM\n• Location: Library Conference Room B\n• Presenter: Dr. Maria Santos, Research Librarian\n• Cost: Free for all students\n\nTopics Covered:\n• Advanced database search techniques\n• Effective keyword strategies\n• Citation management tools (Zotero, Mendeley)\n• Evaluating source credibility\n• Avoiding plagiarism\n• Research paper organization\n\nWho Should Attend:\n• Students working on research papers\n• Anyone interested in improving research skills\n• Students preparing for graduate studies\n• Those struggling with source evaluation\n\nWhat to Bring:\n• Laptop or tablet (recommended)\n• Notebook for taking notes\n• Any current research projects you're working on\n\nRegistration:\n• RSVP required due to limited seating (25 participants)\n• Register online at library.university.edu/workshops\n• Registration deadline: Tuesday, October 15\n\nBonus:\n• All participants receive a research toolkit\n• One-on-one consultation sessions available\n• Workshop certificate upon completion\n\nThis workshop is highly recommended for students at all academic levels.\n\nQuestions? Contact the library at research@university.edu\n\nLibrary Staff",
      classId: null,
      className: null,
      instructor: "Library Staff",
      instructorAvatar: "/avatars/library.jpg",
      date: "2025-10-11",
      time: "9:00 AM",
      priority: "Low" as const,
      isRead: true,
      isPinned: false,
      isStarred: false,
      category: "Workshop",
      attachments: ["workshop-agenda.pdf"],
    },
  ]);

  const enrolledClasses = [
    { id: "CS101", name: "Introduction to Computer Science", code: "CS101" },
    { id: "MATH201", name: "Calculus II", code: "MATH201" },
    { id: "ENG102", name: "English Composition", code: "ENG102" },
  ];

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.instructor.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      classFilter === "all" ||
      (classFilter === "general" && !announcement.classId) ||
      announcement.classId === classFilter;

    const matchesPriority =
      priorityFilter === "all" || announcement.priority === priorityFilter;

    return matchesSearch && matchesClass && matchesPriority;
  });

  // Separate pinned and unpinned announcements
  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.isPinned);
  const unpinnedAnnouncements = filteredAnnouncements.filter(
    (a) => !a.isPinned
  );

  const handleMarkAsRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((ann) => (ann.id === id ? { ...ann, isRead: true } : ann))
    );
    toast({
      title: "Marked as Read",
      description: "Announcement has been marked as read.",
    });
  };

  const handleMarkAsUnread = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((ann) => (ann.id === id ? { ...ann, isRead: false } : ann))
    );
    toast({
      title: "Marked as Unread",
      description: "Announcement has been marked as unread.",
    });
  };

  const handleTogglePin = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((ann) =>
        ann.id === id ? { ...ann, isPinned: !ann.isPinned } : ann
      )
    );
    const announcement = announcements.find((a) => a.id === id);
    toast({
      title: announcement?.isPinned ? "Unpinned" : "Pinned",
      description: `Announcement has been ${
        announcement?.isPinned ? "unpinned" : "pinned"
      }.`,
    });
  };

  const handleToggleStar = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((ann) =>
        ann.id === id ? { ...ann, isStarred: !ann.isStarred } : ann
      )
    );
    const announcement = announcements.find((a) => a.id === id);
    toast({
      title: announcement?.isStarred ? "Unstarred" : "Starred",
      description: `Announcement has been ${
        announcement?.isStarred ? "removed from" : "added to"
      } favorites.`,
    });
  };

  const handleViewDetails = (announcement: any) => {
    if (!announcement.isRead) {
      handleMarkAsRead(announcement.id);
    }
    setSelectedAnnouncement(announcement);
    setAnnouncementDetailsOpen(true);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High":
        return <AlertTriangle className="w-4 h-4" />;
      case "Medium":
        return <Info className="w-4 h-4" />;
      case "Low":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "border-red-200 text-red-700 bg-red-50";
      case "Medium":
        return "border-yellow-200 text-yellow-700 bg-yellow-50";
      case "Low":
        return "border-green-200 text-green-700 bg-green-50";
      default:
        return "border-gray-200 text-gray-700 bg-gray-50";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Exam":
        return "bg-red-100 text-red-700";
      case "Assignment":
        return "bg-blue-100 text-blue-700";
      case "Schedule":
        return "bg-purple-100 text-purple-700";
      case "Event":
        return "bg-green-100 text-green-700";
      case "Workshop":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatTimeAgo = (date: string, time: string) => {
    const now = new Date();
    const announcementDate = new Date(`${date} ${time}`);
    const diffInHours = Math.floor(
      (now.getTime() - announcementDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return announcementDate.toLocaleDateString();
  };

  const unreadCount = announcements.filter((a) => !a.isRead).length;
  const starredCount = announcements.filter((a) => a.isStarred).length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            Stay updated with class announcements and important information
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="bg-blue-50">
            {unreadCount} unread
          </Badge>
          {starredCount > 0 && (
            <Badge variant="outline" className="bg-yellow-50">
              {starredCount} starred
            </Badge>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="general">General</SelectItem>
              {enrolledClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({filteredAnnouncements.length})
          </TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="starred">Starred ({starredCount})</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Announcements</h3>
                <p className="text-muted-foreground text-center">
                  {searchQuery ||
                  classFilter !== "all" ||
                  priorityFilter !== "all"
                    ? "No announcements match your current filters."
                    : "You don't have any announcements yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Pinned Announcements */}
              {pinnedAnnouncements.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Pin className="w-4 h-4" />
                    <h3 className="font-medium text-sm text-muted-foreground">
                      PINNED
                    </h3>
                  </div>
                  {pinnedAnnouncements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onViewDetails={handleViewDetails}
                      onMarkRead={handleMarkAsRead}
                      onMarkUnread={handleMarkAsUnread}
                      onTogglePin={handleTogglePin}
                      onToggleStar={handleToggleStar}
                      getPriorityIcon={getPriorityIcon}
                      getPriorityColor={getPriorityColor}
                      getCategoryColor={getCategoryColor}
                      formatTimeAgo={formatTimeAgo}
                    />
                  ))}
                </div>
              )}

              {/* Regular Announcements */}
              {unpinnedAnnouncements.length > 0 && (
                <div className="space-y-4">
                  {pinnedAnnouncements.length > 0 && (
                    <div className="flex items-center gap-2 mt-6">
                      <Megaphone className="w-4 h-4" />
                      <h3 className="font-medium text-sm text-muted-foreground">
                        ANNOUNCEMENTS
                      </h3>
                    </div>
                  )}
                  {unpinnedAnnouncements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onViewDetails={handleViewDetails}
                      onMarkRead={handleMarkAsRead}
                      onMarkUnread={handleMarkAsUnread}
                      onTogglePin={handleTogglePin}
                      onToggleStar={handleToggleStar}
                      getPriorityIcon={getPriorityIcon}
                      getPriorityColor={getPriorityColor}
                      getCategoryColor={getCategoryColor}
                      formatTimeAgo={formatTimeAgo}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {announcements
            .filter((a) => !a.isRead && filteredAnnouncements.includes(a))
            .map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onViewDetails={handleViewDetails}
                onMarkRead={handleMarkAsRead}
                onMarkUnread={handleMarkAsUnread}
                onTogglePin={handleTogglePin}
                onToggleStar={handleToggleStar}
                getPriorityIcon={getPriorityIcon}
                getPriorityColor={getPriorityColor}
                getCategoryColor={getCategoryColor}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
        </TabsContent>

        <TabsContent value="starred" className="space-y-4">
          {announcements
            .filter((a) => a.isStarred && filteredAnnouncements.includes(a))
            .map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onViewDetails={handleViewDetails}
                onMarkRead={handleMarkAsRead}
                onMarkUnread={handleMarkAsUnread}
                onTogglePin={handleTogglePin}
                onToggleStar={handleToggleStar}
                getPriorityIcon={getPriorityIcon}
                getPriorityColor={getPriorityColor}
                getCategoryColor={getCategoryColor}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Archive className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No Archived Announcements
              </h3>
              <p className="text-muted-foreground text-center">
                Archived announcements will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Announcement Details Drawer */}
      <Drawer
        open={announcementDetailsOpen}
        onOpenChange={setAnnouncementDetailsOpen}
      >
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-start justify-between gap-4 pr-6">
              <span className="line-clamp-2">
                {selectedAnnouncement?.title}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Badge
                  variant="outline"
                  className={
                    selectedAnnouncement &&
                    getPriorityColor(selectedAnnouncement.priority)
                  }
                >
                  {selectedAnnouncement &&
                    getPriorityIcon(selectedAnnouncement.priority)}
                  <span className="ml-1">{selectedAnnouncement?.priority}</span>
                </Badge>
              </div>
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-6 overflow-y-auto">

          {selectedAnnouncement && (
            <div className="space-y-6">
              {/* Announcement Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedAnnouncement.instructorAvatar} />
                    <AvatarFallback>
                      {selectedAnnouncement.instructor
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedAnnouncement.instructor}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAnnouncement.className || "General Announcement"}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{selectedAnnouncement.date}</p>
                  <p>{selectedAnnouncement.time}</p>
                </div>
              </div>

              {/* Category and Class */}
              <div className="flex items-center gap-2">
                <Badge
                  className={getCategoryColor(selectedAnnouncement.category)}
                >
                  {selectedAnnouncement.category}
                </Badge>
                {selectedAnnouncement.className && (
                  <Badge variant="outline">
                    {selectedAnnouncement.className}
                  </Badge>
                )}
                {selectedAnnouncement.isPinned && (
                  <Badge variant="outline" className="bg-blue-50">
                    <Pin className="w-3 h-3 mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>

              {/* Full Content */}
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedAnnouncement.fullContent}
                </div>
              </div>

              {/* Attachments */}
              {selectedAnnouncement.attachments &&
                selectedAnnouncement.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Attachments</h4>
                    <div className="space-y-2">
                      {selectedAnnouncement.attachments.map(
                        (attachment: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 border rounded"
                          >
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{attachment}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-auto"
                            >
                              Download
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStar(selectedAnnouncement.id)}
                >
                  {selectedAnnouncement.isStarred ? (
                    <>
                      <StarOff className="w-3 h-3 mr-1" />
                      Unstar
                    </>
                  ) : (
                    <>
                      <Star className="w-3 h-3 mr-1" />
                      Star
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTogglePin(selectedAnnouncement.id)}
                >
                  {selectedAnnouncement.isPinned ? (
                    <>
                      <PinOff className="w-3 h-3 mr-1" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="w-3 h-3 mr-1" />
                      Pin
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (selectedAnnouncement.isRead) {
                      handleMarkAsUnread(selectedAnnouncement.id);
                    } else {
                      handleMarkAsRead(selectedAnnouncement.id);
                    }
                  }}
                >
                  {selectedAnnouncement.isRead ? (
                    <>
                      <X className="w-3 h-3 mr-1" />
                      Mark Unread
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Mark Read
                    </>
                  )}
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

// Announcement Card Component
function AnnouncementCard({
  announcement,
  onViewDetails,
  onMarkRead,
  onMarkUnread,
  onTogglePin,
  onToggleStar,
  getPriorityIcon,
  getPriorityColor,
  getCategoryColor,
  formatTimeAgo,
}: {
  announcement: any;
  onViewDetails: (announcement: any) => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleStar: (id: string) => void;
  getPriorityIcon: (priority: string) => React.ReactElement;
  getPriorityColor: (priority: string) => string;
  getCategoryColor: (category: string) => string;
  formatTimeAgo: (date: string, time: string) => string;
}) {
  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${
        !announcement.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""
      } ${announcement.isPinned ? "border-t-2 border-t-yellow-400" : ""}`}
      onClick={() => onViewDetails(announcement)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Instructor Avatar */}
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={announcement.instructorAvatar} />
            <AvatarFallback>
              {announcement.instructor
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-medium line-clamp-2 ${
                    !announcement.isRead ? "font-semibold" : ""
                  }`}
                >
                  {announcement.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {announcement.instructor}
                  </span>
                  {announcement.className && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {announcement.className}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {announcement.isPinned && (
                  <Pin className="w-3 h-3 text-yellow-600" />
                )}
                {announcement.isStarred && (
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(announcement);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (announcement.isRead) {
                          onMarkUnread(announcement.id);
                        } else {
                          onMarkRead(announcement.id);
                        }
                      }}
                    >
                      {announcement.isRead ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Mark as Unread
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Mark as Read
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(announcement.id);
                      }}
                    >
                      {announcement.isPinned ? (
                        <>
                          <PinOff className="w-4 h-4 mr-2" />
                          Unpin
                        </>
                      ) : (
                        <>
                          <Pin className="w-4 h-4 mr-2" />
                          Pin
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(announcement.id);
                      }}
                    >
                      {announcement.isStarred ? (
                        <>
                          <StarOff className="w-4 h-4 mr-2" />
                          Remove Star
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-2" />
                          Add Star
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Content Preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {announcement.content}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={getPriorityColor(announcement.priority)}
                >
                  {getPriorityIcon(announcement.priority)}
                  <span className="ml-1">{announcement.priority}</span>
                </Badge>
                <Badge className={getCategoryColor(announcement.category)}>
                  {announcement.category}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {formatTimeAgo(announcement.date, announcement.time)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

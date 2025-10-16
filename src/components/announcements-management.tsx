"use client";

import React, { useState } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconSend,
  IconCalendar,
  IconUsers,
  IconFilter,
  IconSearch,
  IconBell,
  IconSpeakerphone,
} from "@tabler/icons-react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Calendar,
  Users,
  Filter,
  Search,
  Bell,
  MessageSquare,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  content: string;
  classIds: string[];
  createdDate: string;
  priority: "Low" | "Medium" | "High";
  status: "Draft" | "Published" | "Scheduled";
  scheduledDate?: string;
  readBy?: string[];
  targetAudience: "All" | "Selected";
}

interface Class {
  id: string;
  name: string;
  code: string;
  enrolledStudents: number;
}

interface AnnouncementManagementProps {
  announcements: Announcement[];
  classes: Class[];
  onAddAnnouncement: (
    announcement: Omit<Announcement, "id" | "createdDate">
  ) => void;
  onUpdateAnnouncement: (
    id: string,
    announcement: Partial<Announcement>
  ) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export function AnnouncementManagement({
  announcements,
  classes,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
}: AnnouncementManagementProps) {
  const { toast } = useToast();
  const [createAnnouncementOpen, setCreateAnnouncementOpen] = useState(false);
  const [editAnnouncementOpen, setEditAnnouncementOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [viewAnnouncementOpen, setViewAnnouncementOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [targetAudience, setTargetAudience] = useState<"All" | "Selected">(
    "Selected"
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Filter states
  const [filterStatus, setFilterStatus] = useState<
    "all" | "draft" | "published" | "scheduled"
  >("all");
  const [filterPriority, setFilterPriority] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPriority("Medium");
    setTargetAudience("Selected");
    setSelectedClasses([]);
    setScheduleDate("");
    setScheduleTime("");
  };

  const handleCreateAnnouncement = (isDraft: boolean = false) => {
    if (!title || !content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    if (targetAudience === "Selected" && selectedClasses.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one class",
        variant: "destructive",
      });
      return;
    }

    const newAnnouncement: Omit<Announcement, "id" | "createdDate"> = {
      title,
      content,
      priority,
      classIds:
        targetAudience === "All" ? classes.map((c) => c.id) : selectedClasses,
      status: isDraft ? "Draft" : scheduleDate ? "Scheduled" : "Published",
      scheduledDate:
        scheduleDate && scheduleTime
          ? `${scheduleDate}T${scheduleTime}`
          : undefined,
      targetAudience,
      readBy: [],
    };

    onAddAnnouncement(newAnnouncement);
    setCreateAnnouncementOpen(false);
    resetForm();

    toast({
      title: "Success",
      description: `Announcement ${
        isDraft ? "saved as draft" : scheduleDate ? "scheduled" : "published"
      } successfully`,
    });
  };

  const handleEditAnnouncement = () => {
    if (!selectedAnnouncement || !title || !content) return;

    const updatedAnnouncement: Partial<Announcement> = {
      title,
      content,
      priority,
      classIds:
        targetAudience === "All" ? classes.map((c) => c.id) : selectedClasses,
      targetAudience,
      scheduledDate:
        scheduleDate && scheduleTime
          ? `${scheduleDate}T${scheduleTime}`
          : undefined,
    };

    onUpdateAnnouncement(selectedAnnouncement.id, updatedAnnouncement);
    setEditAnnouncementOpen(false);
    setSelectedAnnouncement(null);
    resetForm();

    toast({
      title: "Success",
      description: "Announcement updated successfully",
    });
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setPriority(announcement.priority);
    setTargetAudience(announcement.targetAudience);
    setSelectedClasses(announcement.classIds);

    if (announcement.scheduledDate) {
      const date = new Date(announcement.scheduledDate);
      setScheduleDate(date.toISOString().split("T")[0]);
      setScheduleTime(date.toTimeString().slice(0, 5));
    }

    setEditAnnouncementOpen(true);
  };

  const handlePublishDraft = (announcementId: string) => {
    onUpdateAnnouncement(announcementId, { status: "Published" });
    toast({
      title: "Success",
      description: "Announcement published successfully",
    });
  };

  const handleToggleClassSelection = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      announcement.status.toLowerCase() === filterStatus;
    const matchesPriority =
      filterPriority === "all" ||
      announcement.priority.toLowerCase() === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "border-green-200 text-green-700 bg-green-50";
      case "Draft":
        return "border-gray-200 text-gray-700 bg-gray-50";
      case "Scheduled":
        return "border-blue-200 text-blue-700 bg-blue-50";
      default:
        return "border-gray-200 text-gray-700 bg-gray-50";
    }
  };

  const totalReach = announcements.reduce((sum, ann) => {
    if (ann.status === "Published") {
      return (
        sum +
        ann.classIds.reduce((classSum, classId) => {
          const classData = classes.find((c) => c.id === classId);
          return classSum + (classData?.enrolledStudents || 0);
        }, 0)
      );
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{announcements.length}</div>
                <div className="text-sm text-muted-foreground">
                  Total Announcements
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {announcements.filter((a) => a.status === "Published").length}
                </div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Edit className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {announcements.filter((a) => a.status === "Draft").length}
                </div>
                <div className="text-sm text-muted-foreground">Drafts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalReach}</div>
                <div className="text-sm text-muted-foreground">Total Reach</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(value: any) => setFilterStatus(value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterPriority}
              onValueChange={(value: any) => setFilterPriority(value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateAnnouncementOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">
                No announcements found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm ||
                filterStatus !== "all" ||
                filterPriority !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first announcement to communicate with students"}
              </p>
              <Button onClick={() => setCreateAnnouncementOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold truncate">
                        {announcement.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(announcement.priority)}
                      >
                        {announcement.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getStatusColor(announcement.status)}
                      >
                        {announcement.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {announcement.createdDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {announcement.classIds.length} class
                        {announcement.classIds.length !== 1 ? "es" : ""}
                      </span>
                      {announcement.scheduledDate && (
                        <span className="flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          Scheduled:{" "}
                          {new Date(
                            announcement.scheduledDate
                          ).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">
                        Classes:{" "}
                        {announcement.classIds
                          .map((classId) => {
                            const classData = classes.find(
                              (c) => c.id === classId
                            );
                            return classData?.code;
                          })
                          .join(", ")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {announcement.status === "Draft" && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishDraft(announcement.id)}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Publish
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAnnouncement(announcement);
                            setViewAnnouncementOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(announcement)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteAnnouncement(announcement.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Announcement Dialog */}
      <Dialog
        open={createAnnouncementOpen || editAnnouncementOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateAnnouncementOpen(false);
            setEditAnnouncementOpen(false);
            setSelectedAnnouncement(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editAnnouncementOpen
                ? "Edit Announcement"
                : "Create New Announcement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement content..."
                rows={6}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value: "Low" | "Medium" | "High") =>
                    setPriority(value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Audience</Label>
                <Select
                  value={targetAudience}
                  onValueChange={(value: "All" | "Selected") =>
                    setTargetAudience(value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Selected">Selected Classes</SelectItem>
                    <SelectItem value="All">All Classes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {targetAudience === "Selected" && (
              <div>
                <Label>Select Classes</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 max-h-48 overflow-y-auto p-3 border rounded-lg">
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`class-${classItem.id}`}
                        checked={selectedClasses.includes(classItem.id)}
                        onChange={() =>
                          handleToggleClassSelection(classItem.id)
                        }
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor={`class-${classItem.id}`}
                        className="text-sm font-normal flex-1 cursor-pointer"
                      >
                        <div>{classItem.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {classItem.code} • {classItem.enrolledStudents}{" "}
                          students
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Schedule (Optional)</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    placeholder="Schedule date"
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    placeholder="Schedule time"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to publish immediately
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  editAnnouncementOpen
                    ? handleEditAnnouncement()
                    : handleCreateAnnouncement(true)
                }
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={() =>
                  editAnnouncementOpen
                    ? handleEditAnnouncement()
                    : handleCreateAnnouncement(false)
                }
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                {scheduleDate ? "Schedule" : "Publish"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Announcement Dialog */}
      <Dialog
        open={viewAnnouncementOpen}
        onOpenChange={setViewAnnouncementOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Announcement Details</DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold">
                    {selectedAnnouncement.title}
                  </h2>
                  <Badge
                    variant="outline"
                    className={getPriorityColor(selectedAnnouncement.priority)}
                  >
                    {selectedAnnouncement.priority}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedAnnouncement.status)}
                  >
                    {selectedAnnouncement.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Created: {selectedAnnouncement.createdDate}
                  {selectedAnnouncement.scheduledDate && (
                    <span className="ml-4">
                      Scheduled:{" "}
                      {new Date(
                        selectedAnnouncement.scheduledDate
                      ).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm">
                  {selectedAnnouncement.content}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Target Classes</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedAnnouncement.classIds.map((classId) => {
                    const classData = classes.find((c) => c.id === classId);
                    return classData ? (
                      <div
                        key={classId}
                        className="p-2 bg-gray-50 rounded text-sm"
                      >
                        <div className="font-medium">{classData.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {classData.code} • {classData.enrolledStudents}{" "}
                          students
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewAnnouncementOpen(false);
                    handleOpenEdit(selectedAnnouncement);
                  }}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewAnnouncementOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

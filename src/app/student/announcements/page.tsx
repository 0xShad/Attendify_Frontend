"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  BookOpen,
  Pin,
  PinOff,
  Archive,
  MoreVertical,
  Star,
  StarOff,
  Check,
  X,
  Megaphone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// simplified: single list view (tabs removed)
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
import AnnouncementCard from "@/components/student-portal/announcements/AnnouncementCard";
import AnnouncementDetailsDrawer from "@/components/student-portal/announcements/AnnouncementDetailsDrawer";
import fetchMyAnnouncements from "@/lib/api/announcements";
import { listMyClassOptions } from "@/lib/api/classes";

interface Announcement {
  id: string;
  title: string;
  content: string;
  fullContent: string;
  classId: string | null;
  className: string | null;
  class_code?: string | null;
  course_name?: string | null;
  created_at?: string | null;
  instructor: string;
  instructorAvatar: string;
  date: string;
  time: string;
  priority: "High" | "Medium" | "Low";
  isRead: boolean;
  isPinned: boolean;
  isStarred: boolean;
  category: string;
  hasAttachments?: boolean;
  attachments?: string[];
  dueDate?: string;
  canReply?: boolean;
}

export default function StudentAnnouncementsPage() {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [announcementDetailsOpen, setAnnouncementDetailsOpen] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Load announcements from API on page load and replace mock data
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const items = await fetchMyAnnouncements();
        if (!mounted) return;

        const mapped = items.map((a) => {
          const dt = a.created_at ? new Date(a.created_at) : new Date();
          return {
            id: String(a.id),
            title: a.title,
            content: a.content,
            fullContent: a.content,
            classId: a.class_id != null ? String(a.class_id) : null,
            className: a.course_name ?? a.class_code ?? null,
            class_code: a.class_code ?? null,
            course_name: a.course_name ?? null,
            created_at: a.created_at ?? null,
            instructor: "",
            instructorAvatar: "/avatars/default.jpg",
            date: dt.toLocaleDateString(),
            time: dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            priority: "Low" as const,
            isRead: false,
            isPinned: false,
            isStarred: false,
            category: "General",
            attachments: [],
          };
        });

        setAnnouncements(mapped);
      } catch (err: any) {
        toast({ title: "Announcements", description: err?.message || "Failed to load announcements", variant: "destructive" });
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [setAnnouncements, toast]);

  const [enrolledClasses, setEnrolledClasses] = useState<Array<{ id: string; name?: string | null; code?: string | null }>>([]);

  // Load class options for the filter from backend
  useEffect(() => {
    let mounted = true;
    async function loadOptions() {
      try {
        const opts = await listMyClassOptions();
        if (!mounted) return;
        // map backend shape { id, course_id, class_code, course_name }
        const mapped = opts.map((o: any) => ({ id: String(o.id), name: o.course_name ?? null, code: o.class_code ?? null }));
        setEnrolledClasses(mapped);
      } catch (err) {
        // silently ignore — keep mock options
      }
    }
    loadOptions();
    return () => { mounted = false; };
  }, []);

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

    const matchesPriority = true; // priority filter removed

    return matchesSearch && matchesClass && matchesPriority;
  });

  // Separate pinned and unpinned announcements
  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.isPinned);
  const unpinnedAnnouncements = filteredAnnouncements.filter(
    (a) => !a.isPinned
  );

  const handleViewDetails = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementDetailsOpen(true);
  };

  // priority feature removed

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

  // New: format ISO created_at string to relative time
  const formatTimeAgoISO = (iso?: string | null) => {
    if (!iso) return "";
    const now = new Date();
    const announcementDate = new Date(iso);
    const diffInHours = Math.floor(
      (now.getTime() - announcementDate.getTime()) / (1000 * 60 * 60)
    );
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return announcementDate.toLocaleDateString();
  };

  // unread/starred counters removed

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        {/* header counts removed */}
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
        </div>
      </div>

      {/* Single list view: pinned first, then others */}
      {filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Announcements</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery || classFilter !== "all"
                ? "No announcements match your current filters."
                : "You don't have any announcements yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...pinnedAnnouncements, ...unpinnedAnnouncements].map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onViewDetails={handleViewDetails}
              getCategoryColor={getCategoryColor}
              formatTimeAgoISO={formatTimeAgoISO}
            />
          ))}
        </div>
      )}

      {/* Announcement Details Drawer */}
      <AnnouncementDetailsDrawer
        open={announcementDetailsOpen}
        onOpenChange={setAnnouncementDetailsOpen}
        selectedAnnouncement={selectedAnnouncement}
        getCategoryColor={getCategoryColor}
        formatTimeAgoISO={formatTimeAgoISO}
      />
    </div>
  );
}

// Announcement Card Component


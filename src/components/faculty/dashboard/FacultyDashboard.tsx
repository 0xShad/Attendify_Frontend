"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Plus,
  Megaphone,
  ChevronRight,
  BookOpen
} from "lucide-react";

// Use your existing API function
import { getFacultyDashboardEnhanced, type FacultyDashboardEnhanced } from "@/lib/api/analytics";

interface Props {
  isLoading?: boolean;
  metricCards?: any[];
  classes?: any[];
  activeSessions?: any[];
  onStartSession?: (classId: string) => void;
  onEndSession?: (sessionId: string) => void;
  onOpenAddClass?: () => void;
  onOpenNewAnnouncement?: () => void;
  onOpenClasses?: () => void;
}

// --- Helper Components ---

const Greeting = () => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return <h1 className="text-3xl font-bold tracking-tight">{greeting}, Faculty.</h1>;
};

const StatCard = ({ title, value, icon: Icon, subtext, trend }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">
        {trend && <span className={trend === "up" ? "text-green-600" : "text-red-600"}>{trend === "up" ? "↑" : "↓"} </span>}
        {subtext}
      </p>
    </CardContent>
  </Card>
);

// --- Main Component ---

export default function FacultyDashboard({
  isLoading: isLoadingProp,
  onOpenAddClass,
  onOpenNewAnnouncement,
  onOpenClasses,
  onStartSession,
  onEndSession,
}: Props) {
  const [data, setData] = useState<FacultyDashboardEnhanced | null>(null);
  const [activeTab, setActiveTab] = useState<string>("comparison");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getFacultyDashboardEnhanced()
      .then((res) => {
        if (!mounted) return;
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load dashboard", err);
        if (!mounted) return;
        setError(err?.message || String(err));
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const isLoading = Boolean(isLoadingProp) || loading;

  // --- Data Transformation for Charts ---

  const chartData = useMemo(() => {
    if (!data?.students_by_class) return { bars: [], pie: [] };

    // Bar Chart: Attendance Rate per Class
    const bars = data.students_by_class.map(c => {
      const late = c.late || 0;
      const present_or_late = c.present_or_late || 0;
      const present = Math.max(0, present_or_late - late);
      const excused = c.excused || 0;
      const absent = c.absent || 0;
      return {
        name: c.course_name || c.class_code || "Unknown",
        full_name: c.course_name,
        rate: c.attendance_rate ? Math.round(c.attendance_rate * 100) : 0,
        students: c.enrolled_count || 0,
        present,
        late,
        excused,
        absent,
      };
    });

    // Pie Chart: Overall Student Status Distribution
    // (Aggregating raw logs from overall_students)
    const pie = [
      { name: 'Present', value: (data.overall_students?.present_or_late || 0) - (data.overall_students?.late || 0), color: '#22c55e' }, // Pure Present (Approx)
      { name: 'Late', value: data.overall_students?.late || 0, color: '#eab308' },
      { name: 'Absent', value: data.overall_students?.absent || 0, color: '#ef4444' },
      { name: 'Excused', value: data.overall_students?.excused || 0, color: '#3b82f6' },
    ].filter(item => item.value > 0);

    return { bars, pie };
  }, [data]);

  const totalStudents = useMemo(() => {
    return data?.students_by_class?.reduce((acc, curr) => acc + (curr.enrolled_count || 0), 0) || 0;
  }, [data]);

  // Day filter for Classes for Today card. Default to today's weekday name.
  const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayName = weekdays[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState<string>(todayName);

  // Helper: format time remaining until session starts (or show started/ago)
  function formatTimeRemaining(sessionDate?: string | null, startTime?: string | null) {
    if (!sessionDate || !startTime) return "TBD";
    // sessionDate is expected like '2025-11-28', startTime like '09:00:00' or '09:00'
    const timePart = startTime.length >= 5 ? startTime.substring(0,5) : startTime;
    const dt = new Date(`${sessionDate}T${timePart}:00`);
    const now = new Date();
    const diff = dt.getTime() - now.getTime();
    const abs = Math.abs(diff);
    const minutes = Math.floor(abs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    if (diff > 0) {
      if (hours > 0) return `Starts in ${hours}h ${remMinutes}m`;
      return `Starts in ${remMinutes}m`;
    }
    // already started or past
    if (hours > 0) return `Started ${hours}h ${remMinutes}m ago`;
    return `Started ${remMinutes}m ago`;
  }

  // Helper: normalize/format a time value for display (handles HH:MM, ISO datetimes, etc.)
  function formatTimeLabel(value?: string | null) {
    if (!value) return '';
    try {
      // If it's an ISO datetime or contains 'T', parse to Date
      if (value.includes('T')) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      }
      // If it looks like HH:MM or HH:MM:SS
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
        return value.substring(0,5);
      }
      // If it's a full date string, try to parse
      const parsed = Date.parse(value);
      if (!isNaN(parsed)) {
        return new Date(parsed).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      }
      return String(value).substring(0,5);
    } catch { return String(value).substring(0,5); }
  }

  // Helper: find class info by schedule_id in students_by_class
  function findClassForSchedule(scheduleId?: number | null) {
    if (!data?.students_by_class || !scheduleId) return null;
    for (const cls of data.students_by_class) {
      if (!Array.isArray(cls.upcoming_sessions)) continue;
      const found = cls.upcoming_sessions.find((s: any) => s.schedule_id === scheduleId || s.session_id === scheduleId);
      if (found) return cls;
    }
    return null;
  }

  

  // --- Render ---

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="text-lg font-medium text-stone-900">Failed to load dashboard</p>
          <p className="text-sm text-stone-500">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const activeCount = data?.students_by_class?.filter((c: any) => Boolean(c.is_active)).length || 0;
  const hasActive = (data?.students_by_class || []).some((c: any) => Boolean(c.is_active));
  const hasOngoing = (data?.students_by_class || []).some((c: any) => Boolean(c.session_started));
  const sessionStatusLabel = hasActive ? 'Active' : hasOngoing ? 'Ongoing' : 'No Active';
  const sessionStatusClass = hasActive ? 'bg-emerald-600 text-white' : hasOngoing ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-600';

  // Header session times: pick a representative active/ongoing class to show its start/end
  const representativeClass = (data?.students_by_class || []).find((c: any) => Boolean(c.is_active) || Boolean(c.session_started)) || null;
  let headerSessionObj: any = null;
  if (representativeClass) {
    const rep: any = representativeClass as any;
    headerSessionObj = rep.active_session || rep.current_session || rep.session || rep.activeSession || null;
    if (!headerSessionObj && Array.isArray(rep?.upcoming_sessions) && rep.upcoming_sessions.length > 0) {
      headerSessionObj = rep.upcoming_sessions[0];
    }
    if (!headerSessionObj && Array.isArray((data as any)?.active_sessions)) {
      headerSessionObj = (data as any).active_sessions.find((s: any) => s && (s.class_id === rep.class_id || s.class_code === rep.class_code)) || null;
    }
  }
  const headerStartRaw = headerSessionObj?.start_time || headerSessionObj?.startTime || headerSessionObj?.start || headerSessionObj?.from_time || (representativeClass as any)?.start_time || (representativeClass as any)?.startTime || '';
  const headerEndRaw = headerSessionObj?.end_time || headerSessionObj?.endTime || headerSessionObj?.end || headerSessionObj?.to_time || (representativeClass as any)?.end_time || (representativeClass as any)?.endTime || '';
  const headerStartLabel = formatTimeLabel(headerStartRaw || null);
  const headerEndLabel = formatTimeLabel(headerEndRaw || null);

  return (
    <div className="space-y-6 p-2 md:p-6 bg-stone-50/50 min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Greeting />
          <p className="text-stone-500">Here's what's happening in your classes today.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onOpenNewAnnouncement} variant="outline" className="gap-2">
            <Megaphone className="h-4 w-4" /> Announcement
          </Button>
          <Button onClick={onOpenAddClass} className="gap-2 bg-stone-900 text-white hover:bg-stone-800">
            <Plus className="h-4 w-4" /> Create Class
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Assigned Classes" 
          value={data?.assigned_classes_count || 0} 
          icon={BookOpen} 
          subtext="Active courses this semester"
        />
        <StatCard 
          title="Total Students" 
          value={totalStudents} 
          icon={Users} 
          subtext="Enrolled across all sections" 
        />
        <StatCard 
          title="Avg. Student Attendance" 
          value={`${((data?.overall_students?.attendance_rate || 0) * 100).toFixed(1)}%`} 
          icon={TrendingUp} 
          subtext="Overall engagement rate"
        />
        <StatCard 
          title="Pending Excusals" 
          value={data?.pending_excusals || 0} 
          icon={AlertCircle} 
          subtext="Requests awaiting review"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* Left Column: Analytics (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="col-span-4">
            <CardHeader className="flex items-start justify-between">
              <div>
                <CardTitle>Current Session</CardTitle>
                <CardDescription>Start or take attendance for the active class session.</CardDescription>
              </div>
              <div className="ml-2 flex flex-col items-end">
                <Badge className={sessionStatusClass}>
                  {sessionStatusLabel}
                </Badge>
                {(headerStartLabel || headerEndLabel) && (
                  <div className="text-xs text-stone-500 mt-1">
                    {headerStartLabel || 'TBD'}{headerEndLabel ? ` - ${headerEndLabel}` : ''}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pl-2">
              {(() => {
                const activeClasses = (data?.students_by_class || []).filter((c: any) => Boolean(c.is_active));
                if (!activeClasses || activeClasses.length === 0) {
                  return (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-sm text-stone-600">No active session</p>
                        <p className="text-xs text-stone-400 mt-2">Use the controls to start a session or record attendance. (Placeholder)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => alert('Start Session (placeholder)')} variant="outline" className="gap-2">
                          <Clock className="h-4 w-4" /> Start Session
                        </Button>
                        <Button onClick={() => alert('Take Attendance (placeholder)')} className="gap-2 bg-stone-900 text-white hover:bg-stone-800">
                          <CheckCircle2 className="h-4 w-4" /> Take Attendance
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {activeClasses.map((cls: any) => {
                      // Try to find a session object attached to the class first
                      const activeSession = cls.active_session || cls.current_session || cls.session || cls.activeSession || null;
                      // Fallback: prefer a session object attached to the class, else:
                      // 1) look into the class's `upcoming_sessions` (common in the enhanced payload),
                      // 2) then look into top-level `data.active_sessions` if present.
                      let sessionObj = activeSession || null;

                      // If class has upcoming_sessions, try to pick the matching one (by session_id or schedule_id)
                      if (!sessionObj && Array.isArray((cls as any)?.upcoming_sessions) && (cls as any).upcoming_sessions.length > 0) {
                        const byId = (cls as any).upcoming_sessions.find((s: any) => s && (s.session_id === (activeSession?.session_id) || s.session_id === (cls.session_id)));
                        const bySchedule = (cls as any).upcoming_sessions.find((s: any) => s && s.schedule_id === (cls.schedule_id));
                        sessionObj = byId || bySchedule || (cls as any).upcoming_sessions[0] || null;
                      }

                      // Next fallback: top-level active_sessions list returned by some backends
                      if (!sessionObj && Array.isArray((data as any)?.active_sessions)) {
                        sessionObj = (data as any).active_sessions.find((s: any) => {
                          return s && (s.class_id === cls.class_id || s.class_code === cls.class_code || s.schedule_id === cls.schedule_id || s.session_id === cls.session_id);
                        }) || null;
                      }

                      const startRaw = sessionObj?.start_time || sessionObj?.startTime || sessionObj?.start || sessionObj?.from_time || cls.start_time || cls.startTime || cls.start || '';
                      const endRaw = sessionObj?.end_time || sessionObj?.endTime || sessionObj?.end || sessionObj?.to_time || cls.end_time || cls.endTime || cls.end || '';
                      const startLabel = formatTimeLabel(startRaw || null);
                      const endLabel = formatTimeLabel(endRaw || null);

                      return (
                        <div key={String(cls.class_id ?? cls.class_code ?? cls.course_name)} className="flex items-center justify-between p-3 bg-stone-50 rounded">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-semibold text-stone-900 line-clamp-1">{cls.course_name || 'Untitled Course'}</p>
                              {cls.f2f_activated && <Badge variant="secondary">F2F</Badge>}
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-sm text-stone-500">{cls.class_code || ''}</p>
                            </div>
                            {cls.mode && (
                                <span className="text-xs text-stone-500 capitalize">{String(cls.mode)}</span>
                              )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (typeof (onStartSession as any) === 'function') {
                                  try { onStartSession(String(cls.class_id ?? '')); } catch { /* ignore */ }
                                } else {
                                  alert('Take Attendance (placeholder)');
                                }
                              }}
                              className="gap-2 bg-stone-900 text-white hover:bg-stone-800"
                            >
                              <CheckCircle2 className="h-4 w-4" /> Take Attendance
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (typeof (onEndSession as any) === 'function') {
                                  try { onEndSession(String(cls.class_id ?? '')); } catch { /* ignore */ }
                                } else {
                                  alert('End Session (placeholder)');
                                }
                              }}
                            >
                              End
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Detailed Class List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Classes</h3>
              <Button variant="ghost" size="sm" onClick={onOpenClasses} className="text-stone-500">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.students_by_class?.map((cls) => (
                <ClassCard key={cls.class_id} data={cls} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Personal Stats (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Upcoming Agenda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-stone-500" />
                Class Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {weekdays.map((d) => (
                    <Button
                      key={d}
                      variant={d === selectedDay ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedDay(d)}
                      className={d === selectedDay ? "bg-stone-900 text-white" : "text-stone-600"}
                    >
                      {d}
                    </Button>
                  ))}
                </div>

                <div className="relative border-l border-stone-200 pl-6 space-y-4">
                  {Array.isArray(data?.upcoming_sessions_overall) ? (
                    (() => {
                      const sessions = data!.upcoming_sessions_overall.filter((s: any) => {
                        if (!s || !s.session_date) return false;
                        const dayName = weekdays[new Date(s.session_date).getDay()];
                        return dayName === selectedDay;
                      });
                      if (sessions.length === 0) {
                        return <div className="text-sm text-stone-500 italic">No classes for {selectedDay}.</div>;
                      }
                      return sessions.slice(0, 10).map((session: any, i: number) => {
                        const cls = findClassForSchedule(session.schedule_id || session.session_id);
                        const courseName = cls?.course_name || session.course_name || "Unknown Course";
                        const classCode = cls?.class_code || session.class_code || "";
                        const start = session.start_time || session.startTime || session.start || session.from_time || '';
                        const end = session.end_time || session.endTime || session.finish_time || session.to_time || '';
                        const startLabel = start ? String(start).substring(0,5) : '';
                        const endLabel = end ? String(end).substring(0,5) : '';

                        return (
                          <div key={i} className="relative">
                            <span className="absolute -left-3 top-3 h-2.5 w-2.5 rounded-full bg-stone-300 ring-4 ring-white" />
                            <div className="flex items-center justify-between gap-2 pl-2">
                              <div>
                                <p className="text-sm font-medium text-stone-900 line-clamp-1">{courseName}</p>
                                {classCode && <p className="text-xs text-stone-500">{classCode}</p>}
                                <p className="text-xs text-stone-400 mt-1">{new Date(session.session_date || "").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                              </div>

                              <div className="flex flex-col items-end gap-1 text-right">
                                
                                <span className="text-xs text-stone-500">{startLabel || 'TBD'}{endLabel ? ` - ${endLabel}` : ''}</span>
                                {((cls as any)?.mode) && (
                                  <p className="text-xs text-stone-400 mt-1 mb-1 capitalize">{String((cls as any).mode)}</p>
                                )}
                                <Badge variant="secondary">{formatTimeRemaining(session.session_date, start || null)}</Badge>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div className="text-sm text-stone-500 italic">No classes scheduled.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Attendance */}
          <Card className="bg-stone-900 text-stone-50">
            <CardHeader>
              <CardTitle className="text-stone-100">My Attendance Rate</CardTitle>
              <CardDescription className="text-stone-400">Your presence across all logs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">
                  {data?.my_attendance?.attendance_rate 
                    ? `${(data.my_attendance.attendance_rate * 100).toFixed(0)}%` 
                    : "—"}
                </span>
                <span className="text-sm text-stone-400 mb-1">Present / Late / Excused</span>
              </div>
              <Progress 
                value={(data?.my_attendance?.attendance_rate || 0) * 100} 
                className="h-2 bg-stone-700" 
              />
              <div className="grid grid-cols-4 gap-2 text-center text-xs text-stone-400 pt-2">
                <div>
                  <div className="font-semibold text-white">{data?.my_attendance?.present_or_late || 0}</div>
                  <div>Present</div>
                </div>
                <div>
                  <div className="font-semibold text-white">{data?.my_attendance?.late || 0}</div>
                  <div>Late</div>
                </div>
                <div>
                  <div className="font-semibold text-white">{data?.my_attendance?.excused || 0}</div>
                  <div>Excused</div>
                </div>
                <div>
                  <div className="font-semibold text-white">{data?.my_attendance?.absent || 0}</div>
                  <div>Absent</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Attendance (Aggregated) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-stone-500" />
                Student Attendance Classification
              </CardTitle>
              <CardDescription>Student attendance across your classes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-stone-500 mb-2">Present / Late / Excused</div>
              {/* progress bar intentionally removed to avoid duplication with KPI metric */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs text-stone-500 pt-2">
                <div>
                  <div className="font-semibold">{data?.overall_students?.present_or_late || 0}</div>
                  <div>Present</div>
                </div>
                <div>
                  <div className="font-semibold">{data?.overall_students?.late || 0}</div>
                  <div>Late</div>
                </div>
                <div>
                  <div className="font-semibold">{data?.overall_students?.excused || 0}</div>
                  <div>Excused</div>
                </div>
                <div>
                  <div className="font-semibold">{data?.overall_students?.absent || 0}</div>
                  <div>Absent</div>
                </div>
              </div>
              {/* Compact Bar chart showing attendance rate per class */}
              <div className="mt-4 h-36">
                {chartData.bars && chartData.bars.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.bars} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
                      <YAxis hide />
                      <Tooltip formatter={(value: any, name: any) => [`${value}`, `${name}`]} />
                      <Bar dataKey="present" stackId="a" fill="#16a34a" barSize={16} radius={[4,4,0,0]} />
                      <Bar dataKey="late" stackId="a" fill="#f59e0b" barSize={16} />
                      <Bar dataKey="excused" stackId="a" fill="#3b82f6" barSize={16} />
                      <Bar dataKey="absent" stackId="a" fill="#ef4444" barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-sm text-stone-400">No class attendance data to display.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function ClassCard({ data }: { data: any }) {
  const rate = data.attendance_rate ? data.attendance_rate * 100 : 0;
  
  // Determine color based on rate
  let progressColor = "bg-green-600";
  if(rate < 75) progressColor = "bg-red-500";
  else if(rate < 85) progressColor = "bg-yellow-500";

  return (
    <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
            <div>
            <CardTitle className="text-lg font-semibold line-clamp-1" title={data.course_name}>
              {data.course_name || "Untitled Course"}
            </CardTitle>
            <CardDescription className="text-sm">{data.class_code}</CardDescription>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Users className="w-3 h-3" />
              <span>{data.enrolled_count ?? 0} students</span>
            </div>
          </div>
          <Badge variant={rate >= 90 ? "default" : "secondary"}>
            {rate.toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
          <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Attendance Rate</span>
          </div>
          <div className="w-full h-2 bg-stone-200 rounded overflow-hidden">
            <div className={`${progressColor} h-full`} style={{ width: `${rate}%` }} />
          </div>
        </div>
        
        {/* Mini stats for recent session */}
        {data.recent_sessions && data.recent_sessions.length > 0 && (
          <div className="bg-stone-50 rounded p-2 text-xs text-stone-600 flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span className="font-medium">Last Session:</span>
            <span>
              {data.recent_sessions[0].present_count} Present 
              <span className="mx-1">•</span> 
              {data.recent_sessions[0].absent_count} Absent
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-1/3 bg-stone-200 animate-pulse rounded" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-stone-200 animate-pulse rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-6">
        <div className="col-span-4 h-96 bg-stone-200 animate-pulse rounded-xl" />
        <div className="col-span-3 space-y-6">
           <div className="h-48 bg-stone-200 animate-pulse rounded-xl" />
           <div className="h-48 bg-stone-200 animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  );
}
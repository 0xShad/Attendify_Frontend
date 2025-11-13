"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// We'll render the create form inline inside the parent modal (ViewClassDrawer)
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api/auth";
import { schedulesAPI } from "@/lib/api/schedules";
import { IconArrowLeft, IconPencil, IconTrash } from "@tabler/icons-react";
import DeleteScheduleDialog from "./DeleteScheduleDialog";

type Props = {
  classId?: number | null;
};

type ScheduleCommon = {
  id: number;
  type: "normal" | "special";
  start_time: string;
  end_time: string;
  location: string | null;
  modes: string[];
};

type NormalSchedule = ScheduleCommon & {
  type: "normal";
  day_of_week: string; // Monday..Sunday
};

type SpecialSchedule = ScheduleCommon & {
  type: "special";
  date: string; // ISO date
  reason: string | null;
  notes: string | null;
};

type Schedule = NormalSchedule | SpecialSchedule;

export default function SchedulesTab({ classId }: Props) {
  const { toast } = useToast();
  const router = useRouter();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Form state
  const [formType, setFormType] = useState<"normal" | "special">("normal");
  const [dayOfWeek, setDayOfWeek] = useState<string>("Monday");
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Helper: day order mapping
  const dayOrder: Record<string, number> = useMemo(
    () => ({
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    }),
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!classId) return;

      // Authentication presence check (best-effort): prefer authAPI.isAuthenticated();
      // Also check localStorage tokens if available. If not present, redirect to logout page.
      try {
        const hasClientAuth = typeof window !== "undefined" && (
          authAPI.isAuthenticated() ||
          Boolean(window.localStorage.getItem("accessToken")) ||
          Boolean(window.localStorage.getItem("access_token")) ||
          Boolean(window.localStorage.getItem("isAuthenticated"))
        );

        if (!hasClientAuth) {
          // If we can't find evidence of auth on the client, navigate to logout which clears state/server cookies.
          router.push("/auth/logout");
          return;
        }
      } catch (err) {
        // Non-fatal - continue but warn
        console.warn("Auth check failed before fetching schedules", err);
      }

      setIsLoading(true);
      try {
        const data = await schedulesAPI.listSchedulesForClass(classId);

        if (cancelled) return;

        // Defensive: ensure ordering as specified (normal then special)
        const normals = data
          .filter((s) => s.type === "normal")
          .sort((a: NormalSchedule, b: NormalSchedule) => {
            const da = dayOrder[a.day_of_week] ?? 99;
            const db = dayOrder[b.day_of_week] ?? 99;
            if (da !== db) return da - db;
            return a.start_time.localeCompare(b.start_time);
          });

        const specials = data
          .filter((s) => s.type === "special")
          .sort((a: SpecialSchedule, b: SpecialSchedule) => a.date.localeCompare(b.date));

        setSchedules([...normals, ...specials]);
      } catch (error: any) {
        console.error("Failed to load schedules:", error);
        if (!cancelled) {
          // Distinguish not found
          const msg = String(error?.message || "");
          if (msg.toLowerCase().includes("notfound") || msg.toLowerCase().includes("not found")) {
            setSchedules([]);
            toast({ title: "Not found", description: "Class not found (schedules)", variant: "destructive" });
          } else {
            toast({ title: "Error", description: "Failed to load schedules", variant: "destructive" });
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [classId, router, toast, dayOrder]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Schedules</h3>
        <div>
          <Button size="sm" variant="outline" disabled={!classId} onClick={() => setOpenCreate(true)}>
            Add Schedule
          </Button>
        </div>
      </div>

      {openCreate ? (
        <div className="p-4 border rounded mb-4 bg-white/50">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={() => setOpenCreate(false)}>
              <IconArrowLeft />
            </Button>
            <h4 className="text-lg font-medium">Add Schedule</h4>
          </div>

            {editLoading ? (
              <div className="py-6">Loading schedule…</div>
            ) : (
              <div className="space-y-3">
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-2">
                <Button variant={formType === "normal" ? "default" : "outline"} size="sm" onClick={() => setFormType("normal")}>Normal</Button>
                <Button variant={formType === "special" ? "default" : "outline"} size="sm" onClick={() => setFormType("special")}>Special</Button>
              </div>
            </div>

            {formType === "normal" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label>Day of week</Label>
                  <select className="w-full mt-1 p-2 border rounded" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                    {Object.keys(dayOrder).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Start time</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                  <Label>End time</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Start time</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                  <Label>End time</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Reason</Label>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Notes</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <Label>Mode</Label>
              <div className="flex gap-3 mt-2 items-center">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="mode" value="online" checked={selectedMode === "online"} onChange={(e) => setSelectedMode(e.target.value)} />
                  <span>Online</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="mode" value="face_to_face" checked={selectedMode === "face_to_face"} onChange={(e) => setSelectedMode(e.target.value)} />
                  <span>Face to face</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="mode" value="hybrid" checked={selectedMode === "hybrid"} onChange={(e) => setSelectedMode(e.target.value)} />
                  <span>Hybrid</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                // cancel editing/creating
                setOpenCreate(false);
                setIsEditing(false);
                setEditingId(null);
              }}>Cancel</Button>
              <Button disabled={submitLoading} onClick={async () => {
                if (!classId) return;
                // basic validation
                if (!startTime || !endTime) {
                  toast({ title: "Validation", description: "Start and end times are required", variant: "destructive" });
                  return;
                }

                // ensure start < end
                if (startTime >= endTime) {
                  toast({ title: "Validation", description: "Start time must be before end time", variant: "destructive" });
                  return;
                }

                const payload: Record<string, any> = { type: formType, start_time: startTime, end_time: endTime, location: location || null, modes: selectedMode ? [selectedMode] : [] };
                if (formType === "normal") {
                  payload.day_of_week = dayOfWeek;
                } else {
                  if (!date) {
                    toast({ title: "Validation", description: "Date is required for special schedules", variant: "destructive" });
                    return;
                  }
                  payload.date = date;
                  payload.reason = reason || null;
                  payload.notes = notes || null;
                }

                setSubmitLoading(true);
                try {
                  if (isEditing && editingId) {
                    const updated = await schedulesAPI.updateScheduleForClass(classId, editingId, payload);
                    setSchedules((prev) => {
                      const others = prev.filter((p) => p.id !== editingId);
                      const merged = [updated, ...others];
                      const normals = merged.filter((s) => s.type === "normal").sort((a: NormalSchedule, b: NormalSchedule) => {
                        const da = dayOrder[a.day_of_week] ?? 99;
                        const db = dayOrder[b.day_of_week] ?? 99;
                        if (da !== db) return da - db;
                        return a.start_time.localeCompare(b.start_time);
                      });
                      const specials = merged.filter((s) => s.type === "special").sort((a: SpecialSchedule, b: SpecialSchedule) => a.date.localeCompare(b.date));
                      return [...normals, ...specials];
                    });
                    toast({ title: "Success", description: "Schedule updated" });
                  } else {
                    const created = await schedulesAPI.createScheduleForClass(classId, payload);
                    setSchedules((prev) => {
                      const merged = [created, ...prev];
                      const normals = merged.filter((s) => s.type === "normal").sort((a: NormalSchedule, b: NormalSchedule) => {
                        const da = dayOrder[a.day_of_week] ?? 99;
                        const db = dayOrder[b.day_of_week] ?? 99;
                        if (da !== db) return da - db;
                        return a.start_time.localeCompare(b.start_time);
                      });
                      const specials = merged.filter((s) => s.type === "special").sort((a: SpecialSchedule, b: SpecialSchedule) => a.date.localeCompare(b.date));
                      return [...normals, ...specials];
                    });
                    toast({ title: "Success", description: "Schedule created" });
                  }

                  setOpenCreate(false);
                  setIsEditing(false);
                  setEditingId(null);
                } catch (err: any) {
                  console.error(err);
                  toast({ title: "Error", description: String(err?.message || "Failed to save schedule"), variant: "destructive" });
                } finally {
                  setSubmitLoading(false);
                }
              }}>{isEditing ? (submitLoading ? "Saving..." : "Save") : (submitLoading ? "Creating..." : "Create")}</Button>
            </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="max-h-[40vh] overflow-auto">
          {isLoading && <div className="py-4">Loading schedules…</div>}

          {!isLoading && schedules.length === 0 && (
            <div className="py-4">No schedules found for this class.</div>
          )}

          {!isLoading && schedules.length > 0 && (
            <ul className="space-y-3">
              {schedules.map((s) => (
                <li key={s.id} className="p-3 border rounded-md bg-white/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{s.type === "normal" ? (s as NormalSchedule).day_of_week : (s as SpecialSchedule).date}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-mono">{s.start_time} — {s.end_time}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {s.location ?? "No location specified"}
                      </div>
                      {s.type === "special" && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <div><strong>Reason:</strong> { (s as SpecialSchedule).reason ?? "—" }</div>
                          <div><strong>Notes:</strong> { (s as SpecialSchedule).notes ?? "—" }</div>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs flex flex-col items-end gap-2">
                      <div className="font-mono">{s.modes && s.modes.length ? s.modes.join(", ") : "—"}</div>
                      <div className="flex items-center gap-2">
                        <button title="Edit" className="p-1 rounded hover:bg-gray-100" onClick={async () => {
                          if (!classId) return;
                          setIsEditing(true);
                          setEditingId(s.id);
                          setOpenCreate(true);
                          setEditLoading(true);
                          try {
                            const full = await schedulesAPI.getScheduleForClass(classId, s.id);
                            setFormType(full.type);
                            setStartTime(full.start_time);
                            setEndTime(full.end_time);
                            setLocation(full.location || "");
                            setSelectedMode(full.modes && full.modes.length ? full.modes[0] : "");
                            if (full.type === "normal") {
                              setDayOfWeek((full as NormalSchedule).day_of_week || "Monday");
                              setDate("");
                              setReason("");
                              setNotes("");
                            } else {
                              setDate((full as SpecialSchedule).date || "");
                              setReason((full as SpecialSchedule).reason || "");
                              setNotes((full as SpecialSchedule).notes || "");
                            }
                          } catch (err: any) {
                            console.error("Failed to fetch schedule for edit", err);
                            toast({ title: "Error", description: String(err?.message || "Failed to load schedule"), variant: "destructive" });
                            // abort edit
                            setIsEditing(false);
                            setEditingId(null);
                            setOpenCreate(false);
                          } finally {
                            setEditLoading(false);
                          }
                        }}>
                          <IconPencil size={16} />
                        </button>
                        <button title="Delete" className="p-1 rounded hover:bg-gray-100 text-rose-600" onClick={() => {
                          setScheduleToDelete(s as Schedule);
                          setDeleteDialogOpen(true);
                        }}>
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <DeleteScheduleDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} classId={classId} schedule={scheduleToDelete ? { id: scheduleToDelete.id, type: scheduleToDelete.type, start_time: scheduleToDelete.start_time, end_time: scheduleToDelete.end_time, location: scheduleToDelete.location ?? null } : null} onDeleted={(id) => {
        setSchedules((prev) => prev.filter((p) => p.id !== id));
        setScheduleToDelete(null);
      }} />
    </div>
  );
}

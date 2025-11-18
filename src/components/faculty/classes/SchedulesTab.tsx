"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { schedulesAPI } from "@/lib/api/schedules";
import { useToast } from "@/hooks/use-toast";
import DeleteScheduleDialog from "@/components/classes/DeleteScheduleDialog";

type Props = { classId?: number | null };

type Schedule = {
  id: string;
  type: "normal" | "special";
  start_time: string;
  end_time: string;
  location?: string | null;
  day_of_week?: string;
  date?: string;
  modes?: string[];
  reason?: string | null;
  notes?: string | null;
};

export default function SchedulesTab({ classId }: Props) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [formType, setFormType] = useState<"normal" | "special">("normal");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        if (!classId) {
          setSchedules([]);
          return;
        }
        // Call faculty-scoped schedules listing (proxy) via schedulesAPI
        const data = await schedulesAPI.listSchedulesForClass(Number(classId));
        if (!mounted) return;
        // Normalize backend Schedule objects to our local display shape
        const mapped = (Array.isArray(data) ? data : []).map((s: any) => ({
          id: String(s.id),
          type: s.type,
          // format for input display (HH:MM)
          start_time: formatTimeForInput(s.start_time),
          end_time: formatTimeForInput(s.end_time),
          location: s.location ?? null,
          day_of_week: s.type === 'normal' ? (s.day_of_week ?? null) : null,
          date: s.type === 'special' ? (s.date ?? null) : null,
          modes: Array.isArray(s.modes) ? s.modes : [],
          reason: s.reason ?? null,
          notes: s.notes ?? null,
        }));
        setSchedules(mapped);
      } catch (err: any) {
        console.error('Failed to load schedules (faculty):', err);
        setSchedules([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [classId]);

  // Helper: normalize time strings for input and payload
  const formatTimeForInput = (t?: string | null) => {
    if (!t) return "";
    const parts = String(t).split(":");
    if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    return String(t);
  };

  const handleStartEdit = async (s: Schedule) => {
    setIsEditing(true);
    setEditingId(s.id);
    setOpenCreate(true);
    setEditLoading(true);

    try {
      const isBrowser = typeof window !== 'undefined';
      let full: any = null;

      if (isBrowser && classId) {
        const url = `/api/classes/mine/${encodeURIComponent(String(classId))}/schedules/${encodeURIComponent(String(s.id))}`;
        const res = await import("@/lib/api/fetchClient").then(m => m.fetchRawWithAuth(url, { method: 'GET' }));
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(body || res.statusText || `HTTP ${res.status}`);
        }
        full = await res.json();
      } else if (classId) {
        full = await schedulesAPI.getScheduleForClass(Number(classId), Number(s.id));
      }

      // If we got a full schedule from server, use it; otherwise fall back to provided `s`
      const source = full || s;

      setFormType(source.type ?? "normal");
      setStartTime(formatTimeForInput(source.start_time));
      setEndTime(formatTimeForInput(source.end_time));
      setLocation(source.location || "");
      setSelectedMode(source.modes && source.modes.length ? source.modes[0] : "");
      if (source.type === "normal") {
        setDayOfWeek(source.day_of_week || "Monday");
        setDate("");
        setReason("");
        setNotes("");
      } else {
        setDate(source.date || "");
        setReason(source.reason || "");
        setNotes(source.notes || "");
      }
    } catch (err: any) {
      console.error('Failed to fetch schedule for edit', err);
      toast({ title: "Error", description: String(err?.message || "Failed to load schedule"), variant: "destructive" });
      // abort edit
      setIsEditing(false);
      setEditingId(null);
      setOpenCreate(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleSave = async () => {
    // local-only save (no backend)
    if (!editingId) return;
    // reuse validations from create
    if (!startTime || !endTime) {
      toast({ title: "Validation", description: "Start and end times are required", variant: "destructive" });
      return;
    }
    if (Number.isFinite(timeToSeconds(startTime)) && Number.isFinite(timeToSeconds(endTime))) {
      if (timeToSeconds(startTime) >= timeToSeconds(endTime)) {
        toast({ title: "Validation", description: "Start time must be before end time", variant: "destructive" });
        return;
      }
    } else {
      if (startTime >= endTime) {
        toast({ title: "Validation", description: "Start time must be before end time", variant: "destructive" });
        return;
      }
    }

    if (formType === "special" && !date) {
      toast({ title: "Validation", description: "Date is required for special schedules", variant: "destructive" });
      return;
    }

    setSubmitLoading(true);
    try {
      const payload: Record<string, any> = {};
      // Only include fields that are relevant for the selected type
      if (formType) payload.type = formType;
      if (startTime) payload.start_time = ensureTimeHasSeconds(startTime) ?? startTime;
      if (endTime) payload.end_time = ensureTimeHasSeconds(endTime) ?? endTime;
      payload.location = location || null;
      if (selectedMode) payload.modes = [modeMap[selectedMode] ?? selectedMode];
      if (formType === "normal") {
        payload.day_of_week = dayOfWeek;
      } else {
        payload.date = date;
        payload.reason = reason || null;
        payload.notes = notes || null;
      }

      const isBrowser = typeof window !== 'undefined';
      if (isBrowser && classId) {
        const base = `/api/classes/mine/${encodeURIComponent(String(classId))}/schedules/${encodeURIComponent(String(editingId))}`;
        try {
          // Step 1: GET the schedule to ensure it exists and is accessible to caller
          const getRes = await import("@/lib/api/fetchClient").then(m => m.fetchRawWithAuth(base, { method: 'GET' }));
          if (!getRes.ok) {
            const body = await getRes.text().catch(() => "");
            throw new Error(body || getRes.statusText || `HTTP ${getRes.status}`);
          }

          // Step 2: PATCH the schedule with partial payload
          const patchRes = await import("@/lib/api/fetchClient").then(m => m.fetchRawWithAuth(base, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
          const patchText = await patchRes.text().catch(() => "");
          if (!patchRes.ok) {
            throw new Error(patchText || patchRes.statusText || `HTTP ${patchRes.status}`);
          }
          const data = patchText ? JSON.parse(patchText) : null;

          const updated: Schedule = {
            id: String(data.id),
            type: data.type,
            start_time: formatTimeForInput(data.start_time),
            end_time: formatTimeForInput(data.end_time),
            location: data.location ?? null,
            day_of_week: data.type === 'normal' ? (data.day_of_week ?? null) : null,
            date: data.type === 'special' ? (data.date ?? null) : null,
            modes: Array.isArray(data.modes) ? data.modes : [],
            reason: data.reason ?? null,
            notes: data.notes ?? null,
          };

          setSchedules((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
          toast({ title: "Updated", description: "Schedule updated" });
          setIsEditing(false);
          setEditingId(null);
          setOpenCreate(false);
          setStartTime("");
          setEndTime("");
          setLocation("");
          setSelectedMode("");
          setReason("");
          setNotes("");
        } catch (err: any) {
          console.error('Failed to update schedule via proxy:', err);
          toast({ title: "Error", description: String(err?.message || 'Failed to update schedule'), variant: "destructive" });
        }
      } else if (classId) {
        // SSR / fallback to direct backend client
        try {
          const createdData = await schedulesAPI.updateScheduleForClass(Number(classId), Number(editingId), payload as any);
          const updated: Schedule = {
            id: String(createdData.id),
            type: createdData.type,
            start_time: formatTimeForInput(createdData.start_time),
            end_time: formatTimeForInput(createdData.end_time),
            location: createdData.location ?? null,
            day_of_week: createdData.type === 'normal' ? (createdData.day_of_week ?? null) : null,
            date: createdData.type === 'special' ? (createdData.date ?? null) : null,
            modes: Array.isArray(createdData.modes) ? createdData.modes : [],
            reason: (createdData as any).reason ?? null,
            notes: (createdData as any).notes ?? null,
          };
          setSchedules((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
          toast({ title: "Updated", description: "Schedule updated" });
          setIsEditing(false);
          setEditingId(null);
          setOpenCreate(false);
        } catch (err: any) {
          console.error('Failed to update schedule via backend API:', err);
          toast({ title: "Error", description: String(err?.message || 'Failed to update schedule'), variant: "destructive" });
        }
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const ensureTimeHasSeconds = (t?: string | null) => {
    if (!t) return null;
    const parts = String(t).split(":");
    if (parts.length === 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
    if (parts.length === 3) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
    return String(t);
  };

  const timeToSeconds = (t?: string | null) => {
    if (!t) return NaN;
    const parts = String(t).split(":").map((p) => Number(p));
    const h = Number.isFinite(parts[0]) ? parts[0] : 0;
    const m = Number.isFinite(parts[1]) ? parts[1] : 0;
    const s = Number.isFinite(parts[2]) ? parts[2] : 0;
    return h * 3600 + m * 60 + s;
  };

  const modeMap: Record<string, string> = {
    online: "online",
    face_to_face: "face_to_face",
    hybrid: "hybrid",
  };

  // Human-friendly labels for display
  const modeLabelMap: Record<string, string> = {
    online: "Online",
    face_to_face: "Face to Face",
    hybrid: "Hybrid",
  };

  const handleCreate = async () => {
    // basic validation
    if (!startTime || !endTime) {
      toast({ title: "Validation", description: "Start and end times are required", variant: "destructive" });
      return;
    }

    // ensure start < end (numeric where possible)
    if (Number.isFinite(timeToSeconds(startTime)) && Number.isFinite(timeToSeconds(endTime))) {
      if (timeToSeconds(startTime) >= timeToSeconds(endTime)) {
        toast({ title: "Validation", description: "Start time must be before end time", variant: "destructive" });
        return;
      }
    } else {
      if (startTime >= endTime) {
        toast({ title: "Validation", description: "Start time must be before end time", variant: "destructive" });
        return;
      }
    }

    if (formType === "special" && !date) {
      toast({ title: "Validation", description: "Date is required for special schedules", variant: "destructive" });
      return;
    }

    setSubmitLoading(true);
    try {
        const payload: Record<string, any> = {
          type: formType,
          start_time: ensureTimeHasSeconds(startTime) ?? startTime,
          end_time: ensureTimeHasSeconds(endTime) ?? endTime,
          location: location || null,
          modes: selectedMode ? [modeMap[selectedMode] ?? selectedMode] : [],
        };

        if (formType === "normal") {
          payload.day_of_week = dayOfWeek;
        } else {
          payload.date = date;
          payload.reason = reason || null;
          payload.notes = notes || null;
        }

        // Prefer same-origin proxy so server can resolve current user via cookie
        const isBrowser = typeof window !== 'undefined';
        if (!classId) throw new Error('Class id missing');

        if (isBrowser) {
          const url = `/api/classes/mine/${encodeURIComponent(String(classId))}/schedules`;
          try {
            const res = await import("@/lib/api/fetchClient").then(m => m.fetchRawWithAuth(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
            const bodyText = await res.text().catch(() => "");
            if (!res.ok) {
              // Try to show backend validation message
              throw new Error(bodyText || res.statusText || `HTTP ${res.status}`);
            }
            const data = bodyText ? JSON.parse(bodyText) : null;
            // normalize and add to state
            const created: Schedule = {
              id: String(data.id),
              type: data.type,
              start_time: formatTimeForInput(data.start_time),
              end_time: formatTimeForInput(data.end_time),
              location: data.location ?? null,
              day_of_week: data.type === 'normal' ? (data.day_of_week ?? null) : null,
              date: data.type === 'special' ? (data.date ?? null) : null,
              modes: Array.isArray(data.modes) ? data.modes : [],
              reason: data.reason ?? null,
              notes: data.notes ?? null,
            };
            setSchedules((s) => [created, ...s]);
            toast({ title: "Created", description: "Schedule added" });
            setOpenCreate(false);
            setStartTime("");
            setEndTime("");
            setLocation("");
            setSelectedMode("");
            setReason("");
            setNotes("");
          } catch (err: any) {
            console.error('Failed to create schedule via proxy:', err);
            toast({ title: "Error", description: String(err?.message || 'Failed to create schedule'), variant: "destructive" });
          }
        } else {
          // Server/SSR fallback: call schedulesAPI which posts to backend URL
          try {
            const createdData = await schedulesAPI.createScheduleForClass(Number(classId), payload);
            const created: Schedule = {
              id: String(createdData.id),
              type: createdData.type,
              start_time: formatTimeForInput(createdData.start_time),
              end_time: formatTimeForInput(createdData.end_time),
              location: createdData.location ?? null,
              day_of_week: createdData.type === 'normal' ? (createdData.day_of_week ?? null) : null,
              date: createdData.type === 'special' ? (createdData.date ?? null) : null,
              modes: Array.isArray(createdData.modes) ? createdData.modes : [],
              reason: (createdData as any).reason ?? null,
              notes: (createdData as any).notes ?? null,
            };
            setSchedules((s) => [created, ...s]);
            toast({ title: "Created", description: "Schedule added" });
            setOpenCreate(false);
            setStartTime("");
            setEndTime("");
            setLocation("");
            setSelectedMode("");
            setReason("");
            setNotes("");
          } catch (err: any) {
            console.error('Failed to create schedule via backend API:', err);
            toast({ title: "Error", description: String(err?.message || 'Failed to create schedule'), variant: "destructive" });
          }
        }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Deletion is handled by `DeleteScheduleDialog` which will call `onDeleted`

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Schedules</h3>
        <div>
          <Button size="sm" variant="outline" disabled={!classId} onClick={() => setOpenCreate((v) => !v)}>
            Add Schedule
          </Button>
        </div>
      </div>

      {openCreate ? (
        <div className="p-4 border rounded mb-4 bg-white/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-2">
              <Button variant={formType === "normal" ? "default" : "outline"} size="sm" onClick={() => setFormType("normal")}>Normal</Button>
              <Button variant={formType === "special" ? "default" : "outline"} size="sm" onClick={() => setFormType("special")}>Special</Button>
            </div>
          </div>

          {editLoading ? (
            <div className="py-6">Loading schedule…</div>
          ) : formType === "normal" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label>Day of week</Label>
                <select className="w-full mt-1 p-2 border rounded" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
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
              <div>
                <Label>Mode</Label>
                <select className="w-full mt-1 p-2 border rounded" value={selectedMode} onChange={(e) => setSelectedMode(e.target.value)}>
                  <option value="">(Select mode)</option>
                  <option value="online">Online</option>
                  <option value="face_to_face">Face to face</option>
                  <option value="hybrid">Hybrid</option>
                </select>
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
              <div>
                <Label>Mode</Label>
                <select className="w-full mt-1 p-2 border rounded" value={selectedMode} onChange={(e) => setSelectedMode(e.target.value)}>
                  <option value="">(Select mode)</option>
                  <option value="online">Online</option>
                  <option value="face_to_face">Face to face</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          )}

            <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setOpenCreate(false); setIsEditing(false); setEditingId(null); }}>Cancel</Button>
            <Button disabled={submitLoading} onClick={isEditing ? handleSave : handleCreate}>{isEditing ? (submitLoading ? "Saving..." : "Save") : (submitLoading ? "Creating..." : "Create")}</Button>
          </div>
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
                <li key={s.id} className="p-3 border rounded-md bg-white/50 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{s.type === 'normal' ? s.day_of_week : s.date}</div>
                    <div className="text-xs text-muted-foreground">{s.start_time} — {s.end_time}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">{s.modes && s.modes.length ? s.modes.map((m) => modeLabelMap[m] ?? String(m)).join(", ") : "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button title="Edit" className="p-1 rounded hover:bg-gray-100" onClick={() => handleStartEdit(s)} disabled={deletingIds.includes(s.id)}>
                      <IconPencil size={16} />
                    </button>
                    <button title="Delete" className="p-1 rounded hover:bg-gray-100 text-rose-600" onClick={() => { setScheduleToDelete(s); setDeleteDialogOpen(true); }} disabled={deletingIds.includes(s.id)}>
                      <IconTrash size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <DeleteScheduleDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} classId={classId} schedule={scheduleToDelete ? { id: Number(scheduleToDelete.id), type: scheduleToDelete.type, start_time: scheduleToDelete.start_time, end_time: scheduleToDelete.end_time, location: scheduleToDelete.location ?? null } : null} onDeleted={(id) => {
        setSchedules((prev) => prev.filter((p) => p.id !== String(id)));
        setScheduleToDelete(null);
      }} />
    </div>
  );
}

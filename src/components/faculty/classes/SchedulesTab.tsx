"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { classId?: number | null };

type Schedule = {
  id: string;
  type: "normal" | "special";
  start_time: string;
  end_time: string;
  location?: string | null;
  day_of_week?: string;
  date?: string;
};

export default function SchedulesTab({ classId }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [formType, setFormType] = useState<"normal" | "special">("normal");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      if (!classId) {
        setSchedules([]);
      } else {
        setSchedules([
          { id: `${classId}-sch-1`, type: "normal", day_of_week: "Monday", start_time: "09:00", end_time: "10:30", location: "Room 201" },
          { id: `${classId}-sch-2`, type: "normal", day_of_week: "Wednesday", start_time: "09:00", end_time: "10:30", location: "Room 201" },
        ]);
      }
      setIsLoading(false);
    }, 250);
  }, [classId]);

  const handleCreate = () => {
    if (!startTime || !endTime) return;
    const payload: Schedule = {
      id: `local-${Date.now()}`,
      type: formType,
      start_time: startTime,
      end_time: endTime,
      location: location || null,
      day_of_week: formType === "normal" ? dayOfWeek : undefined,
      date: formType === "special" ? date : undefined,
    };
    setSchedules((s) => [payload, ...s]);
    setOpenCreate(false);
    setStartTime("");
    setEndTime("");
    setLocation("");
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete schedule?")) return;
    setSchedules((s) => s.filter((x) => x.id !== id));
  };

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

          {formType === "normal" ? (
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
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
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
                    <div className="text-xs text-muted-foreground">{s.start_time} — {s.end_time} • {s.location ?? 'No location'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

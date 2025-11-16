"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { holidaysAPI, Holiday } from "@/lib/api/holidays";
import CalendarView from "./CalendarView";
import HolidayList from "./HolidayList";
import AddHolidayDialog from "./AddHolidayDialog";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const TIMEZONE = "Asia/Manila";

function formatDateISO(d: Date, timeZone: string = TIMEZONE) {
  const fmt = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = fmt.formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${day}`;
}

export default function HolidaysManagement() {
  // Initialize current month and selected date using Asia/Manila local date
  function manilaTodayParts() {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
    const parts = fmt.formatToParts(now);
    const y = Number(parts.find((p) => p.type === "year")?.value ?? now.getFullYear());
    const m = Number(parts.find((p) => p.type === "month")?.value ?? (now.getMonth() + 1));
    const d = Number(parts.find((p) => p.type === "day")?.value ?? now.getDate());
    return { y, m, d };
  }

  const { y: _y, m: _m, d: _d } = manilaTodayParts();
  const [currentMonth, setCurrentMonth] = useState(() => new Date(_y, _m - 1, 1));
  const [selectedStart, setSelectedStart] = useState<Date | null>(() => new Date(_y, _m - 1, _d));
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [orgs, setOrgs] = useState<Array<{ id: number; name: string; type?: string | null }>>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]); // empty = all

  // fetch holidays for the visible month range (and a small buffer)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const start = formatDateISO(startOfMonth(currentMonth));
        const end = formatDateISO(endOfMonth(currentMonth));
        const data = await holidaysAPI.listHolidays(start, end);
        if (cancelled) return;
        setHolidays(data || []);
      } catch (e) {
        console.error('Failed to load holidays', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [currentMonth]);

  // fetch upcoming holidays starting from Manila 'today'
  async function fetchUpcoming() {
    setUpcomingLoading(true);
    try {
      const todayISO = formatDateISO(new Date());
      const orgParam = (selectedOrgs && selectedOrgs.length > 0) ? selectedOrgs.map((s) => Number(s)) : undefined;
      const data = await holidaysAPI.listHolidays(todayISO, undefined, orgParam as any);
      setUpcomingHolidays(data || []);
    } catch (e) {
      console.error('Failed to load upcoming holidays', e);
      setUpcomingHolidays([]);
    } finally {
      setUpcomingLoading(false);
    }
  }

  useEffect(() => {
    fetchUpcoming();
  }, []);

  // auto-refresh upcoming holidays when organization filter changes
  useEffect(() => {
    fetchUpcoming();
  }, [selectedOrgs]);

  // load organizations for filter
  useEffect(() => {
    let cancelled = false;
    async function loadOrgs() {
      setOrgsLoading(true);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";
        const url = `${API_BASE_URL}/organizations/options/organizations`;
        const res = await fetch(url, { method: 'GET', credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setOrgs(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load orgs', e);
      } finally {
        if (!cancelled) setOrgsLoading(false);
      }
    }
    loadOrgs();
    return () => { cancelled = true; };
  }, []);

  // find holidays that overlap the selected range (or the clicked day)
  const visibleHolidays = useMemo(() => {
    if (!selectedStart && !selectedEnd) return [];
    const s = selectedStart ? new Date(formatDateISO(selectedStart)) : null;
    const e = selectedEnd ? new Date(formatDateISO(selectedEnd)) : s;
    if (!s || !e) return [];
    return holidays.filter((h) => {
      const hs = new Date(h.start_date);
      const he = h.end_date ? new Date(h.end_date) : hs;
      return !(he.getTime() < s.getTime() || hs.getTime() > e.getTime());
    });
  }, [selectedStart, selectedEnd, holidays]);

  function formatLongDate(d: Date) {
    return new Intl.DateTimeFormat('en', { timeZone: TIMEZONE, month: 'long', day: 'numeric', year: 'numeric' }).format(d);
  }

  function inclusiveDayCount(a: Date, b?: Date | null) {
    if (!a) return 0;
    const start = new Date(formatDateISO(a));
    const end = b ? new Date(formatDateISO(b)) : start;
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.round((end.getTime() - start.getTime()) / msPerDay);
    return diff >= 0 ? diff + 1 : 0;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Calendar</CardTitle>
              <div className="text-sm text-muted-foreground">Click a day to select, click another to make a range.</div>
            </CardHeader>
            <CardContent>
              <CalendarView
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                selectedStart={selectedStart}
                selectedEnd={selectedEnd}
                onDayClick={(d) => {
                  // reuse earlier selection logic (start then end)
                  if (!selectedStart || (selectedStart && selectedEnd)) {
                    setSelectedStart(d);
                    setSelectedEnd(null);
                    return;
                  }
                  if (selectedStart && !selectedEnd) {
                    if (d.getTime() < selectedStart.getTime()) {
                      setSelectedStart(d);
                      setSelectedEnd(selectedStart);
                    } else {
                      setSelectedEnd(d);
                    }
                  }
                }}
                holidays={holidays}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Selected holidays / cancellations</CardTitle>
              <div>
                <Button onClick={() => setAddOpen(true)}>Add Holiday</Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedStart ? (
                <div className="mb-3 text-sm">Selected: {formatLongDate(selectedStart)}{selectedEnd ? ` → ${formatLongDate(selectedEnd)}` : ''} <span className="text-muted-foreground">({inclusiveDayCount(selectedStart, selectedEnd)} {inclusiveDayCount(selectedStart, selectedEnd) === 1 ? 'day' : 'days'})</span></div>
              ) : (
                <div className="mb-3 text-sm">Pick a day or range to see holidays.</div>
              )}

              <div className="mb-2 text-sm text-muted-foreground">{visibleHolidays.length} {visibleHolidays.length === 1 ? 'holiday' : 'holidays'} found</div>
              <HolidayList holidays={visibleHolidays} loading={loading} onUpdated={() => {
                // refresh current month and upcoming after edit
                setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth(), 1));
                fetchUpcoming();
              }} />
            </CardContent>
          </Card>
        </div>
      </div>

      <AddHolidayDialog open={addOpen} onOpenChange={setAddOpen} onAdded={() => {
        // trigger re-fetch for the current month and upcoming list
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth(), 1));
        fetchUpcoming();
      }} />

      <div className="mt-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Upcoming holidays</CardTitle>
              <div className="text-sm text-muted-foreground">{upcomingHolidays.length} {upcomingHolidays.length === 1 ? 'holiday' : 'holidays'}</div>
            </div>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    {selectedOrgs.length === 0 ? (orgsLoading ? 'Loading orgs...' : 'All organizations') : `${selectedOrgs.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Organizations</div>
                      <button className="text-sm text-muted-foreground" onClick={() => setSelectedOrgs([])} aria-label="Clear selection">Clear</button>
                    </div>
                    <div className="max-h-56 overflow-auto">
                      {orgs.filter(o => String(o?.type ?? '').toLowerCase() === 'academic').map(o => {
                        const id = String(o.id);
                        const checked = selectedOrgs.includes(id);
                        return (
                          <label key={o.id} className="flex items-center gap-2 p-1">
                            <input type="checkbox" checked={checked} onChange={(e) => {
                              if (e.target.checked) setSelectedOrgs((prev) => Array.from(new Set([...prev, id])));
                              else setSelectedOrgs((prev) => prev.filter(x => x !== id));
                            }} />
                            <span className="text-sm">{o.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="ghost" size="icon" onClick={() => fetchUpcoming()} aria-label="Refresh upcoming holidays" disabled={upcomingLoading} aria-busy={upcomingLoading} title={upcomingLoading ? 'Refreshing…' : 'Refresh upcoming holidays'}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${upcomingLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 11-9.9-1H5.1a7 7 0 1013.8 1c0-3.87-3.13-7-7-7z" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <HolidayList holidays={upcomingHolidays} loading={upcomingLoading} onUpdated={() => fetchUpcoming()} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

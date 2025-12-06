"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Holiday } from "@/lib/api/holidays";

type Props = {
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onDayClick: (d: Date) => void;
  holidays: Holiday[];
};

const TIMEZONE = "Asia/Manila";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function formatDateISO(d: Date, timeZone: string = TIMEZONE) {
  const fmt = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = fmt.formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${day}`;
}

export default function CalendarView({ currentMonth, onMonthChange, selectedStart, selectedEnd, onDayClick, holidays }: Props) {
  const monthMatrix = useMemo(() => {
    const first = startOfMonth(currentMonth);
    const last = endOfMonth(currentMonth);
    const startWeekday = first.getDay();
    const days: Date[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(new Date(first.getFullYear(), first.getMonth(), i - startWeekday + 1));
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(first.getFullYear(), first.getMonth(), d));
    while (days.length % 7 !== 0) {
      const lastDay = days[days.length - 1];
      days.push(new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1));
    }
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [currentMonth]);

  function inSelectionRange(d: Date) {
    if (!selectedStart) return false;
    if (!selectedEnd) return formatDateISO(d) === formatDateISO(selectedStart);
    const dayISO = formatDateISO(d);
    const sISO = formatDateISO(selectedStart);
    const eISO = formatDateISO(selectedEnd);
    return dayISO >= sISO && dayISO <= eISO;
  }

  function dayHasHoliday(day: Date) {
    const dayISO = formatDateISO(day);
    return holidays.some(h => {
      const hsISO = h.start_date;
      const heISO = h.end_date ?? h.start_date;
      return dayISO >= hsISO && dayISO <= heISO;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">{new Intl.DateTimeFormat('en', { timeZone: TIMEZONE, month: 'long', year: 'numeric' }).format(currentMonth)}</div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>Prev</Button>
          <Button variant="ghost" size="sm" onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>Next</Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-xs text-muted-foreground">{d}</div>
        ))}

        {monthMatrix.map((week, wi) => (
          <React.Fragment key={wi}>
            {week.map(day => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const selected = inSelectionRange(day);
              const hasHoliday = dayHasHoliday(day);
              return (
                <button key={day.toDateString()} onClick={() => onDayClick(day)}
                  className={`p-2 rounded-lg focus:outline-none w-full h-full flex flex-col items-center justify-center transition-colors ${isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'opacity-40'} ${selected ? 'bg-sky-100 ring-1 ring-sky-300' : ''}`}>
                  <div className="text-sm font-semibold">{day.getDate()}</div>
                  {hasHoliday && <div className="text-xxs text-amber-700 mt-1">●</div>}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

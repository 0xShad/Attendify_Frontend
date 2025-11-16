"use client";

import React from "react";
import { Holiday } from "@/lib/api/holidays";

const TIMEZONE = "Asia/Manila";

function formatPretty(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en', { timeZone: TIMEZONE, month: 'long', day: 'numeric', year: 'numeric' }).format(d);
  } catch (e) {
    return iso;
  }
}

function inclusiveDaysCount(startIso: string, endIso?: string | null) {
  try {
    const s = new Date(startIso);
    const e = endIso ? new Date(endIso) : s;
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.round((e.getTime() - s.getTime()) / msPerDay);
    return diff >= 0 ? diff + 1 : 0;
  } catch (e) {
    return 0;
  }
}

import EditHolidayDialog from "./EditHolidayDialog";
import DeleteHolidayDialog from "./DeleteHolidayDialog";
import { Button } from "@/components/ui/button";

export default function HolidayCard({ holiday, onUpdated }: { holiday: Holiday; onUpdated?: (h: Holiday) => void }) {
  const [open, setOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  async function handleDelete() {
    try {
      const { deleteHoliday } = await import("@/lib/api/holidays");
      await deleteHoliday(holiday.id);
      // notify parent to refresh
      onUpdated?.(holiday as any);
    } catch (e) {
      console.error('Failed to delete holiday', e);
      // optionally show toast in future
    }
  }
  return (
    <div className="p-3 border rounded-lg shadow-sm bg-white">
      {/* Row 1: name (left) / annually (right) */}
      <div className="flex items-center justify-between">
        <div className="font-medium">{holiday.name}</div>
        <div className="text-sm text-muted-foreground">
          {holiday.is_recurring ? 'Annually' : <span className="invisible">Annually</span>}
        </div>
      </div>

      {/* Row 2: date/range (left) / edit button (right) */}
      <div className="flex items-start justify-between mt-2">
        <div className="text-sm text-muted-foreground">
          {formatPretty(holiday.start_date)}
          {holiday.end_date ? (
            <>
              {` → ${formatPretty(holiday.end_date)}`} <span className="text-muted-foreground">({inclusiveDaysCount(holiday.start_date, holiday.end_date)} {inclusiveDaysCount(holiday.start_date, holiday.end_date) === 1 ? 'day' : 'days'})</span>
            </>
          ) : null}
        </div>
        <div>
          <Button size="icon" variant="ghost" aria-label="Edit holiday" onClick={() => setOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M17.414 2.586a2 2 0 0 0-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 0 0 0-2.828z" />
              <path d="M3 17a1 1 0 0 0 1 1h12a1 1 0 1 0 0-2H4a1 1 0 0 0-1 1z" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Row 3: notes (left) / delete button (right) */}
      <div className="flex items-start justify-between mt-2">
        <div className="text-sm mt-0 text-slate-700">
          {holiday.notes ? holiday.notes : <span className="invisible">no notes</span>}
        </div>
        <div>
          <Button size="icon" variant="ghost" aria-label="Delete holiday" onClick={() => setDeleteOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M9 3v1H4v2h16V4h-5V3H9z" />
              <path d="M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z" />
            </svg>
          </Button>
        </div>
      </div>

      <EditHolidayDialog open={open} onOpenChange={setOpen} holiday={holiday} onUpdated={(h) => { onUpdated?.(h); setOpen(false); }} />
      <DeleteHolidayDialog open={deleteOpen} onOpenChange={setDeleteOpen} holiday={holiday} onConfirm={async () => { await handleDelete(); setDeleteOpen(false); }} />
    </div>
  );
}

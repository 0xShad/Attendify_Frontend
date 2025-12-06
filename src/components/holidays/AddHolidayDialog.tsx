"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { holidaysAPI } from "@/lib/api/holidays";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded?: (created: any) => void;
};

export default function AddHolidayDialog({ open, onOpenChange, onAdded }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Array<{ id: number; name: string; type?: string | null }>>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState("");

  function reset() {
    setOrganizationId(null);
    setName("");
    setStartDate("");
    setEndDate("");
    setIsRecurring(false);
    setNotes("");
    setLoading(false);
  }

  React.useEffect(() => {
    let cancelled = false;
    async function loadOrgs() {
      setOrgsLoading(true);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";
        const url = `${API_BASE_URL}/organizations/options/organizations`;
        const res = await fetch(url, { method: "GET", credentials: "include" });
        if (!res.ok) {
          console.warn("Failed to fetch organizations", res.status);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setOrgs(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load organizations", e);
      } finally {
        if (!cancelled) setOrgsLoading(false);
      }
    }
    loadOrgs();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    if (!name.trim()) return toast({ title: "Validation", description: "Name is required", variant: "destructive" });
    if (!startDate) return toast({ title: "Validation", description: "Start date is required", variant: "destructive" });
    if (endDate && endDate < startDate) return toast({ title: "Validation", description: "End date cannot be before start date", variant: "destructive" });

    setLoading(true);
    try {
      const payload = {
        organization_id: organizationId && organizationId !== "__global" ? Number(organizationId) : null,
        name: name.trim(),
        start_date: startDate,
        end_date: endDate || null,
        is_recurring: Boolean(isRecurring),
        notes: notes || null,
      };
      const created = await holidaysAPI.createHoliday(payload as any);
      toast({ title: "Created", description: `${created.name} created` });
      onAdded?.(created);
      onOpenChange(false);
      reset();
    } catch (err: any) {
      console.error("Failed to create holiday", err);
      toast({ title: "Error", description: String(err?.message || err || "Failed to create holiday"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Holiday</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label>Organization (optional)</Label>
            <Select value={organizationId ?? ""} onValueChange={(v) => setOrganizationId(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder={orgsLoading ? "Loading organizations..." : "Select organization (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__global">Global / All</SelectItem>
                {orgs
                  .filter((o) => {
                    const t = o?.type;
                    return String(t ?? "").toLowerCase() === "academic";
                  })
                  .map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Name</Label>
            <Input placeholder="Holiday name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End date (optional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input id="recurring" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
            <label htmlFor="recurring" className="text-sm">Recurring annually</label>
          </div>

          <div>
            <Label>Notes</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-md p-2 mt-1" rows={3} />
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }}>Cancel</Button>
            <Button onClick={submit} disabled={loading}>{loading ? 'Creating…' : 'Create'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

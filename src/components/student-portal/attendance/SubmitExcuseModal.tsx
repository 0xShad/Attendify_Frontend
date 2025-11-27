"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createExcusalRequest } from "@/lib/api/attendance";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit?: (data: any) => void; // optional callback for real submissions
};

export default function SubmitExcuseModal({ open, onOpenChange, onSubmit }: Props) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    class_id: '',
    excusal_type: 'late',
    session_id: '',
    requested_date: '',
    requested_start_time: '',
    requested_end_time: '',
    reason: '',
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setForm({ class_id: '', excusal_type: 'late', session_id: '', requested_date: '', requested_start_time: '', requested_end_time: '', reason: '' });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic client-side validation mirroring server rules
    if (!form.class_id || String(form.class_id).trim() === '') {
      toast({ title: 'Validation', description: 'Class ID is required.', variant: 'destructive' });
      return;
    }
    const excusalType = String(form.excusal_type || '').toLowerCase();
    if (!['early', 'late', 'absence'].includes(excusalType)) {
      toast({ title: 'Validation', description: 'Invalid excusal type.', variant: 'destructive' });
      return;
    }
    if (!form.session_id && !form.requested_date) {
      toast({ title: 'Validation', description: 'Either session ID or requested date is required.', variant: 'destructive' });
      return;
    }

    const payload: any = {
      class_id: Number(form.class_id),
      excusal_type: excusalType,
    };
    if (form.session_id) payload.session_id = Number(form.session_id);
    if (form.requested_date) payload.requested_date = form.requested_date;
    if (form.requested_start_time) payload.requested_start_time = form.requested_start_time;
    if (form.requested_end_time) payload.requested_end_time = form.requested_end_time;
    if (form.reason) payload.reason = form.reason;

    setSubmitting(true);
    try {
      const res = await createExcusalRequest(payload);
      toast({ title: 'Excusal submitted', description: `Request created (id: ${res?.id ?? 'unknown'})` });
      if (typeof onSubmit === 'function') {
        try { onSubmit(res); } catch (e) { console.warn('onSubmit callback failed', e); }
      }
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.message ?? (err?.body && typeof err.body === 'string' ? err.body : String(err));
      toast({ title: 'Submission failed', description: String(msg), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit an Excuse (placeholder)</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div>
            <label className="block text-sm font-medium">Class ID</label>
            <input value={form.class_id} onChange={(e) => setForm(s => ({ ...s, class_id: e.target.value }))} className="w-full border rounded px-2 py-1 bg-transparent" placeholder="Enter class id (int)" />
          </div>

          <div>
            <label className="block text-sm font-medium">Excusal Type</label>
            <select value={form.excusal_type} onChange={(e) => setForm(s => ({ ...s, excusal_type: e.target.value }))} className="w-full border rounded px-2 py-1 bg-transparent">
              <option value="early">Early</option>
              <option value="late">Late</option>
              <option value="absence">Absence</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium">Session ID (optional)</label>
              <input value={form.session_id} onChange={(e) => setForm(s => ({ ...s, session_id: e.target.value }))} className="w-full border rounded px-2 py-1 bg-transparent" placeholder="Optional session id" />
            </div>
            <div>
              <label className="block text-sm font-medium">Requested date</label>
              <input type="date" value={form.requested_date} onChange={(e) => setForm(s => ({ ...s, requested_date: e.target.value }))} className="w-full border rounded px-2 py-1 bg-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium">Start time</label>
              <input type="time" value={form.requested_start_time} onChange={(e) => setForm(s => ({ ...s, requested_start_time: e.target.value }))} className="w-full border rounded px-2 py-1 bg-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium">End time</label>
              <input type="time" value={form.requested_end_time} onChange={(e) => setForm(s => ({ ...s, requested_end_time: e.target.value }))} className="w-full border rounded px-2 py-1 bg-transparent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Reason</label>
            <textarea value={form.reason} onChange={(e) => setForm(s => ({ ...s, reason: e.target.value }))} rows={4} className="w-full border rounded px-2 py-1 bg-transparent" placeholder="Optional reason" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
            <Button type="submit">Submit (placeholder)</Button>
          </div>
        </form>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}

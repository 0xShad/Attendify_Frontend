"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createExcusalRequest } from "@/lib/api/attendance";
import { checkAuth } from "@/lib/clientAuth";
import type { } from "@/lib/api/classes";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit?: (data: any) => void; // optional callback for real submissions
};

export default function SubmitExcuseModal({ open, onOpenChange, onSubmit }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [form, setForm] = React.useState({
    class_id: '',
    requested_date: '',
    reason: '',
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [classOptions, setClassOptions] = React.useState<any[] | null>(null);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [optionsError, setOptionsError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ requested_date?: string | null } | null>(null);

  React.useEffect(() => {
    if (!open) {
      setForm({ class_id: '', requested_date: '', reason: '' });
      setFieldErrors(null);
    }
  }, [open]);

  // Load class options when the modal opens
  React.useEffect(() => {
    let mounted = true;
    if (!open) return;
    setLoadingOptions(true);
    setOptionsError(null);
    setClassOptions(null);
    (async () => {
      try {
        const mod = await import('@/lib/api/classes');
        const data = await (mod.listMyClassOptions ? mod.listMyClassOptions() : []);
        if (!mounted) return;
        setClassOptions(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (!mounted) return;
        setOptionsError(err?.message ? String(err.message) : String(err));
      } finally {
        if (!mounted) return;
        setLoadingOptions(false);
      }
    })();

    return () => { mounted = false; };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // New backend flow: only class_id, requested_date, reason are sent.
    if (!form.class_id || String(form.class_id).trim() === '') {
      toast({ title: 'Validation', description: 'Class ID is required.', variant: 'destructive' });
      return;
    }
    if (!form.requested_date || String(form.requested_date).trim() === '') {
      setFieldErrors({ requested_date: 'Requested date is required.' });
      toast({ title: 'Validation', description: 'Requested date is required.', variant: 'destructive' });
      return;
    }

    // Verify session before submitting excuse request
    try {
      const ok = await checkAuth();
      if (!ok) {
        const redirectTo = encodeURIComponent(window.location.pathname || '/');
        router.push(`/auth/login?redirect=${redirectTo}`);
        return;
      }
    } catch (err) {
      const redirectTo = encodeURIComponent(window.location.pathname || '/');
      router.push(`/auth/login?redirect=${redirectTo}`);
      return;
    }

    setSubmitting(true);
    try {
      // Compute excusal_type to satisfy current backend validation (server may still expect it)
      const manilaNow = new Date();
      // Format date in YYYY-MM-DD using Manila timezone
      const manilaYmd = new Intl.DateTimeFormat('sv', { timeZone: 'Asia/Manila', hour12: false }).format(manilaNow).split(' ')[0];
      const excusal_type = manilaYmd >= String(form.requested_date) ? 'late' : 'early';

      const payload = {
        class_id: Number(form.class_id),
        requested_date: form.requested_date,
        reason: form.reason || undefined,
        // include excusal_type to match backend validation (safe and idempotent)
        excusal_type,
      } as any;

      console.debug('[SubmitExcuseModal] excusal payload ->', payload);
      const res = await createExcusalRequest(payload);

      // Expecting ExcusalRequestOut
      // Friendly success message for users
      toast({ title: 'Request submitted', description: 'Request has been successfully submitted.' });

      if (typeof onSubmit === 'function') {
        try { onSubmit(res); } catch (e) { console.warn('onSubmit callback failed', e); }
      }
      onOpenChange(false);
    } catch (err: any) {
      // fetchWithAuth attaches status and body when throwing
      const status = err?.status;
      let msg = err?.message ?? String(err);
      if (err?.body) {
        if (typeof err.body === 'string') msg = err.body;
        else if (err.body?.message) msg = err.body.message;
      }

      // Try to parse validation details from FastAPI/Pydantic style errors
      try {
        const body = err?.body;
        if (body && Array.isArray(body.detail)) {
          const details = body.detail as any[];
          const newFieldErrors: any = {};
          for (const d of details) {
            const loc = Array.isArray(d.loc) ? d.loc : [];
            const field = loc.length >= 2 && loc[0] === 'body' ? loc[1] : null;
            const message = d.msg || d.message || String(d);
            if (field) newFieldErrors[field] = message;
          }
          if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors((prev) => ({ ...prev, ...newFieldErrors }));
          }
        }
      } catch (e) {
        // ignore parse errors
      }

      // Special-case: backend returns a 400/422 when no schedule exists for date
      if ((status === 400 || status === 422) && String(msg).includes('No schedule exists for the selected date for this class')) {
        setFieldErrors({ requested_date: 'No schedule exists for the selected date for this class' });
        toast({ title: 'Validation', description: 'No schedule exists for the selected date for this class', variant: 'destructive' });
      } else if (status === 400 || status === 422) {
        toast({ title: 'Validation error', description: String(msg), variant: 'destructive' });
      } else if (status === 401) {
        toast({ title: 'Unauthorized', description: 'You must be signed in to submit an excusal.', variant: 'destructive' });
      } else if (status === 404) {
        toast({ title: 'Not found', description: String(msg), variant: 'destructive' });
      } else {
        toast({ title: 'Submission failed', description: String(msg), variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit an Excuse</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div>
            <label className="block text-sm font-medium">Class</label>
            <div>
              <select
                value={form.class_id}
                onChange={(e) => setForm(s => ({ ...s, class_id: e.target.value }))}
                className="w-full border rounded px-2 py-1 bg-transparent"
                disabled={loadingOptions || !!optionsError}
              >
                <option value="">{loadingOptions ? 'Loading classes…' : optionsError ? 'Error loading classes' : 'Select a class'}</option>
                {Array.isArray(classOptions) && classOptions.map((opt: any) => {
                  const id = opt.id ?? opt.class_id ?? '';
                  const code = opt.class_code ?? '';
                  const name = opt.course_name ?? '';
                  const label = code && name ? `${code} - ${name}` : (code || name || `Class ${id}`);
                  return (
                    <option key={String(id)} value={String(id)}>{label}</option>
                  );
                })}
              </select>
            </div>
            {optionsError ? <div className="text-sm text-red-600 mt-1">{optionsError}</div> : null}
          </div>

          <div>
            <label className="block text-sm font-medium">Requested date</label>
            <input type="date" value={form.requested_date} onChange={(e) => { setForm(s => ({ ...s, requested_date: e.target.value })); setFieldErrors(null); }} className="w-full border rounded px-2 py-1 bg-transparent" />
            {fieldErrors?.requested_date ? <div className="text-sm text-red-600 mt-1">{fieldErrors.requested_date}</div> : null}
          </div>

          <div>
            <label className="block text-sm font-medium">Reason</label>
            <textarea value={form.reason} onChange={(e) => setForm(s => ({ ...s, reason: e.target.value }))} rows={4} className="w-full border rounded px-2 py-1 bg-transparent" placeholder="Explain your reason" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} type="button" disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</Button>
          </div>
        </form>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}

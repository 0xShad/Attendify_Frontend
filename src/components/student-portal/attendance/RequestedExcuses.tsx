"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { listMyExcusalRequests } from "@/lib/api/attendance";
import ExcusalDetailDrawer from "./ExcusalDetailDrawer";
import CancelExcusalDialog from "./CancelExcusalDialog";

export default function RequestedExcuses() {
  const [classId, setClassId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [skip, setSkip] = React.useState(0);
  const [limit, setLimit] = React.useState(20);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<any[]>([]);
  const [classOptions, setClassOptions] = React.useState<Array<{ id: number; class_code?: string; course_name?: string }> | null>(null);
  const [viewItem, setViewItem] = React.useState<any | null>(null);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [cancelItem, setCancelItem] = React.useState<any | null>(null);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  // Load class options (best-effort) when component mounts so filter can show names
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('@/lib/api/classes');
        const data = await (mod.listMyClassOptions ? mod.listMyClassOptions() : []);
        if (!mounted) return;
        setClassOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        // ignore; options are convenience only
        setClassOptions([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fetchData = React.useCallback(async (overrides?: { classId?: string | null; status?: string | null; skip?: number; limit?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const useSkip = typeof overrides?.skip === 'number' ? overrides.skip : skip;
      const useLimit = typeof overrides?.limit === 'number' ? overrides.limit : limit;
      const useClassId = typeof overrides?.classId !== 'undefined' ? overrides?.classId : classId;
      const useStatus = typeof overrides?.status !== 'undefined' ? overrides?.status : status;

      const params: any = { skip: useSkip, limit: useLimit };
      if (useClassId) params.class_id = Number(useClassId);
      if (useStatus) params.status = useStatus;
      const res = await listMyExcusalRequests(params as any);
      setItems(res);
    } catch (err: any) {
      setError(err?.message ? String(err.message) : String(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [skip, limit, classId, status]);

  React.useEffect(() => {
    // initial load
    fetchData();
  }, []);

  const onPrev = React.useCallback(() => {
    const newSkip = Math.max(0, skip - limit);
    setSkip(newSkip);
    fetchData({ skip: newSkip });
  }, [skip, limit, fetchData]);

  const onNext = React.useCallback(() => {
    const newSkip = skip + limit;
    setSkip(newSkip);
    fetchData({ skip: newSkip });
  }, [skip, limit, fetchData]);

  const canPrev = skip > 0;
  const canNext = items.length === limit; // assume more if page is full

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
    } catch (e) { return iso; }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-medium">Requested Excuses</h2>
          <p className="text-muted-foreground text-sm">View excusal requests you&apos;ve submitted.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* search removed per request */}
          <Select onValueChange={(v) => {
            const newVal = v === 'ALL' ? null : v;
            setClassId(newVal);
            setSkip(0);
            fetchData({ classId: newVal, skip: 0 });
          }}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All classes</SelectItem>
              {Array.isArray(classOptions) && classOptions.map((c) => (
                <SelectItem key={String(c.id)} value={String(c.id)}>{(c.class_code ? `${c.class_code} — ` : '') + (c.course_name ?? `Class ${c.id}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => {
            const newVal = v === 'ANY' ? null : v;
            setStatus(newVal);
            setSkip(0);
            fetchData({ status: newVal, skip: 0 });
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {/* Apply removed: filters auto-apply on change */}
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="p-6 text-center text-sm">Loading…</div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <div className="mb-2 text-lg">No excusal requests yet</div>
            <div className="text-xs">Use the filters above to narrow results.</div>
          </div>
        ) : (
          items.map((it) => (
            <div key={String(it.id)} className="p-3 border rounded-lg shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium">{it.class_code ?? `Class ${it.class_id}`}</div>
                  {it.course_name ? <div className="text-xs text-muted-foreground">{it.course_name}</div> : null}
                  <div className="text-xs text-muted-foreground mt-2">Submitted: {fmtDate(it.submitted_at)}</div>
                  <div className="text-xs text-muted-foreground">Requested: {it.requested_date ?? '-'}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-medium">{String(it.excusal_type ?? '').charAt(0).toUpperCase() + String(it.excusal_type ?? '').slice(1)}</div>
                  <div className="mt-2">{
                    (() => {
                      const raw = String(it.status ?? '').toLowerCase();
                      const label = raw.length ? (raw.charAt(0).toUpperCase() + raw.slice(1)) : raw;
                      const className =
                        raw === 'approved'
                          ? 'border-green-200 text-green-700 bg-green-50'
                          : raw === 'pending'
                          ? 'border-yellow-200 text-yellow-800 bg-yellow-50'
                          : raw === 'denied' || raw === 'declined'
                          ? 'border-red-200 text-red-700 bg-red-50'
                          : raw === 'cancelled' || raw === 'canceled'
                          ? 'border-gray-200 text-gray-700 bg-gray-50'
                          : 'border-gray-200 text-gray-700 bg-gray-50';

                      return <Badge className={className}>{label}</Badge>;
                    })()
                  }</div>
                </div>
              </div>

              <div className="mt-3 text-sm text-foreground/90">{it.reason ?? '-'}</div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">Reviewed: {it.reviewed_at ? fmtDate(it.reviewed_at) : 'Not reviewed'}</div>
                <div className="flex items-center gap-2">
                  <Button title="View details" variant="ghost" size="sm" onClick={() => { setViewItem(it); setViewOpen(true); }} aria-label={`View request ${it.id}`}><Eye size={16} /></Button>
                  <Button title="Cancel request" variant="ghost" size="sm" onClick={() => { setCancelItem(it); setCancelOpen(true); }} aria-label={`Cancel request ${it.id}`}><X size={16} /></Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop / larger screens: table */}
      <div className="hidden sm:block overflow-auto rounded shadow-sm border">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left p-3 text-xs uppercase tracking-wide">Submitted</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide">Class</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide">Requested Date</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide">Type</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide">Reason</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide">Reviewed</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="bg-transparent"><td colSpan={8} className="p-8 text-center">Loading…</td></tr>
            ) : error ? (
              <tr className="bg-transparent"><td colSpan={8} className="p-8 text-center text-red-600">{error}</td></tr>
            ) : items.length === 0 ? (
              <tr className="bg-transparent">
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  <div className="mb-2 text-lg">No excusal requests yet</div>
                  <div className="text-xs">Use the filters above to narrow results.</div>
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={String(it.id)} className="hover:bg-muted/10">
                  <td className="p-3 align-top whitespace-nowrap text-sm">{fmtDate(it.submitted_at)}</td>
                  <td className="p-3 align-top">
                    <div className="font-medium">{it.class_code ?? `Class ${it.class_id}`}</div>
                    <div className="text-xs text-muted-foreground">{it.course_name ?? ''}</div>
                  </td>
                  <td className="p-3 align-top whitespace-nowrap">{it.requested_date ?? '-'}</td>
                  <td className="p-3 align-top whitespace-nowrap font-medium">{String(it.excusal_type ?? '').charAt(0).toUpperCase() + String(it.excusal_type ?? '').slice(1)}</td>
                  <td className="p-3 align-top whitespace-nowrap">
                    {
                      (() => {
                        const raw = String(it.status ?? '').toLowerCase();
                        const label = raw.length ? (raw.charAt(0).toUpperCase() + raw.slice(1)) : raw;
                        const className =
                          raw === 'approved'
                            ? 'border-green-200 text-green-700 bg-green-50'
                            : raw === 'pending'
                            ? 'border-yellow-200 text-yellow-800 bg-yellow-50'
                            : raw === 'denied' || raw === 'declined'
                            ? 'border-red-200 text-red-700 bg-red-50'
                            : raw === 'cancelled' || raw === 'canceled'
                            ? 'border-gray-200 text-gray-700 bg-gray-50'
                            : 'border-gray-200 text-gray-700 bg-gray-50';

                        return <Badge className={className}>{label}</Badge>;
                      })()
                    }
                  </td>
                  <td className="p-3 align-top">
                    <div className="max-w-lg line-clamp-3 text-sm text-foreground/90">{it.reason ?? '-'}</div>
                  </td>
                  <td className="p-3 align-top whitespace-nowrap text-sm">{it.reviewed_at ? fmtDate(it.reviewed_at) : <span className="text-destructive">Not reviewed yet.</span>}</td>
                  <td className="p-3 align-top">
                    <div className="flex items-center gap-2">
                      <Button title="View details" variant="ghost" size="sm" onClick={() => { setViewItem(it); setViewOpen(true); }} aria-label={`View request ${it.id}`}><Eye size={16} /></Button>
                      <Button title="Cancel request" variant="ghost" size="sm" onClick={() => { setCancelItem(it); setCancelOpen(true); }} aria-label={`Cancel request ${it.id}`}><X size={16} /></Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ExcusalDetailDrawer open={viewOpen} onOpenChange={(v) => { setViewOpen(v); if (!v) setViewItem(null); }} request={viewItem} />
      <CancelExcusalDialog open={cancelOpen} onOpenChange={(v) => { setCancelOpen(v); if (!v) setCancelItem(null); }} request={cancelItem} onConfirm={(id) => {
        // UI-only: mark item as cancelled locally
        setItems(prev => prev.map(it => (Number(it.id) === Number(id) ? { ...it, status: 'cancelled', reviewed_at: new Date().toISOString() } : it)));
      }} />

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={!canPrev || loading}>Previous</Button>
          <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext || loading}>Next</Button>
        </div>

        <div className="text-sm text-muted-foreground">Showing {items.length === 0 ? 0 : skip + 1}–{skip + items.length} (paginated)</div>
      </div>
    </div>
  );
}


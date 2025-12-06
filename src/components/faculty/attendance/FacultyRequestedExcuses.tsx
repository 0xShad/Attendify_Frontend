"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Eye } from 'lucide-react';
import resolveAvatarUrl from '@/lib/utils/resolveAvatarUrl';
import RequestedExcusalModal from '@/components/faculty/classes/RequestedExcusalModal';
import { listMyExcusalRequests } from '@/lib/api/attendance';
import { format as formatDate } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type ExcusalItem = {
  id: number;
  full_name?: string | null;
  avatar_url?: string | null;
  class_code?: string | null;
  course_name?: string | null;
  class_id?: number | null;
  requested_date?: string | null;
  excusal_type?: string | null;
  status?: string | null;
  submitted_at?: string | null;
  reason?: string | null;
  reviewed_at?: string | null;
};

function formatStatus(status?: string | null) {
  if (!status) return '—';
  const s = String(status).trim();
  if (!s) return '—';
  return s.replace(/[_-]+/g, ' ').split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function statusBadgeProps(status?: string | null): { variant?: 'secondary' | 'destructive' | 'default' | 'outline'; className?: string } {
  const s = String(status ?? '').trim().toLowerCase();
  if (!s) return { variant: 'default', className: 'border-gray-200 text-gray-700 bg-gray-50' };
  if (s === 'approved' || s === 'accept' || s === 'accepted') {
    return { variant: 'secondary', className: 'border-green-200 text-green-700 bg-green-50' };
  }
  if (s === 'cancelled' || s === 'canceled') {
    // Cancelled is neutral/gray
    return { variant: 'default', className: 'border-gray-200 text-gray-700 bg-gray-50' };
  }
  if (s === 'pending' || s === 'awaiting' || s === 'submitted') {
    return { variant: 'outline', className: 'border-yellow-200 text-yellow-700 bg-yellow-50' };
  }
  if (s === 'denied' || s === 'rejected' || s === 'declined') {
    return { variant: 'destructive', className: 'border-red-200 text-red-700 bg-red-50' };
  }
  // fallback neutral
  return { variant: 'default', className: 'border-gray-200 text-gray-700 bg-gray-50' };
}

export default function FacultyRequestedExcuses({ onView }: { onView?: (id: number) => void }) {
  const [items, setItems] = useState<ExcusalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await listMyExcusalRequests({ skip, limit });
        if (!mounted) return;
        setItems(Array.isArray(res) ? res as any as ExcusalItem[] : []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || String(err));
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [skip]);

  const handlePrev = () => setSkip(Math.max(0, skip - limit));
  const handleNext = () => setSkip(skip + limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requested Excuses</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading requested excuses…</div>
        ) : error ? (
          <div className="text-sm text-destructive">Error: {error}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No excusal requests found.</div>
        ) : (
          <div className="overflow-auto rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left p-3 text-xs uppercase tracking-wide">Submitted</th>
                  <th className="text-left p-3 text-xs uppercase tracking-wide">Student</th>
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
                {items.map((it) => {
                  const avatarSrc = resolveAvatarUrl(it.avatar_url) ?? undefined;
                  const initial = it.full_name && it.full_name.length > 0 ? it.full_name[0] : String(it.id).slice(-1);
                  return (
                  <tr key={String(it.id)} className="hover:bg-muted/10">
                    <td className="p-3 align-top whitespace-nowrap text-sm">{it.submitted_at ? formatDate(new Date(it.submitted_at), 'yyyy-MM-dd') : '-'}</td>
                    <td className="p-3 align-top">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8">
                          {avatarSrc ? <AvatarImage src={avatarSrc} alt={it.full_name ?? `Requester ${it.id}`} /> : <AvatarFallback>{initial}</AvatarFallback>}
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{it.full_name ?? `Requester #${it.id}`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="font-medium">{it.class_code ?? `Class ${it.class_id}`}</div>
                      <div className="text-xs text-muted-foreground">{it.course_name ?? ''}</div>
                    </td>
                    <td className="p-3 align-top whitespace-nowrap">{it.requested_date ?? '-'}</td>
                    <td className="p-3 align-top whitespace-nowrap font-medium">{String(it.excusal_type ?? '').charAt(0).toUpperCase() + String(it.excusal_type ?? '').slice(1)}</td>
                    <td className="p-3 align-top whitespace-nowrap">
                      <Badge {...statusBadgeProps(it.status)}>{formatStatus(it.status)}</Badge>
                    </td>
                    <td className="p-3 align-top"><div className="max-w-lg line-clamp-3 text-sm text-foreground/90">{it.reason ?? '-'}</div></td>
                    <td className="p-3 align-top whitespace-nowrap text-sm">{it.reviewed_at ? formatDate(new Date(it.reviewed_at), 'yyyy-MM-dd') : 'Not reviewed yet.'}</td>
                    <td className="p-3 align-top">
                      <div className="flex items-center gap-2">
                        <Button title="View details" variant="ghost" size="sm" onClick={() => { setSelectedRequest(it); setModalOpen(true); }} aria-label={`View request ${it.id}`}><Eye size={16} /></Button>
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-muted-foreground">Showing {items.length === 0 ? 0 : skip + 1}–{skip + items.length}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handlePrev} disabled={skip === 0}>Prev</Button>
            <Button size="sm" onClick={handleNext} disabled={items.length < limit}>Next</Button>
          </div>
        </div>
      </CardContent>
      <RequestedExcusalModal open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setSelectedRequest(null); }} request={selectedRequest} onReviewed={(updated) => {
        try {
          setItems(prev => prev.map(it => (Number(it.id) === Number(updated.id) ? ({ ...it, ...updated } as any) : it)));
        } catch (e) { /* ignore */ }
      }} />
    </Card>
  );
}

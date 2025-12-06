"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import useNotifications from '@/hooks/useNotifications';
import type { NotificationEntry } from '@/types/notifications';

export default function NotificationsModal({ children, limit = 200 }: { children?: React.ReactNode; limit?: number }) {
  const { items: liveItems, loading: liveLoading, markRead } = useNotifications();
  const [items, setItems] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [open, setOpen] = useState(false);

  const autoMarkTimer = useRef<number | null>(null);
  const autoMarked = useRef(false);
  const mergedRef = useRef<NotificationEntry[]>([]);


  function clearAutoTimer() {
    if (autoMarkTimer.current) {
      window.clearTimeout(autoMarkTimer.current);
      autoMarkTimer.current = null;
    }
  }

  useEffect(() => {
    // reset and load first page when `limit` changes
    setItems([]);
    setSkip(0);
    setHasMore(true);

    let mounted = true;
    async function fetchPage(pageSkip: number) {
      if (!hasMore && pageSkip !== 0) return;
      if (pageSkip === 0) setLoading(true);
      else setLoadingMore(true);
      try {
        const resp = await fetch(`/api/notifications/mine?skip=${pageSkip}&limit=${limit}`, { credentials: 'include' });
        if (!resp.ok) {
          console.error('Failed to load notifications', resp.status);
          return;
        }
        const data = (await resp.json()) as NotificationEntry[];
        if (!mounted) return;
        // Append for subsequent pages
        setItems(prev => pageSkip === 0 ? (Array.isArray(data) ? data : []) : [...prev, ...(Array.isArray(data) ? data : [])]);
        setHasMore(Array.isArray(data) ? data.length === limit : false);
        setSkip(prev => prev + (Array.isArray(data) ? data.length : 0));
      } catch (e) {
        console.error('load notifications error', e);
      } finally {
        if (pageSkip === 0) setLoading(false);
        else setLoadingMore(false);
      }
    }

    fetchPage(0);
    return () => { mounted = false; };
  }, [limit]);

  // Merge live items with backend list, dedupe by entry_id and sort by created_at desc
  const merged = useMemo(() => {
    const map = new Map<number, NotificationEntry>();
    for (const it of items) map.set(it.entry_id, it);
    for (const it of liveItems) map.set(it.entry_id, it);
    const arr = Array.from(map.values()).sort((a, b) => {
      const ta = a.created_at || '';
      const tb = b.created_at || '';
      return tb.localeCompare(ta);
    });
    return arr;
  }, [items, liveItems]);

  // keep a ref to the latest merged so timer callback reads current items
  useEffect(() => { mergedRef.current = merged; }, [merged]);

  useEffect(() => {
    if (open) {
      autoMarked.current = false;
      clearAutoTimer();
      autoMarkTimer.current = window.setTimeout(async () => {
        const unreadIds = mergedRef.current.filter(i => !i.is_read).map(i => i.entry_id);
        if (unreadIds.length === 0) return;
        try {
          // flush immediately for auto-mark
          await markRead(unreadIds, { flushNow: true } as any);
          autoMarked.current = true;
          setItems(prev => prev.map(p => unreadIds.includes(p.entry_id) ? { ...p, is_read: true, read_at: new Date().toISOString() } : p));
        } catch (e) {
          console.error('auto mark read error', e);
        }
      }, 3000);
    } else {
      clearAutoTimer();
    }

    return () => { clearAutoTimer(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleMarkRead(id: number) {
    // Cancel auto-mark timer so we don't double-send
    clearAutoTimer();
    // Optimistically mark in local list
    setItems(prev => prev.map(p => p.entry_id === id ? { ...p, is_read: true, read_at: new Date().toISOString() } : p));
    // Enqueue in hook's batcher (hook will debounce/flush)
    void markRead([id]).catch((e) => { console.error('mark read error', e); });
  }

  async function handleMarkAllRead() {
    const unreadIds = merged.filter(i => !i.is_read).map(i => i.entry_id);
    if (!unreadIds.length) return;
    clearAutoTimer();
    try {
      // flush immediately for mark-all
      await markRead(unreadIds, { flushNow: true } as any);
      setItems(prev => prev.map(p => unreadIds.includes(p.entry_id) ? { ...p, is_read: true, read_at: new Date().toISOString() } : p));
    } catch (e) {
      console.error('mark all read error', e);
    }
  }

  // cleanup timers on unmount
  useEffect(() => {
    return () => { clearAutoTimer(); };
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => setOpen(v)}>
      <DialogTrigger asChild>
        {children ?? <Button variant="ghost" size="sm">View All</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
        </DialogHeader>

        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">All notifications</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
                Mark all read
              </Button>
            </div>
          </div>

          {(loading || liveLoading) && (
            <div className="py-4 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}

          {!loading && !liveLoading && merged.length === 0 && (
            <div className="text-sm text-muted-foreground p-2">No notifications</div>
          )}

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {merged.map(n => (
              <div key={n.entry_id} className={`p-3 rounded border ${n.is_read ? 'opacity-70' : 'bg-white/60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{n.title || 'Notification'}</div>
                    {n.message && <div className="text-sm text-muted-foreground mt-1">{n.message}</div>}
                    <div className="text-xs text-muted-foreground mt-2">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {!n.is_read && (
                      <Button size="sm" onClick={() => handleMarkRead(n.entry_id)}>Mark read</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-center">
            {hasMore ? (
              <Button
                onClick={async () => {
                  // fetch next page using current skip
                  setLoadingMore(true);
                  try {
                    const resp = await fetch(`/api/notifications/mine?skip=${skip}&limit=${limit}`, { credentials: 'include' });
                    if (resp.ok) {
                      const data = (await resp.json()) as NotificationEntry[];
                      setItems(prev => [...prev, ...(Array.isArray(data) ? data : [])]);
                      setHasMore(Array.isArray(data) ? data.length === limit : false);
                      setSkip(prev => prev + (Array.isArray(data) ? data.length : 0));
                    } else {
                      console.error('Failed to load more notifications', resp.status);
                    }
                  } catch (e) {
                    console.error('load more error', e);
                  } finally {
                    setLoadingMore(false);
                  }
                }}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">No more notifications</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Auto-mark: start a 3s timer when dialog opens and mark visible unread notifications
// cleanup timer on close or unmount
// Note: we add the effect after the component definition to avoid interfering with render order

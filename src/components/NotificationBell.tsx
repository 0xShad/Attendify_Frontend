"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import useNotifications from '@/hooks/useNotifications';
import type { NotificationEntry } from '@/types/notifications';
import NotificationsModal from '@/components/NotificationsViewAll';

export default function NotificationBell() {
  const { items, loading, markRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const autoMarkTimer = useRef<number | null>(null);
  const autoMarked = useRef(false);
  

  function clearAutoTimer() {
    if (autoMarkTimer.current) {
      window.clearTimeout(autoMarkTimer.current);
      autoMarkTimer.current = null;
    }
  }

  const unreadCount = useMemo(() => items.filter(i => !i.is_read).length, [items]);

  async function handleMarkRead(id: number) {
    // cancel auto-mark timer when user interacts
    clearAutoTimer();

    // enqueue mark with hook batching (hook will debounce/flush)
    // fire-and-forget; UI optimistic updates handled by the hook
    void markRead([id]).catch(() => {});
  }

  async function handleMarkAllRead() {
    const unreadIds = items.filter(i => !i.is_read).map(i => i.entry_id);
    if (!unreadIds.length) return;
    clearAutoTimer();
    try {
      // flush immediately for 'mark all read'
      await markRead(unreadIds, { flushNow: true } as any);
    } catch (e) {
      // ignore
    }
  }

  // cleanup timers on unmount
  useEffect(() => {
    return () => { clearAutoTimer(); };
  }, []);

  // Auto-mark unread notifications as read when the dropdown remains open for 3s
  useEffect(() => {
    // reset autoMarked when reopening
    if (open) {
      autoMarked.current = false;
      clearAutoTimer();
      autoMarkTimer.current = window.setTimeout(async () => {
        const unreadIds = items.filter(i => !i.is_read).map(i => i.entry_id);
        if (unreadIds.length === 0) return;
        try {
          // flush immediately for auto-mark
          await markRead(unreadIds, { flushNow: true } as any);
          autoMarked.current = true;
        } catch (e) {
          // ignore errors for auto-mark
        }
      }, 3000);
    } else {
      clearAutoTimer();
    }

    return () => {
      clearAutoTimer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <DropdownMenu open={open} onOpenChange={(val) => setOpen(val)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 bg-stone-50/70 supports-backdrop-filter:backdrop-blur-md border shadow-lg">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Notifications</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
                Mark all read
              </Button>
              <NotificationsModal>
                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
              </NotificationsModal>
            </div>
          </div>

          {loading && (
            <div className="py-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-sm text-muted-foreground p-2">No notifications</div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((n: NotificationEntry) => (
              <div
                key={n.entry_id}
                onClick={() => { if (!n.is_read) handleMarkRead(n.entry_id); }}
                className={`p-2 rounded flex flex-col cursor-pointer ${n.is_read ? 'opacity-60' : 'bg-white/60 hover:bg-white'} `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 text-sm font-medium truncate">{n.title || 'Notification'}</div>
                  <div className="text-xs text-muted-foreground">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                </div>
                {n.message && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

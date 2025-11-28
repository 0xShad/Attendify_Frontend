import { useEffect, useRef, useState, useCallback } from 'react';
import { NotificationEntry, MarkReadRequest, MarkReadResponse } from '../types/notifications';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return (
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('authToken') ||
      null
    );
  } catch (e) {
    return null;
  }
}

export function useNotifications() {
  const [items, setItems] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number>(0);

  const fetchInitial = useCallback(async () => {
    const token = getAuthToken();
    try {
      setLoading(true);
      let resp: Response | null = null;
      if (token && API_BASE) {
        resp = await fetch(`${API_BASE}/notifications/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // call same-origin proxy which will forward cookie-auth
        resp = await fetch('/api/notifications/mine', { credentials: 'include' });
      }

      if (!resp) return;
      if (!resp.ok) {
        console.error('Failed to fetch notifications', resp.status);
        return;
      }
      const data = (await resp.json()) as NotificationEntry[];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Fetch notifications error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const connectWS = useCallback(() => {
    // Each connect attempt obtains a short-lived ticket from the server
    // via the same-origin proxy `/api/notifications/ws-ticket`. This lets
    // the backend consume the ticket and map it to the profile without
    // requiring long-lived tokens in the browser.
    const attemptConnect = async () => {
      // limit attempts
      const maxAttempts = 12;
      if (reconnectRef.current >= maxAttempts) {
        console.warn('Notifications WS: reached max reconnect attempts');
        return;
      }

      try {
        // Request ticket from same-origin proxy which will forward cookie auth
        const ticketResp = await fetch('/api/notifications/ws-ticket', { method: 'POST', credentials: 'include' });
        if (!ticketResp.ok) {
          throw new Error(`ticket request failed ${ticketResp.status}`);
        }
        const ticketJson = await ticketResp.json();
        const ticket = ticketJson?.ticket;
        const ws_url = ticketJson?.ws_url || null;
        const ttl = ticketJson?.ttl_seconds ?? ticketJson?.ttl ?? null;
        if (!ticket && !ws_url) throw new Error('no ticket or ws_url received');

        // Prefer server-provided ws_url. Fall back to constructing from API_BASE and ticket.
        let url: string;
        if (ws_url) {
          url = ws_url;
        } else {
          const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
          const proto = base.startsWith('https') ? 'wss' : 'ws';
          const host = new URL(base).host;
          url = `${proto}://${host}/api/v1/notifications/ws?ticket=${encodeURIComponent(ticket as string)}`;
        }

        if (ttl) console.debug('Notifications WS ticket ttl_seconds=', ttl);

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectRef.current = 0;
          console.debug('Notifications WS open');
        };

        ws.onmessage = (ev) => {
          try {
            const payload: NotificationEntry = JSON.parse(ev.data);
            setItems(prev => {
              if (prev.some(p => p.entry_id === payload.entry_id)) return prev;
              return [payload, ...prev];
            });
            // ACK delivery
            if (ws.readyState === WebSocket.OPEN && payload.entry_id) {
              try { ws.send(JSON.stringify({ ack: payload.entry_id })); } catch {}
            }
          } catch (err) {
            console.error('WS parse error', err);
          }
        };

        ws.onclose = () => {
          // Exponential backoff with jitter
          const baseMs = 1000;
          const maxBackoff = 30000;
          const attempt = reconnectRef.current;
          const expo = Math.min(maxBackoff, baseMs * 2 ** attempt);
          const jitter = Math.floor(Math.random() * (expo * 0.5));
          const backoff = Math.floor(expo + jitter);
          reconnectRef.current++;
          setTimeout(() => attemptConnect(), backoff);
        };

        ws.onerror = (e) => {
          console.error('WS error', e);
          try { ws.close(); } catch {}
        };
      } catch (err) {
        console.error('Failed to obtain ticket or open WS', err);
        // schedule retry with backoff
        const attempt = reconnectRef.current;
        const baseMs = 1000;
        const maxBackoff = 30000;
        const expo = Math.min(maxBackoff, baseMs * 2 ** attempt);
        const jitter = Math.floor(Math.random() * (expo * 0.5));
        const backoff = Math.floor(expo + jitter);
        reconnectRef.current++;
        setTimeout(() => attemptConnect(), backoff);
      }
    };

    // start first attempt
    attemptConnect();
  }, []);

  useEffect(() => {
    fetchInitial();
    connectWS();
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, [fetchInitial, connectWS]);

  // --- Batching for markRead ---
  // Collect ids requested via markRead and send them in a single POST after a short debounce.
  const pendingSet = useRef<Set<number>>(new Set());
  const pendingResolvers = useRef<Array<{ resolve: (n: number) => void; reject: (e: any) => void }>>([]);
  const pendingTimer = useRef<number | null>(null);

  const clearPendingTimer = useCallback(() => {
    if (pendingTimer.current) {
      window.clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }
  }, []);

  const flushPending = useCallback(async () => {
    clearPendingTimer();
    const ids = Array.from(pendingSet.current.values());
    if (ids.length === 0) {
      // resolve any resolvers with 0
      const resolvers = pendingResolvers.current.splice(0, pendingResolvers.current.length);
      for (const r of resolvers) r.resolve(0);
      return 0;
    }
    // clear pending now to allow new calls while this runs
    pendingSet.current.clear();
    const resolvers = pendingResolvers.current.splice(0, pendingResolvers.current.length);
    // optimistic update: mark items locally immediately
    setItems(prev => prev.map(p => (ids.includes(p.entry_id) ? { ...p, is_read: true, read_at: new Date().toISOString() } : p)));

    try {
      const token = getAuthToken();
      let resp: Response;
      const body: MarkReadRequest = { ids };
      if (token && API_BASE) {
        resp = await fetch(`${API_BASE}/notifications/mine/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      } else {
        resp = await fetch('/api/notifications/mine/mark-read', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!resp.ok) {
        console.error('Failed to mark-read', resp.status);
        for (const r of resolvers) r.resolve(0);
        return 0;
      }

      const json = (await resp.json()) as MarkReadResponse;
      // resolve all waiting promises with the server-updated count
      for (const r of resolvers) r.resolve(json.updated);
      return json.updated;
    } catch (err) {
      console.error('flushPending markRead error', err);
      for (const r of pendingResolvers.current.splice(0, pendingResolvers.current.length)) r.reject(err);
      return 0;
    }
  }, [clearPendingTimer]);

  // Public markRead that enqueues ids and returns a Promise that resolves when the batch is flushed.
  const batchedMarkRead = useCallback((ids: number[], opts?: { flushNow?: boolean }) => {
    if (!ids || ids.length === 0) return Promise.resolve(0);
    // add ids to pending set
    for (const id of ids) pendingSet.current.add(id);

    // optimistic update immediately for hook-owned items
    setItems(prev => prev.map(p => (ids.includes(p.entry_id) ? { ...p, is_read: true, read_at: new Date().toISOString() } : p)));

    return new Promise<number>((resolve, reject) => {
      pendingResolvers.current.push({ resolve, reject });
      // if caller requested immediate flush, run it now
      if (opts && opts.flushNow) {
        // flush synchronously (but still async)
        void flushPending();
        return;
      }

      // schedule debounce flush
      if (pendingTimer.current) {
        // timer already scheduled
        return;
      }
      pendingTimer.current = window.setTimeout(() => {
        void flushPending();
      }, 300);
    });
  }, [flushPending]);

  // ensure timers/promises are cleaned on unmount
  useEffect(() => {
    return () => {
      clearPendingTimer();
      // reject any pending promises
      const resolvers = pendingResolvers.current.splice(0, pendingResolvers.current.length);
      for (const r of resolvers) r.reject(new Error('component unmounted'));
    };
  }, [clearPendingTimer]);

  return { items, loading, markRead: batchedMarkRead, refresh: fetchInitial };
}

export default useNotifications;

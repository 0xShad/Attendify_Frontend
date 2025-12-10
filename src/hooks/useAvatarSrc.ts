import { useEffect, useState, useRef } from 'react';
import resolveAvatarUrl from '@/lib/utils/resolveAvatarUrl';

export default function useAvatarSrc(raw: string | null | undefined, options?: { profilePath?: string | null }) {
  const [src, setSrc] = useState<string | null>(() => (raw ? resolveAvatarUrl(raw) : null));
  const [loading, setLoading] = useState(false);
  const retries = useRef(0);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const initial = raw ? resolveAvatarUrl(raw) : null;
    setSrc(initial);
    retries.current = 0;

    if (!initial) return;

    const verify = async () => {
      // Quick load test using Image() to detect 403/404
      return new Promise<boolean>((resolve) => {
        try {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = initial;
        } catch (e) {
          resolve(false);
        }
      });
    };

    const tryRefresh = async () => {
      if (!options?.profilePath) return;
      if (retries.current >= 2) return; // avoid loops
      retries.current++;
      try {
        setLoading(true);
        const res = await fetch(options.profilePath, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const candidate = data?.avatar_url || data?.avatar || null;
        if (candidate) {
          const resolved = resolveAvatarUrl(candidate);
          if (mounted) setSrc(resolved);
          // If the resolved URL fails to load in the client due to protection,
          // attempt to download a blob via the same-origin proxy and create an
          // Object URL to be used as the image source. This bypasses CORS for
          // images protected by cookies or signed backends.
          try {
            // Quick test: can the browser actually load the resolved URL?
            const imgTest = new Image();
            const testOK = await new Promise<boolean>((resolve) => {
              try {
                imgTest.onload = () => resolve(true);
                imgTest.onerror = () => resolve(false);
                imgTest.src = resolved || '';
              } catch (e) { resolve(false); }
            });
            if (!testOK && mounted) {
              // Fetch the proxy and use blob
              try {
                const p = await fetch('/api/profiles/mine/avatar', { credentials: 'include' });
                if (p.ok) {
                  const blob = await p.blob();
                  // If the proxy returned a JSON error body (with 200-OK), the blob's type
                  // may be `application/json` — in that case, treat as a failed load.
                  try { console.debug('Proxy avatar blob type', { blobType: blob.type, size: blob.size }); } catch (e) {}
                  if (!blob.type || !blob.type.startsWith('image/')) {
                    try { console.warn('Proxy returned non-image blob for avatar', { blobType: blob.type }); } catch (e) {}
                    return;
                  }
                  const objectUrl = URL.createObjectURL(blob);
                  // Revoke previous object URL if any to prevent leaks
                  if (objectUrlRef.current) {
                    try { URL.revokeObjectURL(objectUrlRef.current); } catch (e) {}
                  }
                  objectUrlRef.current = objectUrl;
                  if (mounted) setSrc(objectUrl);
                }
              } catch (e) {
                /* ignore */
              }
            }
          } catch (e) {
            // ignore blob steps
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    let timer: number | null = null;
    (async () => {
      const ok = await verify();
      if (!mounted) return;
      if (!ok) {
        // try refreshing via profilePath
        await tryRefresh();
        // verify again
        const verified = await verify();
        if (!verified) {
          // If the resolved URL still fails (likely due to cookie-protected resource),
          // use the same-origin avatar proxy which will forward cookies and return the raw image.
          if (options?.profilePath && mounted) {
            setSrc('/api/profiles/mine/avatar');
          }
          if (retries.current < 2 && options?.profilePath) {
            // schedule a retry after a small delay
            timer = window.setTimeout(tryRefresh, 2000);
          }
        }
      }
    })();

    return () => {
      mounted = false;
      if (timer) window.clearTimeout(timer);
      if (objectUrlRef.current) {
        try { URL.revokeObjectURL(objectUrlRef.current); } catch (e) {}
        objectUrlRef.current = null;
      }
    };
  }, [raw, options?.profilePath]);

  // Returns current src (possibly updated) and a setter for manual override
  return { src, setSrc, loading };
}

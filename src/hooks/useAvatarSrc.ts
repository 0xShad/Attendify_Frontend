import { useEffect, useState, useRef } from 'react';
import resolveAvatarUrl from '@/lib/utils/resolveAvatarUrl';

export default function useAvatarSrc(raw: string | null | undefined, options?: { profilePath?: string | null }) {
  const [src, setSrc] = useState<string | null>(() => (raw ? resolveAvatarUrl(raw) : null));
  const [loading, setLoading] = useState(false);
  const retries = useRef(0);

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
    };
  }, [raw, options?.profilePath]);

  // Returns current src (possibly updated) and a setter for manual override
  return { src, setSrc, loading };
}

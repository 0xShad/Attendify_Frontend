export default function resolveAvatarUrl(u?: string | null): string | null {
  if (!u) return null;
  const getBackendUrl = () => {
    if (typeof window !== "undefined" && (window as any).__ENV__?.NEXT_PUBLIC_BACKEND_API_URL) {
      return (window as any).__ENV__.NEXT_PUBLIC_BACKEND_API_URL;
    }
    return process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";
  };
  const raw = getBackendUrl();
  const BACKEND_ORIGIN = String(raw).replace(/\/api\/(v\d+|v1)\/?$/i, "");

  const v = String(u).trim();
  // Absolute (http/https)
  if (/^https?:\/\//i.test(v)) return v;
  // Protocol-relative (//cdn.example.com/img.png) — treat as absolute
  if (/^\/\//.test(v)) return `${window?.location?.protocol || 'https:'}${v}`;
  // Path-absolute: prefix origin directly
  if (v.startsWith('/')) return `${BACKEND_ORIGIN}${v}`;
  // Otherwise join with a single slash and encode unsafe characters
  try {
    // encodeURI allows slashes but encodes spaces etc.
    const encoded = encodeURI(v);
    return `${BACKEND_ORIGIN}/${encoded}`;
  } catch (e) {
    return `${BACKEND_ORIGIN}/${encodeURIComponent(v)}`;
  }
}

import { NextResponse } from 'next/server';

function parseCookie(header: string | null, name: string) {
  if (!header) return null;
  const pairs = header.split(';').map(p => p.trim());
  for (const p of pairs) {
    const [k, ...rest] = p.split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> } | { params: { classId: string } }) {
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const { classId } = resolvedParams || {};

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(String(classId))}/session`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization');

  const forwardedHeaders: Record<string, string> = {};
  if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
  }
  if (cookie) forwardedHeaders['cookie'] = cookie;

  try {
    // Debug: log incoming headers and resolved target for easier troubleshooting
    try {
      const incomingHeaders = Object.fromEntries(request.headers.entries());
      console.debug('[proxy] GET /api/classes/mine/{classId}/session received', { classId, target, hasAuthorization: !!clientAuth, hasCookie: !!cookie, incomingHeaders });
      console.debug('[proxy] computed forwardedHeaders', forwardedHeaders);
    } catch (e) {
      // non-fatal
      console.debug('[proxy] debug header extraction failed', String(e));
    }
  } catch (__) {}

  try {
    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';

    // Debug: log response metadata (status, content-type, length)
    try {
      console.debug('[proxy] backend response', { status: res.status, ok: res.ok, contentType, length: text?.length ?? 0 });
      // For large bodies avoid dumping everything; but log a short preview for JSON/text
      if (typeof text === 'string' && text.length > 0) {
        const preview = text.slice(0, 2000);
        console.debug('[proxy] backend response preview', preview + (text.length > 2000 ? '...<truncated>' : ''));
      }
    } catch (e) {
      console.debug('[proxy] response debug failed', String(e));
    }

    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend GET /classes/mine/{id}/session failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

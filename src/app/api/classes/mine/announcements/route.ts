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

export async function GET(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const url = new URL(request.url);
  const qs = url.search || '';
  const target = `${API_BASE}/classes/mine/announcements${qs}`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization') || request.headers.get('Authorization') || null;

  const forwardedHeaders: Record<string, string> = {};
  if (clientAuth) forwardedHeaders['Authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['Authorization'] = `Bearer ${accessToken}`;
  }
  if (cookie) forwardedHeaders['cookie'] = cookie;

  try {
    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';

    if (!res.ok) {
      try { console.error('[proxy][classes/mine/announcements] Backend GET error', { status: res.status, body: text }); } catch (e) {}
    }

    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend GET /classes/mine/announcements failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

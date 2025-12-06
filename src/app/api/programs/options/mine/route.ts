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

export async function GET(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/programs/options/mine`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization');

  const forwardedHeaders: Record<string, string> = {};
  if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
  else {
    const cookieNames = ['access_token', 'accessToken', 'auth_token', 'authToken', 'access'];
    let found: string | null = null;
    for (const n of cookieNames) {
      const v = parseCookie(cookie, n);
      if (v) { found = v; break; }
    }
    if (found) forwardedHeaders['authorization'] = `Bearer ${found}`;
  }

  try {
    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend GET /programs/options/mine failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

export const runtime = 'nodejs';

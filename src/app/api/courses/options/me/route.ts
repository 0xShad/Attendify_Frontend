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
  const target = `${API_BASE}/courses/options/me`;

  // Forward incoming headers (cookie + authorization) to backend.
  const forwardedHeaders: Record<string, string> = {};
  const cookie = request.headers.get('cookie') || null;
  if (cookie) forwardedHeaders['cookie'] = cookie;

  // Prefer an explicit Authorization header for backend services that expect a Bearer token.
  const clientAuth = request.headers.get('authorization');
  if (clientAuth) {
    forwardedHeaders['authorization'] = clientAuth;
  } else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    const body = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(body, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend GET /courses/options/me failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

export const runtime = 'nodejs';

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

export async function POST(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/attendance/mine/start-session`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization');

  // Forward the incoming content-type (important for multipart/form-data boundaries)
  const incomingContentType = request.headers.get('content-type') || 'application/json';
  const forwardedHeaders: Record<string, string> = {
    'content-type': incomingContentType,
  };

  if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
  }
  if (cookie) forwardedHeaders['cookie'] = cookie;

  try {
    // Use raw array buffer so multipart bodies (with boundaries) are forwarded correctly
    const bodyBuffer = await request.arrayBuffer();
    const res = await fetch(target, { method: 'POST', headers: forwardedHeaders, body: bodyBuffer, credentials: 'include' } as any);
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend POST /attendance/mine/start-session failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

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

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';

export async function POST(request: Request) {
  const target = `${API_BASE.replace(/\/$/, '')}/attendance/mine/mark-present`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization');

  const forwardedHeaders: Record<string, string> = {};

  const incomingContentType = request.headers.get('content-type');
  if (incomingContentType) forwardedHeaders['content-type'] = incomingContentType;

  if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
  }
  if (cookie) forwardedHeaders['cookie'] = cookie;

  try {
    // Read raw body as ArrayBuffer and forward
    const buf = await request.arrayBuffer();
    // (debug logging removed)

    const res = await fetch(target, { method: 'POST', headers: forwardedHeaders, body: buf as any, credentials: 'include' } as any);
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || undefined;

    // (debug logging removed)

    const headers: Record<string, string> = {};
    if (contentType) headers['content-type'] = contentType;

    return new NextResponse(arrayBuffer, { status: res.status, headers });
  } catch (err) {
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

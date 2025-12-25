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
  const target = `${API_BASE}/profiles/mine/`;

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
    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    const text = await res.text();
    const respContentType = res.headers.get('content-type') || 'application/json';
    return new Response(text, { status: res.status, headers: { 'content-type': respContentType } });
  } catch (err) {
    console.error('Proxy to backend GET /profiles/mine failed:', err);
    return new Response(JSON.stringify({ detail: 'Proxy error' }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}

export async function PATCH(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/profiles/mine/`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization');

  const forwardedHeaders: Record<string, string> = {};
  if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
  }

  // Forward content-type as-is so multipart boundaries are preserved
  const contentType = request.headers.get('content-type');
  if (contentType) forwardedHeaders['content-type'] = contentType;

  if (cookie) forwardedHeaders['cookie'] = cookie;

  try {
    // Read raw body and forward
    const buf = await request.arrayBuffer();
    const res = await fetch(target, { method: 'PATCH', headers: forwardedHeaders, body: Buffer.from(buf) as any });
    const text = await res.text();
    const respContentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': respContentType } });
  } catch (err) {
    console.error('Proxy to backend PATCH /profiles/mine failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

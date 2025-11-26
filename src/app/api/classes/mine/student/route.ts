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

// Proxy GET /api/classes/mine/student -> backend /api/v1/classes/mine/student
export async function GET(req: Request) {
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  // ensure no trailing slash
  const backendBase = String(BACKEND).replace(/\/$/, '');
  const target = `${backendBase}/classes/mine/student`;

  const cookie = req.headers.get('cookie') || null;
  const clientAuth = req.headers.get('authorization');

  const headers: Record<string, string> = {};
  if (clientAuth) headers['authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) headers['authorization'] = `Bearer ${accessToken}`;
  }
  if (cookie) headers['cookie'] = cookie;

  try {
    const upstream = await fetch(target, { method: 'GET', headers });

    // Return upstream body and headers directly
    const text = await upstream.text();
    const respContentType = upstream.headers.get('content-type') || 'application/json';
    const resHeaders = new Headers(upstream.headers);
    if (!resHeaders.has('content-type')) resHeaders.set('content-type', respContentType);
    return new Response(text, { status: upstream.status, headers: resHeaders });
  } catch (err) {
    console.error('Proxy error for /api/classes/mine/student', err);
    return new Response(JSON.stringify({ error: 'Proxy request failed' }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}

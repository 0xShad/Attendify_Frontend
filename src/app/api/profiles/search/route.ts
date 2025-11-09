import { NextResponse } from 'next/server';

// Proxy route for /api/profiles/search
// Reads the HTTP-only access token cookie and forwards the request to the
// backend /profiles/search endpoint, attaching Authorization: Bearer <token>
// if the cookie is present.

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
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const ACCESS_COOKIE_NAME = 'access_token';
    const accessToken = parseCookie(cookieHeader, ACCESS_COOKIE_NAME);

    const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
    // Forward the exact query string that the client sent
    const url = new URL(request.url);
    const qs = url.search || '';
    const backendUrl = `${backendBase}/profiles/search${qs}`;

    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const resp = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    const text = await resp.text();
    const contentType = resp.headers.get('content-type') || 'application/json';
    return new Response(text, { status: resp.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend /profiles/search failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

export const runtime = 'nodejs';

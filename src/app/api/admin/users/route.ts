import { NextResponse } from 'next/server';

// Server-side proxy route for creating admin users.
// Forwards incoming multipart/form-data to the backend admin users endpoint
// and sets the Authorization header using the HTTP-only access_token cookie.

function parseCookie(header: string | null, name: string) {
  if (!header) return null;
  const pairs = header.split(';').map(p => p.trim());
  for (const p of pairs) {
    const [k, ...rest] = p.split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  // cookie name comes from config; use same default used elsewhere
  const ACCESS_COOKIE_NAME = 'access_token';
  const accessToken = parseCookie(cookieHeader, ACCESS_COOKIE_NAME);

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:8082/api/v1';
  const backendUrl = `${backendBase}/admin/users`;

  // Preserve the incoming Content-Type (including boundary)
  const contentType = request.headers.get('content-type') || '';

  // Read the raw body and forward as-is
  const body = await request.arrayBuffer();

  const headers: Record<string, string> = {};
  if (contentType) headers['content-type'] = contentType;
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  try {
    const resp = await fetch(backendUrl, {
      method: 'POST',
      body: Buffer.from(body),
      headers,
    });

    const respText = await resp.text();
    const respContentType = resp.headers.get('content-type') || 'application/json';
    return new Response(respText, { status: resp.status, headers: { 'content-type': respContentType } });
  } catch (err) {
    console.error('Proxy to backend /admin/users failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

export const runtime = 'nodejs';

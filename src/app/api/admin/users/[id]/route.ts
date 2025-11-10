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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieHeader = request.headers.get('cookie') || '';
  const ACCESS_COOKIE_NAME = 'access_token';
  const accessToken = parseCookie(cookieHeader, ACCESS_COOKIE_NAME);

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:8082/api/v1';
  const backendUrl = `${backendBase}/users/${params.id}`;

  // Preserve incoming content-type (application/json expected)
  const contentType = request.headers.get('content-type') || 'application/json';

  const bodyText = await request.text();

  const headers: Record<string, string> = {};
  if (contentType) headers['content-type'] = contentType;
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  try {
    const resp = await fetch(backendUrl, {
      method: 'PUT',
      body: Buffer.from(bodyText),
      headers,
    });

    const respText = await resp.text();
    const respContentType = resp.headers.get('content-type') || 'application/json';
    return new Response(respText, { status: resp.status, headers: { 'content-type': respContentType } });
  } catch (err) {
    console.error('Proxy to backend PUT /users/{id} failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

export const runtime = 'nodejs';

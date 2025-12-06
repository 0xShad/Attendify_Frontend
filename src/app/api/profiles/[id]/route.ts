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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> } | { params: { id: string } }) {
  const cookieHeader = request.headers.get('cookie') || '';
  const ACCESS_COOKIE_NAME = 'access_token';
  const accessToken = parseCookie(cookieHeader, ACCESS_COOKIE_NAME);

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:8082/api/v1';
  // In some Next.js runtimes `params` may be a promise-like object. Await
  // it if necessary to avoid the runtime error about sync dynamic APIs.
  let resolvedParams: any = params;
  try {
    if (typeof params?.then === 'function') resolvedParams = await params;
  } catch (e) {
    // ignore
  }
  const id = resolvedParams?.id;
  const backendUrl = `${backendBase}/profiles/${id}`;

  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  try {
    const resp = await fetch(backendUrl, { method: 'GET', headers });
    const respText = await resp.text();
    const respContentType = resp.headers.get('content-type') || 'application/json';
    return new Response(respText, { status: resp.status, headers: { 'content-type': respContentType } });
  } catch (err) {
    console.error('Proxy to backend GET /profiles/{id} failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

export const runtime = 'nodejs';

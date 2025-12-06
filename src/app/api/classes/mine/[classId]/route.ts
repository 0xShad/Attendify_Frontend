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

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> } | { params: { classId: string } }) {
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const { classId } = resolvedParams || {};
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(classId)}`;

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
  // Forward cookies so backend can authenticate via session cookie if needed
  if (cookie) forwardedHeaders['cookie'] = cookie;

  try {
    console.debug('[proxy] GET /api/classes/mine/{classId} received', { classId, target, hasAuthorization: !!clientAuth, hasCookie: !!cookie });
  } catch (__) {}

  try {
    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend GET /classes/mine/{id} failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ classId: string }> } | { params: { classId: string } }) {
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const { classId } = resolvedParams || {};
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  // Preserve query string (e.g. ?generate_class_code=true)
  const url = new URL(request.url);
  const qs = url.search || '';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(classId)}${qs}`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization');

  const forwardedHeaders: Record<string, string> = {};
  if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
  }

  if (cookie) forwardedHeaders['cookie'] = cookie;

  // If content-type present on the incoming request, forward it. Otherwise let fetch set it.
  const incomingContentType = request.headers.get('content-type');
  if (incomingContentType) forwardedHeaders['content-type'] = incomingContentType;

  try {
    const body = await request.text();
    const res = await fetch(target, { method: 'PATCH', headers: forwardedHeaders, body });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend PATCH /classes/mine/{id} failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ classId: string }> } | { params: { classId: string } }) {
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const { classId } = resolvedParams || {};
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(classId)}`;

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
    const res = await fetch(target, { method: 'DELETE', headers: forwardedHeaders });
    // If backend returned 204 No Content, avoid reading body and return 204 directly
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend DELETE /classes/mine/{id} failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

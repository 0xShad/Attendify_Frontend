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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> } | { params: { id: string } }) {
  // Resolve params in case it's a thenable/Promise in Next.js 15
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const id = resolvedParams?.id;
  const cookieHeader = request.headers.get('cookie') || '';
  const ACCESS_COOKIE_NAME = 'access_token';
  const accessToken = parseCookie(cookieHeader, ACCESS_COOKIE_NAME);

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:8082/api/v1';
  // Forward admin updates to the backend admin users endpoint
  const backendUrl = `${backendBase}/admin/users/${encodeURIComponent(String(id))}`;

  // Preserve incoming content-type (may be multipart/form-data)
  const contentType = request.headers.get('content-type') || undefined;

  // IMPORTANT: Do NOT consume the body as text for multipart requests —
  // that will corrupt binary file uploads. Forward the request body stream
  // directly to the backend fetch.
  const body = request.body;

  const headers: Record<string, string> = {};
  if (contentType) headers['content-type'] = contentType;
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  try {
    // Build fetch init. When forwarding a streaming body with undici/node fetch,
    // the RequestInit must include `duplex: 'half'` to allow streaming the body.
    const putInit: any = { method: 'PUT', headers };
    if (body != null) {
      putInit.body = body;
      // undici requires duplex when sending a streaming body
      putInit.duplex = 'half';
    }
    const resp = await fetch(backendUrl, putInit);

    const respText = await resp.text();
    const respContentType = resp.headers.get('content-type') || 'application/json';
    return new Response(respText, { status: resp.status, headers: { 'content-type': respContentType } });
  } catch (err) {
    console.error('Proxy to backend PUT /users/{id} failed for', backendUrl, err && (err.stack || err.message || err));
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

// Support PATCH as well (backend may expose PATCH for partial updates).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> } | { params: { id: string } }) {
  // Resolve params
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const id = resolvedParams?.id;
  const cookieHeader = request.headers.get('cookie') || '';
  const ACCESS_COOKIE_NAME = 'access_token';
  const accessToken = parseCookie(cookieHeader, ACCESS_COOKIE_NAME);

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:8082/api/v1';
  // Forward admin updates to the backend admin users endpoint
  const backendUrl = `${backendBase}/admin/users/${encodeURIComponent(String(id))}`;

  // Preserve incoming content-type (may be multipart/form-data)
  const contentType = request.headers.get('content-type') || undefined;
  const body = request.body;

  const headers: Record<string, string> = {};
  if (contentType) headers['content-type'] = contentType;
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  try {
    // Build fetch init. When forwarding a streaming body with undici/node fetch,
    // the RequestInit must include `duplex: 'half'` to allow streaming the body.
    const patchInit: any = { method: 'PATCH', headers };
    if (body != null) {
      patchInit.body = body;
      // undici requires duplex when sending a streaming body
      patchInit.duplex = 'half';
    }
    const resp = await fetch(backendUrl, patchInit);

    const respText = await resp.text();
    const respContentType = resp.headers.get('content-type') || 'application/json';
    return new Response(respText, { status: resp.status, headers: { 'content-type': respContentType } });
  } catch (err) {
    console.error('Proxy to backend PATCH /users/{id} failed for', backendUrl, err && (err.stack || err.message || err));
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

// Support DELETE for admin user soft/hard delete. Forwards query string (e.g. ?hard=true)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> } | { params: { id: string } }) {
  // Resolve params
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const id = resolvedParams?.id;
  const cookieHeader = request.headers.get('cookie') || '';
  const ACCESS_COOKIE_NAME = 'access_token';
  const accessToken = parseCookie(cookieHeader, ACCESS_COOKIE_NAME);

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:8082/api/v1';
  // Preserve incoming search params (e.g. ?hard=true)
  const incoming = new URL(request.url);
  const search = incoming.search || '';
  const backendUrl = `${backendBase}/admin/users/${encodeURIComponent(String(id))}${search}`;

  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  try {
    const resp = await fetch(backendUrl, { method: 'DELETE', headers });
    const respText = await resp.text();
    const respContentType = resp.headers.get('content-type') || 'application/json';
    return new Response(respText, { status: resp.status, headers: { 'content-type': respContentType } });
  } catch (err) {
    console.error('Proxy to backend DELETE /admin/users/{id} failed for', backendUrl, err && (err.stack || err.message || err));
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

export const runtime = 'nodejs';

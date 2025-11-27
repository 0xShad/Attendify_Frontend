import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';

function parseCookie(header: string | null, name: string) {
  if (!header) return null;
  const pairs = header.split(';').map(p => p.trim());
  for (const p of pairs) {
    const [k, ...rest] = p.split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function DELETE(req: Request, ctx: any) {
  const params = await ctx.params;
  const { request_id } = params;
  const target = `${BACKEND.replace(/\/$/, '')}/attendance/mine/excusal-requests/${encodeURIComponent(String(request_id))}`;

  const headers = new Headers();
  const cookie = req.headers.get('cookie') || null;
  const clientAuth = req.headers.get('authorization') || null;

  if (clientAuth) {
    headers.set('authorization', clientAuth);
  } else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  }
  if (cookie) headers.set('cookie', cookie);
  headers.set('accept', 'application/json');

  try {
    const res = await fetch(target, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    } as any);

    const contentType = res.headers.get('content-type') || 'application/json';
    const body = await res.text();

    return new Response(body, {
      status: res.status,
      headers: { 'content-type': contentType },
    });
  } catch (err: any) {
    const msg = String(err?.message || 'Proxy request failed');
    return new Response(JSON.stringify({ detail: msg }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}

export async function GET(req: Request, ctx: any) {
  // Keep a GET passthrough for convenience (fetch single request)
  const params = await ctx.params;
  const { request_id } = params;
  const target = `${BACKEND.replace(/\/$/, '')}/attendance/mine/excusal-requests/${encodeURIComponent(String(request_id))}`;
  const headers = new Headers();
  const cookie = req.headers.get('cookie') || null;
  const clientAuth = req.headers.get('authorization') || null;

  if (clientAuth) {
    headers.set('authorization', clientAuth);
  } else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  }
  if (cookie) headers.set('cookie', cookie);
  headers.set('accept', 'application/json');

  try {
    const res = await fetch(target, { method: 'GET', headers, credentials: 'include' } as any);
    const contentType = res.headers.get('content-type') || 'application/json';
    const body = await res.text();
    return new Response(body, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err: any) {
    const msg = String(err?.message || 'Proxy request failed');
    return new Response(JSON.stringify({ detail: msg }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}

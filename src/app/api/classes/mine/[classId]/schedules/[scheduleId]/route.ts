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

// GET single schedule
export async function GET(request: Request, { params }: { params: { classId: string, scheduleId: string } }) {
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const { classId, scheduleId } = resolvedParams || {};

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(classId)}/schedules/${encodeURIComponent(scheduleId)}`;

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
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend GET /classes/mine/{id}/schedules/{scheduleId} failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

// PATCH update schedule (partial)
export async function PATCH(request: Request, { params }: { params: { classId: string, scheduleId: string } }) {
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const { classId, scheduleId } = resolvedParams || {};

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(classId)}/schedules/${encodeURIComponent(scheduleId)}`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization');

  const forwardedHeaders: Record<string, string> = {};
  if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
  }
  if (cookie) forwardedHeaders['cookie'] = cookie;

  const ct = request.headers.get('content-type');
  if (ct) forwardedHeaders['content-type'] = ct;

  try {
    const body = await request.text();
    const res = await fetch(target, { method: 'PATCH', headers: forwardedHeaders, body });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend PATCH /classes/mine/{id}/schedules/{scheduleId} failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

// Also allow PUT as alias to PATCH
export async function PUT(request: Request, ctx: { params: { classId: string, scheduleId: string } }) {
  return PATCH(request, ctx as any);
}

// DELETE schedule
export async function DELETE(request: Request, { params }: { params: { classId: string, scheduleId: string } }) {
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const { classId, scheduleId } = resolvedParams || {};

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(classId)}/schedules/${encodeURIComponent(scheduleId)}`;

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
    // If backend returns 204, return same; if returns body (error), forward it
    const text = await res.text().catch(() => "");
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text || null, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend DELETE /classes/mine/{id}/schedules/{scheduleId} failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

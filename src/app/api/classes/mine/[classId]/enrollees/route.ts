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

export async function GET(request: Request, { params }: { params: { classId: string } }) {
  const { classId } = params;
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(classId)}/enrollees`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization');

  const forwardedHeaders: Record<string, string> = {};
  if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
  }
  // Forward cookies so backend can authenticate via session cookie if needed
  if (cookie) forwardedHeaders['cookie'] = cookie;

  try {
    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend GET /classes/mine/{id}/enrollees failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

export async function POST(request: Request, { params }: { params: { classId: string } }) {
  const { classId } = params;
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(classId)}/enrollees`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization');

  const forwardedHeaders: Record<string, string> = {};
  if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
  }
  if (cookie) forwardedHeaders['cookie'] = cookie;

  // Forward content-type if present
  const ct = request.headers.get('content-type');
  if (ct) forwardedHeaders['content-type'] = ct;

  try {
    const body = await request.text();
    const res = await fetch(target, { method: 'POST', headers: forwardedHeaders, body });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend POST /classes/mine/{id}/enrollees failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

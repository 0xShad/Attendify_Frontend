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

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> } | { params: { orgId: string } }) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';

  // Resolve params in case the runtime provides a thenable.
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const orgId = resolvedParams?.orgId;

  const incoming = new URL(request.url);
  const p = incoming.searchParams;

  const allowed = new URL(`${API_BASE}/organizations/${encodeURIComponent(String(orgId))}/students`);
  const qRaw = p.get('q');
  const skipRaw = p.get('skip');
  const limitRaw = p.get('limit');
  // Only forward q if non-empty to avoid backend validation errors
  if (qRaw && qRaw.trim().length > 0) allowed.searchParams.append('q', qRaw.trim());
  // Normalize skip/limit to integers and only forward if valid
  if (skipRaw) {
    const s = Number(skipRaw);
    if (Number.isFinite(s) && Number.isInteger(s) && s >= 0) allowed.searchParams.append('skip', String(s));
  }
  if (limitRaw) {
    const l = Number(limitRaw);
    if (Number.isFinite(l) && Number.isInteger(l) && l > 0) allowed.searchParams.append('limit', String(l));
  }

  const target = allowed.toString();
  console.debug('[proxy] forwarding GET ->', target);

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
  if (cookie) forwardedHeaders['cookie'] = cookie;

  try {
    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error(`Proxy to backend GET /organizations/${orgId}/students failed:`, err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

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

export async function POST(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/notifications/ws-ticket`;

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
    // Forward body if present
    const buf = await request.arrayBuffer();
    const res = await fetch(target, { method: 'POST', headers: forwardedHeaders, body: Buffer.from(buf) as any });
    const respContentType = res.headers.get('content-type') || 'application/json';

    // Try to parse JSON to enrich the response with a full ws_url and TTL.
    let bodyText = await res.text();
    if ((respContentType || '').includes('application/json')) {
      try {
        const json = JSON.parse(bodyText || '{}');
        const ticket = json?.ticket || null;

        // Determine ws_url: prefer backend-provided ws_url, otherwise construct from API_BASE
        let ws_url = json?.ws_url || null;
        if (!ws_url && ticket) {
          try {
            const base = API_BASE || (typeof request !== 'undefined' ? request.headers.get('host') : '');
            // API_BASE may include a path like /api/v1 — derive host
            const parsed = new URL(base.startsWith('http') ? base : `http://${base}`);
            const proto = parsed.protocol === 'https:' ? 'wss' : 'ws';
            const host = parsed.host;
            ws_url = `${proto}://${host}/api/v1/notifications/ws?ticket=${encodeURIComponent(ticket)}`;
          } catch (err) {
            // ignore construction errors and leave ws_url null
            ws_url = null;
          }
        }

        const result = {
          ticket,
          ws_url,
          ttl_seconds: json?.ttl_seconds ?? json?.ttl ?? 10,
          single_use: typeof json?.single_use === 'boolean' ? json.single_use : true,
          // include any other backend fields for compatibility
          ...(json || {}),
        };

        return NextResponse.json(result, { status: res.status });
      } catch (err) {
        // fall through to raw text response
        console.error('Failed to parse backend ws-ticket JSON:', err);
      }
    }

    // Fallback: return raw response
    return new NextResponse(bodyText, { status: res.status, headers: { 'content-type': respContentType } });
  } catch (err) {
    console.error('Proxy to backend POST /notifications/ws-ticket failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

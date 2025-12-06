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

export async function POST(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization');

  const forwardedHeaders: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
  }
  // Forward cookies as-is so backend can validate session-based auth if needed
  if (cookie) forwardedHeaders['cookie'] = cookie;

  try {
    const body = await request.text();
    // Debug: log incoming POST info (no sensitive header values)
    try {
      console.debug('[proxy][classes/mine] POST ->', { target, hasAuthorization: !!clientAuth, cookiePresent: !!cookie, bodySize: body ? body.length : 0 });
    } catch (e) { /* ignore logging errors */ }

    const res = await fetch(target, { method: 'POST', headers: forwardedHeaders, body });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';

    if (!res.ok) {
      try { console.error('[proxy][classes/mine] Backend POST error', { status: res.status, body: text }); } catch (e) {}
    }

    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend POST /classes/mine failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  // Preserve the original query string
  const url = new URL(request.url);
  const qs = url.search || '';
  const target = `${API_BASE}/classes/mine${qs}`;

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
    // Debug: log incoming GET info
    try {
      console.debug('[proxy][classes/mine] GET ->', { target, hasAuthorization: !!clientAuth, cookiePresent: !!cookie });
    } catch (e) { /* ignore */ }

    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';

    // Development-only: log a small preview of the returned JSON so we can inspect fields like session_total/session_completed
    try {
      if (process.env.NODE_ENV !== 'production') {
        try {
          const parsed = JSON.parse(text);
          const preview = Array.isArray(parsed) ? parsed.slice(0, 3) : parsed;
          try { console.debug('[proxy][classes/mine] Backend GET data preview', JSON.stringify(preview, null, 2).slice(0, 4000)); } catch (_) { /* ignore */ }
        } catch (e) {
          // not JSON - ignore
        }
      }
    } catch (_) { /* ignore runtime env failures */ }

    if (!res.ok) {
      try { console.error('[proxy][classes/mine] Backend GET error', { status: res.status, body: text }); } catch (e) {}
    }

    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend GET /classes/mine failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

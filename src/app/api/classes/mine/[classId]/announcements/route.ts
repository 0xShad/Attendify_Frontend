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

export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> } | { params: { classId: string } }) {
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const { classId } = resolvedParams || {};

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(String(classId))}/announcements`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization') || request.headers.get('Authorization') || null;

  const forwardedHeaders: Record<string, string> = {};

  // Preserve Content-Type with proper capitalization and dedupe if multiple values present
  const rawContentType = request.headers.get('content-type') || request.headers.get('Content-Type') || 'application/json';
  const contentTypeHeader = String(rawContentType).split(',')[0].trim();
  forwardedHeaders['Content-Type'] = contentTypeHeader || 'application/json';

  // Forward Authorization using exact header name expected by backend
  if (clientAuth) forwardedHeaders['Authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  if (cookie) forwardedHeaders['cookie'] = cookie;

  try {
    const bodyText = await request.text();

    // (dev-only logging removed)

    // Normalize JSON body so backend receives an object not a quoted JSON string
    let bodyToSend: string | undefined = undefined;
    if ((contentTypeHeader || '').toLowerCase().includes('application/json')) {
      try {
        // First parse the incoming text
        const parsed = JSON.parse(bodyText);
        if (typeof parsed === 'string') {
          // The client sent a JSON string containing JSON (double-encoded). Try parse again.
          try {
            const inner = JSON.parse(parsed);
            bodyToSend = JSON.stringify(inner);
          } catch (_innerErr) {
            // inner is just a plain string, send as JSON string
            bodyToSend = JSON.stringify(parsed);
          }
        } else {
          // parsed is already an object/array — send as proper JSON
          bodyToSend = JSON.stringify(parsed);
        }
      } catch (e) {
        // Not valid JSON — forward raw text as-is
        bodyToSend = bodyText;
      }
    } else {
      // Not JSON content-type — forward raw text
      bodyToSend = bodyText;
    }

    try { console.log('[proxy][classes/mine/{classId}/announcements] POST ->', { target, classId, hasAuthorization: !!forwardedHeaders['Authorization'], cookiePresent: !!cookie, bodySize: bodyToSend ? bodyToSend.length : 0 }); } catch (e) {}

    const res = await fetch(target, { method: 'POST', headers: forwardedHeaders, body: bodyToSend });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';

    if (!res.ok) {
      try { console.error('[proxy][classes/mine/{classId}/announcements] Backend POST error', { status: res.status, body: text }); } catch (e) {}
    }

    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend POST /classes/mine/{classId}/announcements failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

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

export async function PUT(request: Request, { params }: { params: { classId: string; announcementId: string } }) {
  let resolvedParams: any = params;
  try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
  const { classId, announcementId } = resolvedParams || {};

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(String(classId))}/announcements/${encodeURIComponent(String(announcementId))}`;

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

    // Normalize JSON body so backend receives an object not a quoted JSON string
    let bodyToSend: string | undefined = undefined;
    if ((contentTypeHeader || '').toLowerCase().includes('application/json')) {
      try {
        const parsed = JSON.parse(bodyText);
        if (typeof parsed === 'string') {
          try {
            const inner = JSON.parse(parsed);
            bodyToSend = JSON.stringify(inner);
          } catch (_innerErr) {
            bodyToSend = JSON.stringify(parsed);
          }
        } else {
          bodyToSend = JSON.stringify(parsed);
        }
      } catch (e) {
        bodyToSend = bodyText;
      }
    } else {
      bodyToSend = bodyText;
    }

    const res = await fetch(target, { method: 'PUT', headers: forwardedHeaders, body: bodyToSend });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';

    if (!res.ok) {
      try { console.error('[proxy][classes/mine/{classId}/announcements/{announcementId}] Backend PUT error', { status: res.status, body: text }); } catch (e) {}
    }

    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend PUT /classes/mine/{classId}/announcements/{announcementId} failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

  export async function DELETE(request: Request, { params }: { params: { classId: string; announcementId: string } }) {
    let resolvedParams: any = params;
    try { if (typeof (params as any)?.then === 'function') resolvedParams = await (params as any); } catch (e) { /* ignore */ }
    const { classId, announcementId } = resolvedParams || {};

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
    const target = `${API_BASE}/classes/mine/${encodeURIComponent(String(classId))}/announcements/${encodeURIComponent(String(announcementId))}`;

    const cookie = request.headers.get('cookie') || null;
    const clientAuth = request.headers.get('authorization') || request.headers.get('Authorization') || null;

    const forwardedHeaders: Record<string, string> = {};

    // Forward Authorization using exact header name expected by backend
    if (clientAuth) forwardedHeaders['Authorization'] = clientAuth;
    else {
      const accessToken = parseCookie(cookie, 'access_token');
      if (accessToken) forwardedHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    if (cookie) forwardedHeaders['cookie'] = cookie;

    try {
      const res = await fetch(target, { method: 'DELETE', headers: forwardedHeaders });
      // For 204 No Content, return an empty NextResponse with same status
      if (res.status === 204) {
        return new NextResponse(null, { status: 204 });
      }

      const text = await res.text();
      const contentType = res.headers.get('content-type') || 'application/json';

      if (!res.ok) {
        try { console.error('[proxy][classes/mine/{classId}/announcements/{announcementId}] Backend DELETE error', { status: res.status, body: text }); } catch (e) {}
      }

      return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
    } catch (err) {
      console.error('Proxy to backend DELETE /classes/mine/{classId}/announcements/{announcementId} failed:', err);
      return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
    }
  }

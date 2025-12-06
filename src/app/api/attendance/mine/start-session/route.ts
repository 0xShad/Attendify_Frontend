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
  const target = `${API_BASE}/attendance/mine/start-session`;

  const cookie = request.headers.get('cookie') || null;
  const clientAuth = request.headers.get('authorization');

  // Forward the incoming content-type (important for multipart/form-data boundaries)
  const incomingContentType = request.headers.get('content-type') || 'application/json';
  const forwardedHeaders: Record<string, string> = {
    'content-type': incomingContentType,
  };

  if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
  else {
    const accessToken = parseCookie(cookie, 'access_token');
    if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
  }
  if (cookie) forwardedHeaders['cookie'] = cookie;

  try {
    // Use raw array buffer so multipart bodies (with boundaries) are forwarded correctly
    const bodyBuffer = await request.arrayBuffer();

    // Debug: log what we received (headers, content-type, body length, small preview)
    try {
      // Mask sensitive header values before logging
      const incomingHeaders = Object.fromEntries(request.headers.entries());
      const maskedIncoming: Record<string, any> = { ...incomingHeaders };
      if (maskedIncoming.cookie) maskedIncoming.cookie = '<redacted>';
      if (maskedIncoming.authorization) maskedIncoming.authorization = '<redacted>';
      const maskedForwarded: Record<string, any> = { ...forwardedHeaders };
      if (maskedForwarded.cookie) maskedForwarded.cookie = '<redacted>';
      if (maskedForwarded.authorization) maskedForwarded.authorization = '<redacted>';

      console.debug('[proxy:start-session] incomingHeaders', maskedIncoming);
      console.debug('[proxy:start-session] forwardedHeaders', maskedForwarded);
      console.debug('[proxy:start-session] incomingContentType', incomingContentType);
      const lengthHeader = request.headers.get('content-length');
      console.debug('[proxy:start-session] content-length header', lengthHeader);

      const bufLen = bodyBuffer ? bodyBuffer.byteLength : 0;
      console.debug('[proxy:start-session] bodyBuffer.length', bufLen);

      // If multipart, try to extract boundary from content-type
      if (incomingContentType && incomingContentType.indexOf('multipart') >= 0) {
        const m = /boundary=(?:"?)([^";]+)/i.exec(incomingContentType);
        const boundary = m ? m[1] : null;
        console.debug('[proxy:start-session] multipart boundary', boundary);
      }
    } catch (e) {
      console.debug('[proxy:start-session] debug extraction failed', String(e));
    }

    const res = await fetch(target, { method: 'POST', headers: forwardedHeaders, body: bodyBuffer, credentials: 'include' } as any);
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';

    // Debug: log backend response metadata and small preview to help diagnose missing fields
    try {
      console.debug('[proxy:start-session] backend response status', res.status, 'ok', res.ok);
      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { respHeaders[k] = v; });
      console.debug('[proxy:start-session] backend response headers', respHeaders);
      console.debug('[proxy:start-session] backend content-type', contentType, 'body length', text ? text.length : 0);
      if (text && text.length > 0) {
        const preview = text.slice(0, 2000);
        console.debug('[proxy:start-session] backend response preview', preview + (text.length > 2000 ? '...<truncated>' : ''));
      }
    } catch (e) {
      console.debug('[proxy:start-session] response debug failed', String(e));
    }

    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend POST /attendance/mine/start-session failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

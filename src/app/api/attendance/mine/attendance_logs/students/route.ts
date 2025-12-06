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

export async function GET(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  try {
    // Preserve query string from the incoming request
    const reqUrl = new URL(request.url);
    const search = reqUrl.search || '';
    const target = `${API_BASE}/attendance/mine/attendance_logs/students${search}`;

    const cookie = request.headers.get('cookie') || null;
    const clientAuth = request.headers.get('authorization');

    const forwardedHeaders: Record<string, string> = {};
    if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
    else {
      const accessToken = parseCookie(cookie, 'access_token');
      if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
    }
    if (cookie) forwardedHeaders['cookie'] = cookie;

    // Debug incoming headers and forwarded headers
    try {
      const incomingHeaders = Object.fromEntries(request.headers.entries());
      const maskedIncoming: Record<string, any> = { ...incomingHeaders };
      if (maskedIncoming.cookie) maskedIncoming.cookie = '<redacted>';
      if (maskedIncoming.authorization) maskedIncoming.authorization = '<redacted>';
      const maskedForwarded: Record<string, any> = { ...forwardedHeaders };
      if (maskedForwarded.cookie) maskedForwarded.cookie = '<redacted>';
      if (maskedForwarded.authorization) maskedForwarded.authorization = '<redacted>';
      console.debug('[proxy:attendance_logs_students] incomingHeaders', maskedIncoming);
      console.debug('[proxy:attendance_logs_students] forwardedHeaders', maskedForwarded);
      console.debug('[proxy:attendance_logs_students] forwarding GET to target', target);
    } catch (e) {
      console.debug('[proxy:attendance_logs_students] debug extraction failed', String(e));
    }

    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders, credentials: 'include' } as any);
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';

    try {
      console.debug('[proxy:attendance_logs_students] backend response status', res.status, 'ok', res.ok);
      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { respHeaders[k] = v; });
      console.debug('[proxy:attendance_logs_students] backend response headers', respHeaders);
      console.debug('[proxy:attendance_logs_students] backend content-type', contentType, 'body length', text ? text.length : 0);
      if (text && text.length > 0) {
        const preview = text.slice(0, 2000);
        console.debug('[proxy:attendance_logs_students] backend response preview', preview + (text.length > 2000 ? '...<truncated>' : ''));
      }
    } catch (e) {
      console.debug('[proxy:attendance_logs_students] response debug failed', String(e));
    }

    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend GET /attendance/mine/attendance_logs/students failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

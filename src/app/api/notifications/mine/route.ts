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

function maskHeaders(headers: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const k of Object.keys(headers)) {
    const low = k.toLowerCase();
    if (low === 'authorization' || low === 'cookie') out[k] = '<REDACTED>';
    else out[k] = headers[k];
  }
  return out;
}

async function saveDebugJson(obj: unknown) {
  // no-op placeholder (file logging removed in favor of console.debug)
}

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  // Preserve query string when forwarding
  const url = new URL(request.url);
  const search = url.search || '';
  const target = `${API_BASE}/notifications/mine${search}`;

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
    console.debug('[proxy] GET /notifications/mine ->', target);
    console.debug('[proxy] forwarded headers:', maskHeaders(forwardedHeaders));

    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    const text = await res.text();
    const respContentType = res.headers.get('content-type') || 'application/json';

    // Log summary of backend response (try to parse JSON, otherwise truncate text)
    try {
      console.debug('[proxy] backend status:', res.status, 'content-type:', respContentType, 'length:', text.length);
      if (respContentType.includes('application/json')) {
        const obj = JSON.parse(text);
        // Log the actual parsed JSON to console for inspection
        console.debug('[proxy] backend response JSON (full):', obj);

        // Also produce the truncated pretty-print for easier scanning
        const pretty = JSON.stringify(obj, null, 2);
        console.debug('[proxy] backend response JSON (truncated 20000 chars):', pretty.slice(0, 20000));
      } else {
        console.debug('[proxy] backend response text (truncated 20000 chars):', text.slice(0, 20000));
      }
    } catch (logErr) {
      console.debug('[proxy] failed to parse backend response as JSON:', logErr);
      console.debug('[proxy] raw backend response (truncated 20000 chars):', (text || '').slice(0, 20000));
    }

    return new Response(text, { status: res.status, headers: { 'content-type': respContentType } });
  } catch (err) {
    console.error('Proxy to backend GET /notifications/mine failed:', err);
    return new Response(JSON.stringify({ detail: 'Proxy error' }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}

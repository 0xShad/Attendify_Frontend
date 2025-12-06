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
  // Preserve original query string if provided
  const url = new URL(request.url);
  const qs = url.search || '';
  const target = `${API_BASE}/classes/mine/options${qs}`;

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
    let res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    let text = await res.text();
    let contentType = res.headers.get('content-type') || 'application/json';

    const looksLikeOptionsAsId = (rText: string | null) => {
      if (!rText) return false;
      return rText.includes('class_id') && rText.includes('"options"');
    };

    // If backend mistakenly matched /classes/mine/{class_id} and returned a 422 parsing error
    // because the path segment was "options", try alternate path orders that some backends expose.
    if (res.status === 422 && looksLikeOptionsAsId(text)) {
      const fallbacks = [
        `${API_BASE}/classes/options/mine${qs}`,
        `${API_BASE}/options/classes/mine${qs}`,
      ];

      for (const altTarget of fallbacks) {
        try {
          const altRes = await fetch(altTarget, { method: 'GET', headers: forwardedHeaders });
          const altText = await altRes.text();
          const altContentType = altRes.headers.get('content-type') || 'application/json';
          if (altRes.ok) {
            return new NextResponse(altText, { status: altRes.status, headers: { 'content-type': altContentType } });
          }
          // if fallback returned 422 for same reason, continue to next
          if (altRes.status === 422 && looksLikeOptionsAsId(altText)) continue;
          // otherwise return the fallback response as-is
          console.error('[proxy][classes/mine/options] fallback GET error', { target: altTarget, status: altRes.status, body: altText });
          return new NextResponse(altText, { status: altRes.status, headers: { 'content-type': altContentType } });
        } catch (e) {
          console.error('[proxy][classes/mine/options] fallback fetch failed', { target: altTarget, error: String(e) });
          // try next fallback
        }
      }
      // none of the fallbacks succeeded, fall through to return original response below
    }

    if (!res.ok) {
      try { console.error('[proxy][classes/mine/options] Backend GET error', { status: res.status, body: text }); } catch (e) {}
    }

    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend GET /classes/mine/options failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

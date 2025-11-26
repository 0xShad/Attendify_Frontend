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

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';

export async function GET(request: Request) {
  try {
    const target = `${API_BASE.replace(/\/$/, '')}/analytics/mine/student_dashboard`;

    const cookie = request.headers.get('cookie') || null;
    const clientAuth = request.headers.get('authorization');

    // Debug: log incoming proxy call (do NOT log actual tokens)
    console.debug('[student_dashboard proxy] incoming request', {
      url: target,
      hasAuthorization: !!clientAuth,
      hasCookie: !!cookie,
    });

    const forwardedHeaders: Record<string, string> = {};
    if (clientAuth) forwardedHeaders['authorization'] = clientAuth;
    else {
      const accessToken = parseCookie(cookie, 'access_token');
      if (accessToken) forwardedHeaders['authorization'] = `Bearer ${accessToken}`;
    }
    if (cookie) forwardedHeaders['cookie'] = cookie;

    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders, credentials: 'include' } as any);

    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      if (contentType.includes('application/json')) {
        const errData = await res.json();
        console.debug('[student_dashboard proxy] backend error response', { status: res.status, body: errData });
        return NextResponse.json(errData, { status: res.status });
      }
      const txt = await res.text();
      console.debug('[student_dashboard proxy] backend error non-json response', { status: res.status, text: txt.substring(0, 200) });
      return new NextResponse(txt, { status: res.status });
    }

    if (contentType.includes('application/json')) {
      const data = await res.json();
      // Debug: pretty-print backend JSON response (trim long output for readability)
      try {
        const pretty = JSON.stringify(data, null, 2);
        const MAX = 4000; // characters
        if (pretty.length > MAX) {
          console.debug('[student_dashboard proxy] backend json response (trimmed):\n' + pretty.slice(0, MAX) + '\n...output trimmed');
        } else {
          console.debug('[student_dashboard proxy] backend json response:\n' + pretty);
        }
      } catch (e) {
        console.debug('[student_dashboard proxy] backend json response (could not stringify)');
      }
      return NextResponse.json(data, { status: res.status });
    }

    const buf = await res.arrayBuffer();
    const headers: Record<string, string> = {};
    if (contentType) headers['content-type'] = contentType;
    return new NextResponse(buf, { status: res.status, headers });
  } catch (err: any) {
    return NextResponse.json({ detail: 'Proxy error', error: String(err) }, { status: 502 });
  }
}

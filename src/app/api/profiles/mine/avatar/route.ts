import { NextResponse } from 'next/server';
import resolveAvatarUrl from '@/lib/utils/resolveAvatarUrl';

export const runtime = 'nodejs';

function parseCookie(header: string | null, name: string) {
  if (!header) return null;
  const pairs = header.split(';').map(p => p.trim());
  for (const p of pairs) {
    const [k, ...rest] = p.split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function GET(request: Request) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const profileTarget = `${API_BASE}/profiles/mine`;

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
    const profResp = await fetch(profileTarget, { method: 'GET', headers: forwardedHeaders });
    if (!profResp.ok) {
      return new NextResponse(JSON.stringify({ detail: 'Profile not available' }), { status: profResp.status });
    }
    const profile = await profResp.json().catch(() => ({}));
    const avatar = profile?.avatar_url ?? profile?.avatar ?? null;
    if (!avatar) return new NextResponse(null, { status: 204 });

    // Resolve to absolute URL if needed
    const src = resolveAvatarUrl(avatar) || avatar;
    try { console.debug('Proxying avatar for profile', { hasCookie: !!cookie, hasAuth: !!clientAuth, resolvedSrc: src }); } catch (e) {}

    // Try to fetch the avatar resource and stream back to the client. Forward cookies/auth if available.
    try {
      const avatarResp = await fetch(src, { method: 'GET', headers: forwardedHeaders });
      if (!avatarResp.ok) {
        return new NextResponse(JSON.stringify({ detail: 'Failed to fetch avatar' }), { status: avatarResp.status });
      }
      const contentType = avatarResp.headers.get('content-type') || 'application/octet-stream';
      const buf = await avatarResp.arrayBuffer();
      return new NextResponse(Buffer.from(buf), { status: 200, headers: { 'content-type': contentType } });
    } catch (err) {
      console.error('Failed to fetch avatar resource:', err);
      return new NextResponse(JSON.stringify({ detail: 'Failed to fetch avatar resource' }), { status: 502 });
    }
  } catch (err) {
    console.error('Proxy to backend GET /profiles/mine/avatar failed:', err);
    return new NextResponse(JSON.stringify({ detail: 'Proxy error' }), { status: 502 });
  }
}

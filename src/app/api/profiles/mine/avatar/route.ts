import { NextResponse } from 'next/server';
import resolveAvatarUrl from '@/lib/utils/resolveAvatarUrl';
import { ALLOWED_IMAGE_DOMAINS } from '@/config/images';

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
    try { console.debug('Resolved avatar src', { raw: avatar, resolved: src }); } catch (e) {}

    // Basic SSRF whitelist: only allow known hosts (backend and allowed image domains)
    try {
      const parsed = new URL(src);
      const allowedHosts = new Set<string>([new URL(API_BASE).host, ...ALLOWED_IMAGE_DOMAINS]);
      if (!allowedHosts.has(parsed.host) && parsed.protocol !== 'data:') {
        console.warn('Blocked avatar proxy for non-whitelisted host', parsed.host);
        return new NextResponse(JSON.stringify({ detail: 'Not allowed' }), { status: 403 });
      }
    } catch (e) {
      // If src is not a valid URL, continue and let fetch fail
    }
    try { console.debug('Proxying avatar for profile', { hasCookie: !!cookie, hasAuth: !!clientAuth, resolvedSrc: src }); } catch (e) {}

    // Try to fetch the avatar resource and stream back to the client. Forward cookies/auth if available.
    try {
      const avatarResp = await fetch(src, { method: 'GET', headers: forwardedHeaders });
      const contentType = avatarResp.headers.get('content-type') || 'application/octet-stream';
      const sizeHeader = avatarResp.headers.get('content-length');
      try { console.debug('Avatar resource fetch', { status: avatarResp.status, contentType, size: sizeHeader }); } catch (e) {}
      if (!avatarResp.ok) {
        const errorText = await avatarResp.text().catch(() => '');
        try { console.error('Avatar fetch failed', { status: avatarResp.status, body: errorText }); } catch (e) {}
        return new NextResponse(JSON.stringify({ detail: 'Failed to fetch avatar', backend: errorText }), { status: avatarResp.status });
      }
      // Ensure this is an image-like content type; otherwise treat as an error
      if (!contentType.startsWith('image/') && contentType !== 'application/octet-stream') {
        const text = await avatarResp.text().catch(() => '');
        console.error('Avatar resource returned non-image content-type', { contentType, bodySample: text.substring(0, 200) });
        return new NextResponse(JSON.stringify({ detail: 'Invalid avatar content type' }), { status: 502 });
      }

      // Stream the response body directly to the client to avoid buffering large files
      const headers = { 'content-type': contentType } as Record<string, string>;
      if (sizeHeader) headers['content-length'] = String(sizeHeader);
      headers['cache-control'] = avatarResp.headers.get('cache-control') || 'public, max-age=3600';
      // Vary the response if request carried authorization/cookie so caches behave
      const varyParts: string[] = [];
      if (forwardedHeaders['authorization']) varyParts.push('Authorization');
      if (forwardedHeaders['cookie']) varyParts.push('Cookie');
      if (varyParts.length) headers['vary'] = varyParts.join(', ');

      try { console.debug('Returning avatar stream', { size: sizeHeader, contentType }); } catch (e) {}
      return new NextResponse(avatarResp.body, { status: 200, headers });
    } catch (err) {
      console.error('Failed to fetch avatar resource:', err);
      return new NextResponse(JSON.stringify({ detail: 'Failed to fetch avatar resource' }), { status: 502 });
    }
  } catch (err) {
    console.error('Proxy to backend GET /profiles/mine/avatar failed:', err);
    return new NextResponse(JSON.stringify({ detail: 'Proxy error' }), { status: 502 });
  }
}

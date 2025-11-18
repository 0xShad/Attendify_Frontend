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

export async function DELETE(request: Request, { params }: { params: { classId: string; enrolleeId: string } }) {
  const { classId, enrolleeId } = params;
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8082/api/v1';
  const target = `${API_BASE}/classes/mine/${encodeURIComponent(classId)}/enrollees/${encodeURIComponent(enrolleeId)}`;

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
    const res = await fetch(target, { method: 'DELETE', headers: forwardedHeaders });
    // For DELETE we typically expect 204 No Content. Forward status and body.
    const text = await res.text().catch(() => '');
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend DELETE /classes/mine/{id}/enrollees/{enrolleeId} failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

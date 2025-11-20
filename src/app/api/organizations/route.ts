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

  const incoming = new URL(request.url);
  const params = incoming.searchParams;

  // Build allowed backend URL and forward only a whitelist of query params
  const allowed = new URL(`${API_BASE}/organizations`);

  const skipRaw = params.get('skip');
  const limitRaw = params.get('limit');
  const type = params.get('type');
  const min_programs = params.get('min_programs');
  const max_programs = params.get('max_programs');
  const min_courses = params.get('min_courses');
  const max_courses = params.get('max_courses');
  const min_students = params.get('min_students');
  const max_students = params.get('max_students');
  const min_faculty = params.get('min_faculty');
  const max_faculty = params.get('max_faculty');

  if (skipRaw) {
    const s = Number(skipRaw);
    if (Number.isFinite(s) && Number.isInteger(s) && s >= 0) allowed.searchParams.append('skip', String(s));
  }
  if (limitRaw) {
    const l = Number(limitRaw);
    if (Number.isFinite(l) && Number.isInteger(l) && l > 0) allowed.searchParams.append('limit', String(l));
  }
  if (type) allowed.searchParams.append('type', type);
  if (min_programs) allowed.searchParams.append('min_programs', min_programs);
  if (max_programs) allowed.searchParams.append('max_programs', max_programs);
  if (min_courses) allowed.searchParams.append('min_courses', min_courses);
  if (max_courses) allowed.searchParams.append('max_courses', max_courses);
  if (min_students) allowed.searchParams.append('min_students', min_students);
  if (max_students) allowed.searchParams.append('max_students', max_students);
  if (min_faculty) allowed.searchParams.append('min_faculty', min_faculty);
  if (max_faculty) allowed.searchParams.append('max_faculty', max_faculty);

  const target = allowed.toString();
  console.debug('[proxy] forwarding GET ->', target);

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
    const res = await fetch(target, { method: 'GET', headers: forwardedHeaders });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  } catch (err) {
    console.error('Proxy to backend GET /organizations failed:', err);
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}

/**
 * Attendance API helper
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";

// Normalize override_mode values to canonical backend enum strings.
function normalizeOverrideMode(m?: string | null) {
  if (!m) return null;
  const s = String(m).trim().toLowerCase();
  if (!s) return null;
  // accept several common variants
  if (s === 'online') return 'online';
  if (s === 'hybrid') return 'hybrid';
  if (s === 'f2f' || s === 'face-to-face' || s === 'face_to_face' || s === 'face to face') return 'face_to_face';
  // fallback: replace dashes with underscores
  const replaced = s.replace(/-/g, '_');
  if (['online', 'face_to_face', 'hybrid'].includes(replaced)) return replaced as any;
  return s;
}

export interface StartSessionIn {
  class_id: number;
  schedule_id?: number | null;
  schedule_special_id?: number | null;
  phase?: "initial" | "setup" | "face_recognition";
  override_mode?: "online" | "face_to_face" | "hybrid";
  session_date?: string; // YYYY-MM-DD
  start_time?: string; // HH:MM:SS
  end_time?: string; // HH:MM:SS
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

export async function startSession(payload: StartSessionIn): Promise<any> {
  const isBrowser = typeof window !== 'undefined';
  const proxyUrl = `/api/attendance/mine/start-session`;
  const url = isBrowser ? proxyUrl : `${API_BASE_URL}/attendance/mine/start-session`;

  try {
    if (isBrowser) {
      // Use multipart/form-data even for initial/setup phases so the backend
      // (which expects form fields + file uploads) receives fields consistently.
      const form = new FormData();
      form.append('class_id', String(payload.class_id));
      if (payload.phase) form.append('phase', String(payload.phase));
      if (payload.schedule_id != null) form.append('schedule_id', String(payload.schedule_id));
      if (payload.schedule_special_id != null) form.append('schedule_special_id', String(payload.schedule_special_id));
      const normMode = normalizeOverrideMode((payload as any).override_mode);
      if (normMode) form.append('override_mode', String(normMode));
      if (payload.session_date) form.append('session_date', String(payload.session_date));
      if (payload.start_time) form.append('start_time', String(payload.start_time));
      if (payload.end_time) form.append('end_time', String(payload.end_time));
      if (payload.location) form.append('location', String(payload.location));
      if (payload.latitude != null) form.append('latitude', String(payload.latitude));
      if (payload.longitude != null) form.append('longitude', String(payload.longitude));
      if (payload.notes) form.append('notes', String(payload.notes));

      const res = await import('./fetchClient').then(m => m.fetchWithAuth(url, {
        method: 'POST',
        body: form,
      }));
      return res;
    }

    // Server-side direct call keeps JSON to backend
    // Normalize override_mode for server-side JSON requests as well
    const serverPayload: any = { ...payload };
    const norm = normalizeOverrideMode((serverPayload as any).override_mode);
    if (norm) serverPayload.override_mode = norm;
    else delete serverPayload.override_mode;

    const res = await import('./fetchClient').then(m => m.fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serverPayload),
    }));
    return res;
  } catch (err) {
    throw err;
  }
}

export default { startSession };

/**
 * Multipart variant of startSession for cases where a face file must be uploaded
 * (secretary face verification). Builds FormData and posts to same proxy.
 */
export async function startSessionMultipart(payload: StartSessionIn & { face_file?: Blob | File | null }): Promise<any> {
  const isBrowser = typeof window !== 'undefined';
  const proxyUrl = `/api/attendance/mine/start-session`;
  const url = isBrowser ? proxyUrl : `${API_BASE_URL}/attendance/mine/start-session`;

  try {
    const form = new FormData();
    form.append('class_id', String(payload.class_id));
    if (payload.phase) form.append('phase', String(payload.phase));
    if (payload.schedule_id != null) form.append('schedule_id', String(payload.schedule_id));
    if (payload.schedule_special_id != null) form.append('schedule_special_id', String(payload.schedule_special_id));
    const normMode2 = normalizeOverrideMode((payload as any).override_mode);
    if (normMode2) form.append('override_mode', String(normMode2));
    if (payload.session_date) form.append('session_date', String(payload.session_date));
    if (payload.start_time) form.append('start_time', String(payload.start_time));
    if (payload.end_time) form.append('end_time', String(payload.end_time));
    if (payload.location) form.append('location', String(payload.location));
    if (payload.latitude != null) form.append('latitude', String(payload.latitude));
    if (payload.longitude != null) form.append('longitude', String(payload.longitude));
    if (payload.notes) form.append('notes', String(payload.notes));
    if (payload.face_file) {
      form.append('face_file', payload.face_file, 'face.jpg');
    }

    const res = await import('./fetchClient').then(m => m.fetchWithAuth(url, {
      method: 'POST',
      body: form,
    }));
    return res;
  } catch (err) {
    throw err;
  }
}

export interface MarkPresentIn {
  class_id: number;
  session_id: number;
  profile_id?: number | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  face_file?: Blob | File | null;
}

export async function markPresent(payload: MarkPresentIn): Promise<any> {
  const isBrowser = typeof window !== 'undefined';
  const proxyUrl = `/api/attendance/mine/mark-present`;
  const url = isBrowser ? proxyUrl : `${API_BASE_URL}/attendance/mine/mark-present`;

  try {
    const form = new FormData();
    form.append('class_id', String(payload.class_id));
    form.append('session_id', String(payload.session_id));
    if (payload.profile_id != null) form.append('profile_id', String(payload.profile_id));
    if (payload.latitude != null) form.append('latitude', String(payload.latitude));
    if (payload.longitude != null) form.append('longitude', String(payload.longitude));
    if (payload.face_file) {
      // give a default filename
      form.append('face_file', payload.face_file, 'face.jpg');
    }

    const res = await import('./fetchClient').then(m => m.fetchWithAuth(url, {
      method: 'POST',
      // Do NOT set Content-Type for multipart; let the browser set the boundary
      body: form,
    }));
    return res;
  } catch (err) {
    throw err;
  }
}

/**
 * Mark present (face-to-face endpoint) — multipart/form-data
 * Endpoint: /api/attendance/mine/mark-present-f2f
 */
export async function markPresentF2F(payload: MarkPresentIn): Promise<any> {
  const isBrowser = typeof window !== 'undefined';
  const proxyUrl = `/api/attendance/mine/mark-present-f2f`;
  const url = isBrowser ? proxyUrl : `${API_BASE_URL}/attendance/mine/mark-present-f2f`;

  try {
    const form = new FormData();
    form.append('class_id', String(payload.class_id));
    form.append('session_id', String(payload.session_id));
    if (payload.profile_id != null) form.append('profile_id', String(payload.profile_id));
    if (payload.latitude != null) form.append('latitude', String(payload.latitude));
    if (payload.longitude != null) form.append('longitude', String(payload.longitude));
    if (payload.face_file) {
      form.append('face_file', payload.face_file, 'face.jpg');
    }

    const res = await import('./fetchClient').then(m => m.fetchWithAuth(url, {
      method: 'POST',
      body: form,
    }));
    return res;
  } catch (err) {
    throw err;
  }
}

export interface ExcusalRequestIn {
  class_id: number;
  excusal_type: 'early' | 'late' | 'absence';
  session_id?: number | null;
  requested_date?: string | null; // YYYY-MM-DD
  requested_start_time?: string | null; // HH:MM:SS
  requested_end_time?: string | null; // HH:MM:SS
  reason?: string | null;
}

/**
 * Create an excusal request for the current user (proxy -> backend).
 * Endpoint: POST /api/attendance/mine/excusal-requests (proxied)
 */
export async function createExcusalRequest(payload: ExcusalRequestIn): Promise<any> {
  const isBrowser = typeof window !== 'undefined';
  const proxyUrl = `/api/attendance/mine/excusal-requests`;
  const url = isBrowser ? proxyUrl : `${API_BASE_URL}/attendance/mine/excusal-requests`;

  try {
    const body: any = { ...payload };
    // Ensure optional nulls are omitted when undefined
    const res = await import('./fetchClient').then(m => m.fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(body),
    }));
    return res;
  } catch (err) {
    throw err;
  }
}

export interface ExcusalRequestOut {
  id: number;
  class_id: number;
  class_code?: string | null;
  course_id?: number | null;
  course_name?: string | null;
  program_id?: number | null;
  program_name?: string | null;
  session_id?: number | null;
  profile_id: number;
  excusal_type: 'early' | 'late' | 'absence';
  status: string;
  requested_date?: string | null;
  reason?: string | null;
  submitted_at: string;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
}

/**
 * List excusal requests for the current user (or faculty as allowed).
 */
export async function listMyExcusalRequests(params?: { skip?: number; limit?: number; class_id?: number; profile_id?: number; status?: string }): Promise<ExcusalRequestOut[]> {
  const isBrowser = typeof window !== 'undefined';
  const proxyUrl = `/api/attendance/mine/excusal-requests`;
  const url = isBrowser ? proxyUrl : `${API_BASE_URL}/attendance/mine/excusal-requests`;

  try {
    const qs: string[] = [];
    if (params) {
      if (typeof params.skip === 'number') qs.push(`skip=${encodeURIComponent(String(params.skip))}`);
      if (typeof params.limit === 'number') qs.push(`limit=${encodeURIComponent(String(params.limit))}`);
      if (typeof params.class_id === 'number') qs.push(`class_id=${encodeURIComponent(String(params.class_id))}`);
      if (typeof params.profile_id === 'number') qs.push(`profile_id=${encodeURIComponent(String(params.profile_id))}`);
      if (typeof params.status === 'string' && params.status) qs.push(`status=${encodeURIComponent(params.status)}`);
    }
    const finalUrl = qs.length ? `${url}?${qs.join('&')}` : url;
    const res = await import('./fetchClient').then(m => m.fetchWithAuth(finalUrl, { method: 'GET' }));
    return Array.isArray(res) ? res as ExcusalRequestOut[] : [];
  } catch (err) {
    throw err;
  }
}

/**
 * Cancel an excusal request owned by the current user.
 * Endpoint: DELETE /api/attendance/mine/excusal-requests/{request_id}
 */
export async function cancelMyExcusalRequest(requestId: number): Promise<ExcusalRequestOut> {
  const isBrowser = typeof window !== 'undefined';
  const proxyUrl = `/api/attendance/mine/excusal-requests/${encodeURIComponent(String(requestId))}`;
  const url = isBrowser ? proxyUrl : `${API_BASE_URL}/attendance/mine/excusal-requests/${encodeURIComponent(String(requestId))}`;

  try {
    const res = await import('./fetchClient').then(m => m.fetchWithAuth(url, { method: 'DELETE' }));
    return res as ExcusalRequestOut;
  } catch (err) {
    throw err;
  }
}

/**
 * Fetch attendance logs for the current user (or faculty) via the proxy.
 * Accepts optional filters: skip, limit, class_id, session_id, profile_id
 */
export async function getAttendanceLogs(params?: { skip?: number; limit?: number; class_id?: number; session_id?: number; profile_id?: number }): Promise<any[]> {
  const isBrowser = typeof window !== 'undefined';
  const proxyUrl = `/api/attendance/mine/attendance_logs`;
  const url = isBrowser ? proxyUrl : `${API_BASE_URL}/attendance/mine/attendance_logs`;

  try {
    const qs = [] as string[];
    if (params) {
      if (typeof params.skip === 'number') qs.push(`skip=${encodeURIComponent(String(params.skip))}`);
      if (typeof params.limit === 'number') qs.push(`limit=${encodeURIComponent(String(params.limit))}`);
      if (typeof params.class_id === 'number') qs.push(`class_id=${encodeURIComponent(String(params.class_id))}`);
      if (typeof params.session_id === 'number') qs.push(`session_id=${encodeURIComponent(String(params.session_id))}`);
      if (typeof params.profile_id === 'number') qs.push(`profile_id=${encodeURIComponent(String(params.profile_id))}`);
    }
    const finalUrl = qs.length ? `${url}?${qs.join('&')}` : url;

    const res = await import('./fetchClient').then(m => m.fetchWithAuth(finalUrl, { method: 'GET' }));
    return res;
  } catch (err) {
    throw err;
  }
}

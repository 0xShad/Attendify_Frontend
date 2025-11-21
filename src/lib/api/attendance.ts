/**
 * Attendance API helper
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";

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
    const res = await import('./fetchClient').then(m => m.fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }));
    return res;
  } catch (err) {
    throw err;
  }
}

export default { startSession };

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

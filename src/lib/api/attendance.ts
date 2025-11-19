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

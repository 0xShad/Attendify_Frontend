/**
 * Schedules API client
 * Provides a helper to list schedules for a class (GET /classes/{class_id}/schedules)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";

export type ScheduleCommon = {
  id: number;
  type: "normal" | "special";
  start_time: string;
  end_time: string;
  location: string | null;
  modes: string[];
};

export type NormalSchedule = ScheduleCommon & {
  type: "normal";
  day_of_week: string;
};

export type SpecialSchedule = ScheduleCommon & {
  type: "special";
  date: string; // ISO date
  reason: string | null;
  notes: string | null;
};

export type Schedule = NormalSchedule | SpecialSchedule;

export async function listSchedulesForClass(classId: number): Promise<Schedule[]> {
  // When running in the browser prefer the same-origin Next.js proxy so the
  // HTTP-only auth cookie is forwarded by the server (and backend can
  // resolve caller via require_current_user). Fall back to direct backend
  // path for SSR or when the proxy is unavailable.
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser) {
    const requestUrl = `/api/classes/mine/${encodeURIComponent(String(classId))}/schedules`;
    try {
      const res = await import('./fetchClient').then(m => m.fetchRawWithAuth(requestUrl, { method: 'GET' }));
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        if (res.status === 404) throw new Error(`NotFound: ${body || 'Class not found'}`);
        throw new Error(body || res.statusText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data as Schedule[] : [];
    } catch (err) {
      // If the proxy call failed, fallthrough to direct backend URL below.
    }
  }

  const url = `${API_BASE_URL}/classes/${classId}/schedules`;
  try {
    const res = await import('./fetchClient').then(m => m.fetchRawWithAuth(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } }));
    if (res.status === 404) {
      const body = await res.text().catch(() => "");
      throw new Error(`NotFound: ${body || "Class not found"}`);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(body || res.statusText || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data as Schedule[];
  } catch (err) {
    throw err;
  }
}

export const schedulesAPI = {
  listSchedulesForClass,
  // Get single schedule
  async getScheduleForClass(classId: number, scheduleId: number): Promise<Schedule> {
    const url = `${API_BASE_URL}/classes/${classId}/schedules/${scheduleId}`;

    const res = await import('./fetchClient').then(m => m.fetchRawWithAuth(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } }));

    if (res.status === 404) {
      const body = await res.text().catch(() => "");
      throw new Error(`NotFound: ${body || "Schedule not found"}`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(body || res.statusText || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data as Schedule;
  },
  // Create a schedule for a class. Payload should match either NormalSchedule or SpecialSchedule shape
  async createScheduleForClass(classId: number, payload: Partial<ScheduleCommon> & Record<string, any>): Promise<Schedule> {
    const url = `${API_BASE_URL}/classes/${classId}/schedules`;

    const res = await import('./fetchClient').then(m => m.fetchRawWithAuth(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(body || res.statusText || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data as Schedule;
  },
  // Update an existing schedule for a class
  async updateScheduleForClass(classId: number, scheduleId: number, payload: Partial<ScheduleCommon> & Record<string, any>): Promise<Schedule> {
    const url = `${API_BASE_URL}/classes/${classId}/schedules/${scheduleId}`;

    const res = await import('./fetchClient').then(m => m.fetchRawWithAuth(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(body || res.statusText || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data as Schedule;
  },
  // Delete a schedule for a class
  async deleteScheduleForClass(classId: number, scheduleId: number): Promise<void> {
    const url = `${API_BASE_URL}/classes/${classId}/schedules/${scheduleId}`;

    const res = await import('./fetchClient').then(m => m.fetchRawWithAuth(url, { method: 'DELETE' }));

    if (res.status === 404) {
      // not found is acceptable for idempotent delete
      return;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(body || res.statusText || `HTTP ${res.status}`);
    }
  },
};

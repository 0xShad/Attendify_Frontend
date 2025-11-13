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
  const url = `${API_BASE_URL}/classes/${classId}/schedules`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (res.status === 404) {
      // class not found
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
    // Re-throw so callers can handle
    throw err;
  }
}

export const schedulesAPI = {
  listSchedulesForClass,
  // Get single schedule
  async getScheduleForClass(classId: number, scheduleId: number): Promise<Schedule> {
    const url = `${API_BASE_URL}/classes/${classId}/schedules/${scheduleId}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

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

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

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

    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

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

    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });

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

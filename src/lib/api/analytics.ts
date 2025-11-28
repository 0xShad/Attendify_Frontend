/**
 * Analytics API helpers
 */
import { fetchRawWithAuth } from './fetchClient';

const PROXY_BASE = '/api/analytics/mine';

export type FacultyDashboard = {
  assigned_classes_count: number;
  my_attendance: {
    total_logs: number;
    present_or_late: number;
    late: number;
    absent: number;
    excused: number;
    attendance_rate: number | null;
  };
  students_by_class: Array<{
    class_id: number;
    class_code?: string | null;
    course_name?: string | null;
    enrolled_count?: number | null;
    total_logs: number;
    present_or_late: number;
    late: number;
    absent: number;
    excused: number;
    attendance_rate: number | null;
  }>;
  overall_students: {
    total_logs: number;
    present_or_late: number;
    late: number;
    absent: number;
    excused: number;
    attendance_rate: number | null;
  };
};

/**
 * Fetch faculty dashboard analytics via same-origin proxy.
 */
export async function getFacultyDashboard(): Promise<FacultyDashboard> {
  const url = new URL(`${PROXY_BASE}/faculty_dashboard`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  try {
    const res = await import('./fetchClient').then(m => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || res.statusText || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : String(err);
    throw new Error(`Failed to fetch faculty dashboard: ${msg}`);
  }
}

export type FacultyDashboardEnhanced = {
  assigned_classes_count: number;
  my_attendance: {
    total_logs: number;
    present_or_late: number;
    late: number;
    absent: number;
    excused: number;
    attendance_rate: number | null;
  };
  students_by_class: Array<{
    class_id: number | null;
    class_code?: string | null;
    course_name?: string | null;
    enrolled_count?: number | null;
    total_logs: number;
    present_or_late: number;
    late: number;
    absent: number;
    excused: number;
    attendance_rate: number | null;
    recent_sessions: Array<{
      session_id: number | null;
      session_date: string | null;
      present_count: number;
      absent_count: number;
      excused_count: number;
    }>;
    upcoming_sessions: Array<{
      session_id: number | null;
      session_date: string | null;
      schedule_id: number | null;
      start_time: string | null;
      end_time: string | null;
    }>;
  }>;
  overall_students: {
    total_logs: number;
    present_or_late: number;
    late: number;
    absent: number;
    excused: number;
    attendance_rate: number | null;
  };
  pending_excusals: number;
  upcoming_sessions_overall: Array<{
    session_id: number | null;
    session_date: string | null;
    schedule_id: number | null;
    start_time: string | null;
    end_time: string | null;
  }>;
};

/**
 * Fetch the enhanced faculty dashboard analytics via same-origin proxy.
 */
export async function getFacultyDashboardEnhanced(): Promise<FacultyDashboardEnhanced> {
  const url = new URL(`${PROXY_BASE}/faculty_dashboard_enhanced`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  try {
    const res = await import('./fetchClient').then(m => m.fetchRawWithAuth(url.toString(), { method: 'GET' }));
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || res.statusText || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : String(err);
    throw new Error(`Failed to fetch enhanced faculty dashboard: ${msg}`);
  }
}
export async function getAttendanceSummary(): Promise<any> {
  const res = await fetch('/api/analytics/mine/attendance_summary', { method: 'GET', credentials: 'include' });
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      throw new Error(data?.detail || JSON.stringify(data));
    }
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getStudentDashboard(): Promise<any> {
  const res = await fetch('/api/analytics/mine/student_dashboard', { method: 'GET', credentials: 'include' });
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      throw new Error(data?.detail || JSON.stringify(data));
    }
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

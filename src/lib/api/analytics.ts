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

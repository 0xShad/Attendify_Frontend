const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8082/api/v1";

export interface Holiday {
  id: number;
  organization_id?: number | null;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD or null
  is_recurring?: boolean;
  notes?: string | null;
}

export async function listHolidays(start?: string | null, end?: string | null, organization_id?: number | number[] | null): Promise<Holiday[]> {
  const url = new URL(`${API_BASE_URL}/holidays`);
  if (start) url.searchParams.append('start', String(start));
  if (end) url.searchParams.append('end', String(end));
  if (Array.isArray(organization_id)) {
    for (const id of organization_id) {
      if (id !== undefined && id !== null) url.searchParams.append('organization_id', String(id));
    }
  } else {
    if (organization_id !== undefined && organization_id !== null) url.searchParams.append('organization_id', String(organization_id));
  }
  try {
    const res = await fetch(url.toString(), { method: 'GET', credentials: 'include' });
    if (res.status === 404) return [];
    if (!res.ok) {
      const txt = await res.text().catch(() => res.statusText || `HTTP ${res.status}`);
      throw new Error(String(txt));
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    throw err;
  }
}

export async function createHoliday(payload: {
  organization_id?: number | null;
  name: string;
  start_date: string;
  end_date?: string | null;
  is_recurring?: boolean;
  notes?: string | null;
}): Promise<Holiday> {
  const url = `${API_BASE_URL}/holidays`;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // include Authorization header if an auth token is present in localStorage
    try {
      const token = (typeof window !== 'undefined' && localStorage.getItem('authToken')) || null;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      // ignore localStorage errors
    }
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText || `HTTP ${res.status}`);
      throw new Error(String(body));
    }
    return res.json();
  } catch (err: any) {
    throw err;
  }
}

export async function updateHoliday(holidayId: number, payload: Partial<{
  organization_id?: number | null;
  name: string;
  start_date: string;
  end_date?: string | null;
  is_recurring?: boolean;
  notes?: string | null;
}>): Promise<Holiday> {
  const url = `${API_BASE_URL}/holidays/${holidayId}`;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const token = (typeof window !== 'undefined' && localStorage.getItem('authToken')) || null;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {}
    const res = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText || `HTTP ${res.status}`);
      throw new Error(String(body));
    }
    return res.json();
  } catch (err: any) {
    throw err;
  }
}

// exported at bottom after deleteHoliday is defined

export async function deleteHoliday(holidayId: number): Promise<boolean> {
  // Try the expected endpoint first, then fallback to legacy/typo route if necessary.
  const tryUrls = [`${API_BASE_URL}/holidays/${holidayId}`, `${API_BASE_URL}/nolidays/${holidayId}`];
  try {
    for (const url of tryUrls) {
      try {
        const headers: Record<string, string> = {};
        try {
          const token = (typeof window !== 'undefined' && localStorage.getItem('authToken')) || null;
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch (e) {}
        const res = await fetch(url, { method: 'DELETE', credentials: 'include', headers });
        if (res.ok || res.status === 204) return true;
        if (res.status === 404) continue; // try next url
        // other non-ok statuses -> throw
        const txt = await res.text().catch(() => res.statusText || `HTTP ${res.status}`);
        throw new Error(String(txt));
      } catch (err) {
        // if this was the last URL, rethrow
        if (url === tryUrls[tryUrls.length - 1]) throw err;
        // otherwise continue to next url
      }
    }
    return false;
  } catch (e) {
    throw e;
  }
}

export const holidaysAPI = { listHolidays, createHoliday, updateHoliday, deleteHoliday } as const;

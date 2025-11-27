export type AnnouncementOut = {
  id: number;
  class_id: number | null;
  author_id: number;
  title: string;
  content: string;
  created_at: string; // ISO UTC
  class_code?: string | null;
  course_id?: number | null;
  course_name?: string | null;
};

const TRY_PATHS = [
  "/api/classes/mine/announcements", // same-origin proxy (preferred)
  "/api/v1/classes/mine/announcements", // backend direct fallback
];

export async function fetchMyAnnouncements(): Promise<AnnouncementOut[]> {
  let lastError: any = null;

  for (const path of TRY_PATHS) {
    try {
      const res = await fetch(path, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (res.status === 204) return [];
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) return json as AnnouncementOut[];
        // some proxies return { data: [...] }
        if (json && Array.isArray(json.data)) return json.data as AnnouncementOut[];
        // unexpected shape
        return [];
      }

      // for 404 try next path; for 401/403/500 surface error
      if (res.status === 404) continue;
      const text = await res.text();
      lastError = new Error(`Request to ${path} failed (${res.status}): ${text}`);
      break;
    } catch (err) {
      lastError = err;
      // try next path
    }
  }

  throw lastError || new Error("Failed to fetch announcements");
}

export function startAnnouncementsPolling(
  onUpdate: (items: AnnouncementOut[]) => void,
  intervalMs = 60_000
) {
  let stopped = false;

  async function tick() {
    try {
      const items = await fetchMyAnnouncements();
      if (!stopped) onUpdate(items);
    } catch (err) {
      // swallow — consumer can decide how to handle failures
      // console.debug("Announcements polling error:", err);
    }
  }

  // run immediately
  tick();
  const id = setInterval(tick, intervalMs);

  return () => {
    stopped = true;
    clearInterval(id);
  };
}

export default fetchMyAnnouncements;

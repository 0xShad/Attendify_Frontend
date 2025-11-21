export const normalizeAttendanceRate = (raw?: number | null): number => {
  if (raw == null || Number.isNaN(Number(raw))) return 0;
  const n = Number(raw);
  if (n <= 1) return Math.max(0, Math.min(100, n * 100));
  return Math.max(0, Math.min(100, n));
};

export const parseDateOnly = (s?: string | null): Date | null => {
  if (!s) return null;
  const str = String(s);
  // If it's a plain date like YYYY-MM-DD, construct a local Date at midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str + 'T00:00:00');
  // Otherwise, let the Date constructor handle it
  try {
    return new Date(str);
  } catch (e) {
    return null;
  }
};

export const formatTime = (t?: string | null): string => {
  if (!t) return '';
  if (typeof t !== 'string') return '';
  // Accept HH:MM:SS or HH:MM and return HH:MM
  return t.slice(0, 5);
};

export default {
  normalizeAttendanceRate,
  parseDateOnly,
  formatTime,
};

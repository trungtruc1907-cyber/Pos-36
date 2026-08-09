/**
 * Parses various date formats into a timestamp in milliseconds.
 * Handles ISO strings, DD/MM/YYYY HH:mm:ss, DD/MM/YYYY HH:mm, DD/MM/YYYY, etc.
 */
export function parseDateToMillis(dateStr?: string | null, createdAt?: string | null): number {
  if (dateStr) {
    // Check if ISO format
    if (dateStr.includes('T')) {
      const t = new Date(dateStr).getTime();
      if (!isNaN(t) && t > 0) return t;
    }

    // Vietnamese DD/MM/YYYY HH:mm:ss format
    const trimmed = dateStr.trim();
    const parts = trimmed.split(' ');
    const dateParts = parts[0]?.split('/') || [];
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
      const year = parseInt(dateParts[2], 10);

      let hours = 0, minutes = 0, seconds = 0;
      if (parts[1]) {
        const timeParts = parts[1].split(':');
        hours = parseInt(timeParts[0] || '0', 10);
        minutes = parseInt(timeParts[1] || '0', 10);
        seconds = parseInt(timeParts[2] || '0', 10);
      }
      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d.getTime();
    }

    const fallback = new Date(trimmed).getTime();
    if (!isNaN(fallback) && fallback > 0) return fallback;
  }

  if (createdAt) {
    const t = new Date(createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  return 0;
}

/**
 * Generic comparator for sorting items by date/time descending (newest first).
 */
export function sortByTimeDesc<T>(
  items: T[],
  getDateStr: (item: T) => { date?: string; time?: string; createdAt?: string; updatedAt?: string }
): T[] {
  return [...items].sort((a, b) => {
    const infoA = getDateStr(a);
    const infoB = getDateStr(b);

    const timeA = parseDateToMillis(infoA.date || infoA.time || infoA.updatedAt, infoA.createdAt);
    const timeB = parseDateToMillis(infoB.date || infoB.time || infoB.updatedAt, infoB.createdAt);

    if (timeA !== timeB) {
      return timeB - timeA; // newest first
    }
    return 0;
  });
}

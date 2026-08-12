/**
 * Parses various date formats into a timestamp in milliseconds.
 * Handles ISO strings, DD/MM/YYYY HH:mm:ss, DD/MM/YYYY HH:mm, DD/MM/YYYY, etc.
 */
export function parseDateToMillis(dateStr?: string | null, createdAt?: string | null): number {
  if (dateStr) {
    const trimmed = dateStr.trim();
    if (!trimmed) return 0;

    // Standard ISO format with T
    if (trimmed.includes('T')) {
      const t = new Date(trimmed).getTime();
      if (!isNaN(t) && t > 0) return t;
    }

    // Split date and time components
    const parts = trimmed.split(' ');
    const datePart = parts[0] || '';
    const delimiter = datePart.includes('/') ? '/' : (datePart.includes('-') ? '-' : null);

    if (delimiter) {
      const dateTokens = datePart.split(delimiter);
      if (dateTokens.length === 3) {
        let year = 0, month = 0, day = 0;
        if (dateTokens[0].length === 4) {
          // YYYY-MM-DD or YYYY/MM/DD
          year = parseInt(dateTokens[0], 10);
          month = parseInt(dateTokens[1], 10) - 1;
          day = parseInt(dateTokens[2], 10);
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          day = parseInt(dateTokens[0], 10);
          month = parseInt(dateTokens[1], 10) - 1;
          year = parseInt(dateTokens[2], 10);
        }

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

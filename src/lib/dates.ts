const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcMs(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00Z`);
}

/** Number of calendar days from start to end, counting both ends. */
export function daysBetweenInclusive(start: string, end: string): number {
  return Math.round((toUtcMs(end) - toUtcMs(start)) / DAY_MS) + 1;
}

/** Every date from start to end inclusive, as YYYY-MM-DD strings. */
export function eachDate(start: string, end: string): string[] {
  const out: string[] = [];
  for (let ms = toUtcMs(start); ms <= toUtcMs(end); ms += DAY_MS) {
    out.push(new Date(ms).toISOString().slice(0, 10));
  }
  return out;
}

/** "HH:mm" to minutes after midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

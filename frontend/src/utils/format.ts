function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

// Parse both ISO 8601 strings and SQLite datetime('now') strings as UTC.
// SQLite returns "YYYY-MM-DD HH:MM:SS" (no timezone), which JavaScript would
// otherwise interpret as local time and cause an ~8h offset for CST users.
function parseUTC(iso: string): Date {
  const hasExplicitZone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(iso);
  if (hasExplicitZone) return new Date(iso);
  return new Date(iso.replace(" ", "T") + "Z");
}

export function formatDate(iso: string): string {
  const d = parseUTC(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日`;
}

export function formatDateTime(iso: string): string {
  const d = parseUTC(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatRelative(iso: string): string {
  const d = parseUTC(iso);
  if (isNaN(d.getTime())) return iso;

  const now = Date.now();
  const diff = now - d.getTime();
  const sec = Math.floor(diff / 1000);

  if (sec < 60) return "刚刚";

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分钟前`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}小时前`;

  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}天前`;

  const month = Math.floor(day / 30);
  if (month < 12) return `${month}个月前`;

  const year = Math.floor(month / 12);
  return `${year}年前`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

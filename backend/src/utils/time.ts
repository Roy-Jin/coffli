// Unified UTC ISO 8601 timestamp helper.
// Use this for all user-facing created_at/updated_at fields so the frontend
// can parse them consistently as UTC.
export function nowISO(): string {
    return new Date().toISOString();
}

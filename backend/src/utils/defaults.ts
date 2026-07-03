export const DEFAULT_KV: Record<string, string> = {
    BASIC_AUTH: "COFFLI:PASSWD",
    MAINTENANCE_MODE: "OFF",
    MAINTENANCE_MESSAGE: "503 Service Unavailable",
    INITED: "TRUE",
    GITHUB_CLIENT_ID: "",
    GITHUB_CLIENT_SECRET: "",
    SITE_URL: "https://coffli.pages.dev",
    SESSION_SECRET: "change-me-in-production",
};

export function getDefault(key: string): string | undefined {
    return DEFAULT_KV[key];
}

export function getDefaultKeys(): string[] {
    return Object.keys(DEFAULT_KV);
}

export function isManagedKey(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(DEFAULT_KV, key);
}

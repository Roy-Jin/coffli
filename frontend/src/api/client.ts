import type { ApiSuccess, ApiErrorBody } from "@/types/api";

export class ApiError extends Error {
  status: number;
  code: string;
  override name = "ApiError";

  constructor(status: number, code: string, message?: string) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

const BASE_URL = "";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {}, signal } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  const res = await fetch(BASE_URL + path, {
    method,
    credentials: "include",
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError(res.status, "PARSE_ERROR", "Invalid response");
    }
    throw new ApiError(res.status, "PARSE_ERROR");
  }

  if (!res.ok) {
    const err = json as ApiErrorBody;
    const code = err?.error?.code || "UNKNOWN";
    const message = err?.error?.message;
    throw new ApiError(res.status, code, message);
  }

  const success = json as ApiSuccess<T>;
  return success.data;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  del: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export interface BasicAuth {
  username: string;
  password: string;
}

export async function adminRequest<T>(
  path: string,
  options: RequestOptions = {},
  basicAuth: BasicAuth,
): Promise<T> {
  const token = btoa(`${basicAuth.username}:${basicAuth.password}`);
  const authHeaders: Record<string, string> = {
    Authorization: `Basic ${token}`,
  };

  return request<T>(path, {
    ...options,
    headers: { ...authHeaders, ...options.headers },
  });
}

import { apiClient } from "./client";
import type { User } from "@/types/api";

export function loginWithPassword(username: string, password: string) {
  return apiClient.post<{ message: string; user: User }>(
    "/api/v1/auth/login",
    { username, password },
  );
}

export function logout() {
  return apiClient.post<{ message: string }>("/api/v1/auth/logout");
}

export function getMe() {
  return apiClient.get<{ user: User }>("/api/v1/auth/me");
}

export function setPassword(password: string) {
  return apiClient.post<{ message: string }>("/api/v1/auth/password", {
    password,
  });
}

export function getGithubLoginUrl(): string {
  return "/api/v1/auth/github";
}

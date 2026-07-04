import { apiClient } from "./client";
import type { User } from "@/types/api";

export function getUser(username: string) {
  return apiClient.get<{ user: User }>(
    `/api/v1/users/${encodeURIComponent(username)}`,
  );
}

export interface UpdateMeData {
  display_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
}

export function updateMe(data: UpdateMeData) {
  return apiClient.patch<{ user: User }>("/api/v1/users/me", data);
}

export function deleteMe() {
  return apiClient.del<{ message: string }>("/api/v1/users/me");
}

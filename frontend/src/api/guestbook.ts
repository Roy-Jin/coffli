import { apiClient } from "./client";
import type { GuestbookMessage } from "@/types/api";

export function getGuestbook(username: string) {
  return apiClient.get<{ messages: GuestbookMessage[] }>(
    `/api/v1/users/${encodeURIComponent(username)}/guestbook`,
  );
}

export interface CreateGuestbookData {
  content: string;
  parent_id?: number;
}

export function createMessage(username: string, data: CreateGuestbookData) {
  return apiClient.post<{ message: string; messages: GuestbookMessage[] }>(
    `/api/v1/users/${encodeURIComponent(username)}/guestbook`,
    data,
  );
}

export function deleteMessage(id: number) {
  return apiClient.del<{ message: string }>(`/api/v1/guestbook/${id}`);
}

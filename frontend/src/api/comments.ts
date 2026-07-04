import { apiClient } from "./client";
import type { Comment } from "@/types/api";

export function getComments(slug: string) {
  return apiClient.get<{ comments: Comment[] }>(
    `/api/v1/posts/${encodeURIComponent(slug)}/comments`,
  );
}

export interface CreateCommentData {
  content: string;
  parent_id?: number;
}

export function createComment(slug: string, data: CreateCommentData) {
  return apiClient.post<{ message: string; comments: Comment[] }>(
    `/api/v1/posts/${encodeURIComponent(slug)}/comments`,
    data,
  );
}

export function deleteComment(id: number) {
  return apiClient.del<{ message: string }>(
    `/api/v1/posts/comments/${id}`,
  );
}

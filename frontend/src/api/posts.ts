import { apiClient } from "./client";
import type { Post, Tag, PostStatus } from "@/types/api";

export type GetPostsStatus = PostStatus | "all";

export interface GetPostsParams {
  status?: GetPostsStatus;
  limit?: number;
  offset?: number;
  author?: number;
}

export function getPosts(params?: GetPostsParams) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  if (params?.author !== undefined) query.set("author", String(params.author));
  const qs = query.toString();
  return apiClient.get<{ posts: Post[] }>(
    `/api/v1/posts${qs ? "?" + qs : ""}`,
  );
}

export function getPost(slug: string) {
  return apiClient.get<{ post: Post }>(
    `/api/v1/posts/${encodeURIComponent(slug)}`,
  );
}

export function getAllTags() {
  return apiClient.get<{ tags: Tag[] }>("/api/v1/posts/tags/all");
}

export interface CreatePostData {
  slug: string;
  title: string;
  content: string;
  summary?: string;
  status?: "draft" | "published";
  tags?: string[];
  published_at?: string;
}

export function createPost(data: CreatePostData) {
  return apiClient.post<{ message: string; post: Post }>(
    "/api/v1/posts",
    data,
  );
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  summary?: string;
  status?: PostStatus;
  is_pinned?: boolean;
  tags?: string[];
}

export function updatePost(slug: string, data: UpdatePostData) {
  return apiClient.put<{ message: string; post: Post }>(
    `/api/v1/posts/${encodeURIComponent(slug)}`,
    data,
  );
}

export function deletePost(slug: string) {
  return apiClient.del<{ message: string }>(
    `/api/v1/posts/${encodeURIComponent(slug)}`,
  );
}

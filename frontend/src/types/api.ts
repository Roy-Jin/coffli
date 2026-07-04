export type PostStatus = "draft" | "published" | "archived";

export interface Author {
  id: number;
  github_login: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  id: number;
  github_id: string;
  github_login: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  password_hash: string | null;
  role: string;
  created_at: string;
  last_login_at: string | null;
}

export interface Post {
  id: number;
  author_id: number;
  author: Author;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  cover_image_url: string | null;
  status: PostStatus;
  is_pinned: number;
  view_count: number;
  tags: Tag[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  is_approved: number;
  created_at: string;
  updated_at: string;
  author: Author;
}

export interface GuestbookMessage {
  id: number;
  owner_id: number;
  author_id: number;
  parent_id: number | null;
  content: string;
  is_approved: number;
  created_at: string;
  updated_at: string;
  author: Author;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message?: string;
  };
}

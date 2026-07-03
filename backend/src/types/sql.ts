export interface User {
  id: number;
  // Github 信息 (必填，因为所有账号都源自 Github)
  github_id: string;
  github_login: string; // 这个字段将作为密码登录的 "用户名"
  
  // 可选信息
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null; // Github 提供的邮箱，仅作展示或找回密码用，不用于登录
  
  // 密码信息 (可选，用户主动设置后才有值)
  password_hash: string | null;
  
  // 系统字段
  role: string;
  created_at: string;
  last_login_at: string | null;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface Post {
  id: number;
  author_id: number;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  cover_image_url: string | null;
  status: "draft" | "published" | "archived";
  is_pinned: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
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
}
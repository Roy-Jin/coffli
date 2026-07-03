import { useUserStore } from "@/stores/user";
import { useSettingStore } from "@/stores/setting";

export interface User {
  id: number;
  github_id: string;
  github_login: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  role: string;
  created_at: string;
  last_login_at: string | null;
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
  tags?: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface ApiResponse<T = any> {
  status: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class APIClient {
  private get baseUrl(): string {
    return useSettingStore().getApiBaseUrl;
  }

  private get userStore(): ReturnType<typeof useUserStore> {
    return useUserStore();
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = new URL(path, this.baseUrl);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url.toString(), {
      ...options,
      headers,
      credentials: "include",
    });

    try {
      const json = await response.json();
      return {
        status: response.status,
        data: json.data,
        error: json.error,
      };
    } catch {
      return { status: response.status };
    }
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== "") {
          url.searchParams.append(key, params[key]);
        }
      });
    }
    return this.request<T>(url.pathname + url.search);
  }

  async post<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "DELETE" });
  }

  // ========== Auth ==========

  async login(username: string, password: string): Promise<ApiResponse<{ user: User }>> {
    const res = await this.post<{ user: User }>("/api/v1/auth/login", { username, password });
    if (res.status === 200 && res.data?.user) {
      this.userStore.setUser(res.data.user);
    }
    return res;
  }

  async logout(): Promise<ApiResponse> {
    const res = await this.post("/api/v1/auth/logout");
    this.userStore.clearAuth();
    return res;
  }

  async checkAuth(): Promise<boolean> {
    const res = await this.get<{ user: User }>("/api/v1/auth/me");
    if (res.status === 200 && res.data?.user) {
      this.userStore.setUser(res.data.user);
      return true;
    }
    return false;
  }

  async setPassword(password: string): Promise<ApiResponse> {
    return this.post("/api/v1/auth/password", { password });
  }

  getGithubLoginUrl(): string {
    return new URL("/api/v1/auth/github", this.baseUrl).toString();
  }

  // ========== Users ==========

  async getUserInfo(username: string): Promise<ApiResponse<{ user: User }>> {
    return this.get<{ user: User }>(`/api/v1/users/${encodeURIComponent(username)}`);
  }

  async updateProfile(data: {
    display_name?: string;
    email?: string;
    bio?: string;
    avatar_url?: string;
  }): Promise<ApiResponse<{ user: User }>> {
    const res = await this.patch<{ user: User }>("/api/v1/users/me", data);
    if (res.status === 200 && res.data?.user) {
      this.userStore.setUser(res.data.user);
    }
    return res;
  }

  async deleteAccount(): Promise<ApiResponse> {
    const res = await this.delete("/api/v1/users/me");
    this.userStore.clearAuth();
    return res;
  }

  // ========== Posts ==========

  async getPosts(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ posts: Post[] }>> {
    const query: Record<string, string> = {};
    if (params?.status) query.status = params.status;
    if (params?.limit) query.limit = String(params.limit);
    if (params?.offset) query.offset = String(params.offset);
    return this.get<{ posts: Post[] }>("/api/v1/posts", query);
  }

  async getPost(slug: string): Promise<ApiResponse<{ post: Post }>> {
    return this.get<{ post: Post }>(`/api/v1/posts/${encodeURIComponent(slug)}`);
  }

  async createPost(data: {
    slug: string;
    title: string;
    content: string;
    summary?: string;
    status?: "draft" | "published";
    tags?: string[];
  }): Promise<ApiResponse<{ post: Post }>> {
    return this.post<{ post: Post }>("/api/v1/posts", data);
  }

  async updatePost(slug: string, data: {
    title?: string;
    content?: string;
    summary?: string;
    status?: "draft" | "published" | "archived";
    is_pinned?: boolean;
    tags?: string[];
  }): Promise<ApiResponse<{ post: Post }>> {
    return this.put<{ post: Post }>(`/api/v1/posts/${encodeURIComponent(slug)}`, data);
  }

  async deletePost(slug: string): Promise<ApiResponse> {
    return this.delete(`/api/v1/posts/${encodeURIComponent(slug)}`);
  }

  // ========== Health ==========

  async healthCheck(): Promise<boolean> {
    const res = await this.get("/api/ok");
    return res.status === 200;
  }
}

const apiClient = new APIClient();
export default apiClient;

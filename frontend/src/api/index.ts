import { useUserStore } from "@/stores/user";
import { useSettingStore } from "@/stores/setting";

// 统一响应格式
interface ApiResponse<T = any> {
  status: number;
  data?: T;
  meta?: {
    token?: string;
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// 用户信息接口
interface User {
  username: string;
  nickname: string;
  last_login: number;
  deleted_at: number;
  password: string;
  role: string;
  gender: number;
  reg_time: number;
  active: boolean;
  avatar: boolean;
  id: number;
  info: any; // JSON格式的字符串，包含ip、email、phone、birthday、bio等信息
}

// 博客接口
interface Blog {
  id: number;
  user_id: string;
  title: string;
  desc: string;
  created_at: number;
  updated_at: number;
  active: boolean;
}

class APIClient {
  private baseUrl: string;
  private userStore: ReturnType<typeof useUserStore>;

  constructor() {
    this.baseUrl = useSettingStore().getApiBaseUrl;
    this.userStore = useUserStore();
  }

  // 获取认证头信息
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // 添加认证头信息
    const token = this.userStore.getToken;

    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }

    return headers;
  }

  // 基础请求方法
  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = new URL(path, this.baseUrl);
    const authHeaders = await this.getAuthHeaders();

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });

    try {
      const data = await response.json();
      return {
        status: response.status,
        data: data.data,
        meta: data.meta,
        error: data.error,
      };
    } catch (error: any) {
      return {
        status: response.status,
        error,
      };
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  // GET请求
  async get<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });
    }
    return this.request<T>(url.pathname + url.search);
  }

  // POST请求
  async post<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PATCH请求
  async patch<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT请求
  async put<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? body : undefined,
      headers: {
        "Content-Type": body.type,
      },
    });
  }

  // DELETE请求
  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "DELETE",
    });
  }

  // ========== 用户管理接口 ==========

  // 用户注册
  async register(userData: {
    username: string;
    password: string;
    nickname?: string;
  }): Promise<ApiResponse> {
    return this.post("/api/v1/auth/register", userData);
  }

  // 用户登录
  async login(credentials: {
    username: string;
    password: string;
  }): Promise<ApiResponse<ApiResponse>> {
    const response = await this.post<ApiResponse>(
      "/api/v1/auth/login",
      credentials,
    );

    if (response.status === 200 && response.data) {
      this.userStore.setUser(response.data);
      this.userStore.setToken(response.meta?.token || "");
    }

    return response;
  }

  // 用户登出
  async logout(): Promise<ApiResponse> {
    const response = await this.post("/api/v1/auth/logout");

    if (response.status === 200) {
      this.userStore.clearAuth();
    }

    return response;
  }

  // 获取用户信息
  async getUserInfo(username?: string): Promise<ApiResponse<User>> {
    const response = await this.get<User>(
      "/api/v1/users/" + (username || this.userStore.getUsername),
    );
    return response;
  }

  // 更新用户信息
  async updateUserInfo(userData: {
    nickname?: string;
    gender?: number;
    info?: any;
  }): Promise<ApiResponse> {
    return this.patch("/api/v1/users/" + this.userStore.getUsername, userData);
  }

  // 更新用户头像
  async updateUserAvatar(avatar: File): Promise<ApiResponse> {
    this.userStore.setUser({...this.userStore.getUser, avatar: false });
    return this.put(
      "/api/v1/users/" + this.userStore.getUsername + "/avatar",
      avatar,
    );
  }

  async checkAuth(): Promise<boolean> {
    const response = await this.get<User>("/api/v1/auth");
    if (response.status === 401) {
      return false;
    }
    return true;
  }

  // ========== 博客管理接口 ==========

  // 获取博客
  async getBlog(blogId: string): Promise<ApiResponse<Blog>> {
    return this.get<Blog>("/api/v1/posts/" + blogId);
  }

  // 创建博客
  async createBlog(blogData: {
    title: string;
    content: string;
  }): Promise<ApiResponse> {
    return this.post("/api/v1/posts", blogData);
  }

  // 删除博客
  async deleteBlog(blogId: string): Promise<ApiResponse> {
    return this.delete("/api/v1/posts/delete/" + blogId);
  }

  // 健康检查
  async healthCheck(): Promise<ApiResponse<string>> {
    return this.get<string>("/");
  }
}

// 创建单例实例
const apiClient = new APIClient();

export default apiClient;

import { useSettingStore } from '@/stores/setting'

interface ApiResponse<T = any> {
  status: number
  data?: T
  error?: {
    code: string
    message?: string
    meta?: Record<string, unknown>
  }
}

class AdminApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = useSettingStore().getApiBaseUrl
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = new URL(path, this.baseUrl)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }

    const response = await fetch(url.toString(), { ...options, headers })

    try {
      const json = await response.json()
      return {
        status: response.status,
        data: json.data,
        error: json.error,
      }
    } catch {
      return { status: response.status }
    }
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path)
  }

  async post<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

const adminApi = new AdminApiClient()
export default adminApi

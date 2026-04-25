import { API_BASE_URL, API_ENDPOINTS } from './endpoints'
import type { ApiResponse, User } from './types'

class ApiClient {
  private baseUrl: string = API_BASE_URL
  private token: string | null = null
  private refreshToken: string | null = null
  private deviceId: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
      this.refreshToken = localStorage.getItem('refresh_token')
      this.deviceId = localStorage.getItem('device_id')

      if (!this.deviceId) {
        this.deviceId = crypto.randomUUID()
        localStorage.setItem('device_id', this.deviceId)
      }
    }
  }

  setToken(token: string, refreshToken?: string) {
    this.token = token
    this.refreshToken = refreshToken || null

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }
    }
  }

  clearToken() {
    this.token = null
    this.refreshToken = null

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  getDeviceId(): string {
    return this.deviceId || 'unknown'
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Device-Id': this.getDeviceId(),
      'X-Client-Version': '1.0.0',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data: ApiResponse<T> & { message?: string } = await response.json()

    if (!response.ok) {
      if (response.status === 401 && this.refreshToken) {
        await this.refreshAccessToken()
        throw new Error('TOKEN_REFRESHED')
      }

      throw new Error(data.message || `HTTP ${response.status}`)
    }

    return data
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      })

      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_REFRESHED') {
        return this.request<T>(endpoint, options)
      }
      throw error
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.auth.refresh}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      })

      if (response.ok) {
        const data: { success?: boolean; data?: { token?: string; refreshToken?: string } } = await response.json()
        if (data.success && data.data) {
          this.setToken(data.data.token || '', data.data.refreshToken || '')
          return true
        }
      }

      this.clearToken()
      return false
    } catch {
      this.clearToken()
      return false
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async register(
    email: string,
    password: string,
    name: string,
    userType: 'student' | 'teacher' = 'student'
  ): Promise<ApiResponse<{ user: Omit<User, 'passwordHash'>; token?: string; refreshToken?: string }>> {
    return this.post(API_ENDPOINTS.auth.register, { email, password, name, userType })
  }

  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: Omit<User, 'passwordHash'>; token: string; refreshToken: string }>> {
    const response = await this.post<{ user: Omit<User, 'passwordHash'>; token: string; refreshToken: string }>(API_ENDPOINTS.auth.login, {
      email,
      password,
      deviceId: this.getDeviceId(),
    })

    if (response.success && response.data) {
      this.setToken(response.data.token, response.data.refreshToken)
    }

    return response
  }

  async logout(): Promise<void> {
    try {
      await this.post(API_ENDPOINTS.auth.logout)
    } finally {
      this.clearToken()
    }
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: Omit<User, 'passwordHash'> }>> {
    return this.get(API_ENDPOINTS.auth.me)
  }

  isAuthenticated(): boolean {
    return !!this.token
  }
}

export const apiClient = new ApiClient()
export default apiClient

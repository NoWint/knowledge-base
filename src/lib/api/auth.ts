import { apiClient } from './api-client'
import { API_ENDPOINTS } from './endpoints'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  expiresAt: string
}

export interface RegisterRequest {
  username: string
  password: string
  name: string
  email?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar: string | null
  createdAt: string
  updatedAt: string
}

class AuthApi {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.auth.login, credentials)
    return response.data!
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.auth.login.replace('/login', '/register'), data)
    return response.data!
  }

  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.auth.logout)
    this.clearToken()
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>(API_ENDPOINTS.auth.me)
    return response.data!
  }

  async refreshToken(): Promise<{ token: string; expiresAt: string }> {
    const response = await apiClient.post<{ token: string; expiresAt: string }>(API_ENDPOINTS.auth.refresh)
    return response.data!
  }

  setToken(token: string, expiresAt?: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
      if (expiresAt) {
        localStorage.setItem('auth_token_expires', expiresAt)
      }
    }
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_token_expires')
    }
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    const token = localStorage.getItem('auth_token')
    const expiresAt = localStorage.getItem('auth_token_expires')
    if (!token) return false
    if (expiresAt) {
      return new Date(expiresAt) > new Date()
    }
    return true
  }
}

export const authApi = new AuthApi()

export function setupAuthInterceptor(
  onUnauthorized: () => void,
  onTokenRefresh?: () => Promise<void>
): void {
  if (typeof window === 'undefined') return

  const originalFetch = window.fetch
  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init)

    if (response.status === 401) {
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          if (onTokenRefresh) {
            await onTokenRefresh()
          }
          return originalFetch(input, init)
        } catch {
          onUnauthorized()
        }
      } else {
        onUnauthorized()
      }
    }

    return response
  }
}

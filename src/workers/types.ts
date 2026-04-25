export interface Env {
  USERS_KV: KVNamespace
  SYNC_KV: KVNamespace
  SUBSCRIPTIONS_KV: KVNamespace
  DB: D1Database
  JWT_SECRET: string
  ENVIRONMENT?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
  subscription?: Subscription
}

export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'cancelled' | 'expired'
  expiresAt: string
  createdAt: string
}

export interface SyncRecord {
  id: string
  userId: string
  tableName: string
  operation: 'create' | 'update' | 'delete'
  recordId: string
  data: string
  timestamp: number
  synced: boolean
}

export interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

export interface AuthUser {
  id: string
  email: string
  name: string
  userType: 'student' | 'teacher'
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: Date.now(),
  }
}

export function createErrorResponse(error: string): ApiResponse {
  return {
    success: false,
    error,
    timestamp: Date.now(),
  }
}
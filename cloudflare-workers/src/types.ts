/// <reference types="@cloudflare/workers-types" />

export interface Env {
  USERS_KV: KVNamespace
  SYNC_KV: KVNamespace
  SUBSCRIPTIONS_KV: KVNamespace
  JWT_SECRET: string
  API_BASE_URL: string
}

export interface User {
  id: string
  email: string
  passwordHash: string
  name: string
  userType: 'student' | 'teacher' | 'admin'
  schoolId?: string
  subscriptionId?: string
  subscriptionPlan: 'free' | 'pro' | 'enterprise'
  deviceIds: string[]
  createdAt: number
  updatedAt: number
}

export interface SyncRecord {
  id: string
  userId: string
  deviceId: string
  tableName: string
  recordId: string
  operation: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
  timestamp: number
  synced: boolean
}

export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'cancelled' | 'expired'
  startDate: number
  endDate: number
  deviceLimit: number
  studentLimit: number
  price: number
  autoRenew: boolean
}

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: number
}

export interface AuthPayload {
  userId: string
  email: string
  userType: string
  iat: number
  exp: number
}

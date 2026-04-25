export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: number
}

export interface User {
  id: string
  email: string
  name: string
  userType: 'student' | 'teacher' | 'admin'
  schoolId?: string
  subscriptionId?: string
  subscriptionPlan: 'free' | 'pro' | 'enterprise'
  deviceIds: string[]
  createdAt: number
  updatedAt: number
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

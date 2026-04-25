import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/lib/db/database'
import { apiClient } from '@/lib/api/api-client'

interface AuthUser {
  id: string
  email: string
  name: string
  userType: 'student' | 'teacher'
  createdAt: Date
  updatedAt: Date
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setUser: (user: AuthUser | null) => void
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string, userType?: 'student' | 'teacher') => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

interface UserRecord {
  id: string
  name: string
  avatar: string | null
  passwordHash?: string
  email?: string
  userType?: 'student' | 'teacher'
  createdAt: Date
  updatedAt: Date
  [key: string]: unknown
}

function toAuthUser(userRecord: UserRecord): AuthUser {
  return {
    id: userRecord.id,
    email: userRecord.email || '',
    name: userRecord.name,
    userType: userRecord.userType || 'student',
    createdAt: userRecord.createdAt,
    updatedAt: userRecord.updatedAt,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const userRecord = await db.users.where('name').equals(email).first() as UserRecord | undefined
          if (!userRecord) {
            set({ error: '用户不存在', isLoading: false })
            return false
          }

          const passwordHash = await hashPassword(password)
          const storedHash = userRecord.passwordHash
          if (storedHash && storedHash !== passwordHash) {
            set({ error: '密码错误', isLoading: false })
            return false
          }

          const authUser = toAuthUser(userRecord)
          localStorage.setItem('currentUserId', userRecord.id)
          set({
            user: authUser,
            isAuthenticated: true,
            isLoading: false,
          })
          return true
        } catch (error) {
          console.error('Login error:', error)
          set({ error: '登录失败', isLoading: false })
          return false
        }
      },

      register: async (email, password, name, userType = 'student') => {
        set({ isLoading: true, error: null })
        try {
          const now = new Date()
          const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const passwordHash = await hashPassword(password)

          const newUser: AuthUser = {
            id: userId,
            email,
            name,
            userType,
            createdAt: now,
            updatedAt: now,
          }

          await db.users.add({
            id: userId,
            name,
            avatar: null,
            passwordHash,
            email,
            userType,
            createdAt: now,
            updatedAt: now,
          } as unknown as Parameters<typeof db.users.add>[0])

          await db.userProfiles.add({
            id: `profile_${userId}`,
            userId,
            currentGrade: '',
            preferences: {},
            createdAt: now,
            updatedAt: now,
          } as unknown as Parameters<typeof db.userProfiles.add>[0])

          localStorage.setItem('currentUserId', userId)
          set({
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
          })

          try {
            const response = await apiClient.register(email, password, name, userType)
            if (response.success && response.data) {
              console.log('Remote registration successful')
            }
          } catch {
            console.log('Remote API not available, local registration used')
          }

          return true
        } catch (error) {
          console.error('Register error:', error)
          set({ error: '注册失败', isLoading: false })
          return false
        }
      },

      logout: async () => {
        localStorage.removeItem('currentUserId')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      checkAuth: async () => {
        try {
          const currentUserId = localStorage.getItem('currentUserId')
          if (currentUserId) {
            const userRecord = await db.users.get(currentUserId) as UserRecord | undefined
            if (userRecord) {
              const authUser = toAuthUser(userRecord)
              set({
                user: authUser,
                isAuthenticated: true,
              })
              return
            }
          }
          set({ user: null, isAuthenticated: false })
        } catch (error) {
          console.error('Check auth error:', error)
          set({ user: null, isAuthenticated: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

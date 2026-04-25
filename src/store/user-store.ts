import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db, runMigrations } from '@/lib/db/database'
import type { User, UserProfile } from '@/types'

interface UserState {
  currentUser: User | null
  userProfile: UserProfile | null
  isLoading: boolean
  isInitialized: boolean
  setCurrentUser: (user: User) => Promise<void>
  clearCurrentUser: () => void
  initializeUser: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      userProfile: null,
      isLoading: false,
      isInitialized: false,
      setCurrentUser: async (user: User) => {
        localStorage.setItem('currentUserId', user.id)
        const profile = await db.userProfiles.where('userId').equals(user.id).first()
        set({ currentUser: user, userProfile: profile || null })
      },
      clearCurrentUser: () => {
        localStorage.removeItem('currentUserId')
        set({ currentUser: null, userProfile: null })
      },
      initializeUser: async () => {
        if (useUserStore.getState().isInitialized) return
        set({ isLoading: true })
        try {
          await runMigrations()
          
          const currentUserId = localStorage.getItem('currentUserId')
          if (currentUserId) {
            const user = await db.users.get(currentUserId)
            if (user) {
              const profile = await db.userProfiles.where('userId').equals(currentUserId).first()
              set({ currentUser: user, userProfile: profile || null, isInitialized: true })
              return
            }
          }

          const firstUser = await db.users.orderBy('createdAt').first()
          if (firstUser) {
            const profile = await db.userProfiles.where('userId').equals(firstUser.id).first()
            set({ currentUser: firstUser, userProfile: profile || null, isInitialized: true })
            localStorage.setItem('currentUserId', firstUser.id)
          } else {
            set({ isInitialized: true })
          }
        } catch (error) {
          console.error('Failed to initialize user:', error)
          set({ isInitialized: true })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SubscriptionTier, Subscription, UsageStats } from './plans'

interface SubscriptionState {
  subscription: Subscription | null
  usageStats: UsageStats
  isLoading: boolean
  setSubscription: (subscription: Subscription | null) => void
  setUsageStats: (stats: UsageStats) => void
  updateUsage: (updates: Partial<UsageStats>) => void
  clearSubscription: () => void
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      subscription: null,
      usageStats: {
        studentCount: 0,
        deviceCount: 1,
        totalQuestions: 0,
        classesCount: 0,
      },
      isLoading: false,
      setSubscription: (subscription) => set({ subscription }),
      setUsageStats: (stats) => set({ usageStats: stats }),
      updateUsage: (updates) =>
        set((state) => ({
          usageStats: { ...state.usageStats, ...updates },
        })),
      clearSubscription: () =>
        set({
          subscription: null,
          usageStats: {
            studentCount: 0,
            deviceCount: 1,
            totalQuestions: 0,
            classesCount: 0,
          },
        }),
    }),
    {
      name: 'subscription-storage',
    }
  )
)

export function useSubscription(): Subscription | null {
  return useSubscriptionStore((state) => state.subscription)
}

export function useSubscriptionTier(): SubscriptionTier {
  const subscription = useSubscription()
  return subscription?.planId ?? 'FREE'
}

export function useUsageStats(): UsageStats {
  return useSubscriptionStore((state) => state.usageStats)
}
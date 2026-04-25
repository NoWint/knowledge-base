import { useEffect } from 'react'
import { useSubscriptionStore, useSubscriptionTier } from './store'
import { isLimitExceeded, getFeatureLimit } from './plans'

const DEVICE_ID_KEY = 'device_id'

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server'

  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

export function useUsageTracker() {
  const { updateUsage, usageStats } = useSubscriptionStore()
  const tier = useSubscriptionTier()

  useEffect(() => {
    getOrCreateDeviceId()
    updateUsage({ deviceCount: 1 })
  }, [updateUsage])

  async function trackStudentAdded(): Promise<boolean> {
    const currentCount = usageStats.studentCount
    if (isLimitExceeded(tier, 'students', currentCount)) {
      return false
    }
    updateUsage({ studentCount: currentCount + 1 })
    return true
  }

  async function trackStudentRemoved(): Promise<void> {
    const currentCount = usageStats.studentCount
    if (currentCount > 0) {
      updateUsage({ studentCount: currentCount - 1 })
    }
  }

  async function trackQuestionAnswered(): Promise<void> {
    updateUsage({ totalQuestions: usageStats.totalQuestions + 1 })
  }

  async function trackClassCreated(): Promise<boolean> {
    const currentCount = usageStats.classesCount
    if (isLimitExceeded(tier, 'classes', currentCount)) {
      return false
    }
    updateUsage({ classesCount: currentCount + 1 })
    return true
  }

  async function trackClassDeleted(): Promise<void> {
    const currentCount = usageStats.classesCount
    if (currentCount > 0) {
      updateUsage({ classesCount: currentCount - 1 })
    }
  }

  return {
    trackStudentAdded,
    trackStudentRemoved,
    trackQuestionAnswered,
    trackClassCreated,
    trackClassDeleted,
  }
}

function useLimitInfo(limitType: 'students' | 'devices' | 'classes' | 'questions') {
  const tier = useSubscriptionTier()
  const { usageStats } = useSubscriptionStore()

  const limit = getFeatureLimit(tier, limitType)
  const current = limitType === 'students' ? usageStats.studentCount
    : limitType === 'devices' ? usageStats.deviceCount
    : limitType === 'classes' ? usageStats.classesCount
    : usageStats.totalQuestions
  const isExceeded = isLimitExceeded(tier, limitType, current)
  const remaining = limit === -1 ? -1 : Math.max(0, limit - current)

  return {
    limit,
    current,
    remaining,
    isExceeded,
    isUnlimited: limit === -1,
  }
}

export function useStudentLimit() {
  return useLimitInfo('students')
}

export function useDeviceLimit() {
  return useLimitInfo('devices')
}

export function useClassLimit() {
  return useLimitInfo('classes')
}

export function useQuestionLimit() {
  return useLimitInfo('questions')
}

export function useUsageBar(type: 'students' | 'devices' | 'classes' | 'questions') {
  const { limit, current, remaining, isExceeded, isUnlimited } = useLimitInfo(type)
  const percentage = limit === -1 ? 0 : Math.min(100, (current / limit) * 100)

  return {
    limit,
    current,
    remaining,
    isExceeded,
    isUnlimited,
    percentage,
  }
}

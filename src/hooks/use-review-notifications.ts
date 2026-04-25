"use client"

import { useEffect, useCallback } from "react"
import { db } from "@/lib/db/database"
import { checkDueReviews, scheduleReviewReminder } from "@/lib/notifications/review-notification"
import { useUserStore } from "@/store/user-store"

export function useReviewNotifications() {
  const { currentUser } = useUserStore()

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }, [])

  const scheduleNotifications = useCallback(async () => {
    if (!currentUser) return

    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) return

    try {
      const reminders = await checkDueReviews(currentUser.id)
      for (const reminder of reminders) {
        await scheduleReviewReminder(reminder)
      }
    } catch (error) {
      console.error('Failed to schedule notifications:', error)
    }
  }, [currentUser, requestNotificationPermission])

  useEffect(() => {
    if (currentUser) {
      scheduleNotifications()
    }
  }, [currentUser, scheduleNotifications])

  return {
    requestNotificationPermission,
    scheduleNotifications,
  }
}
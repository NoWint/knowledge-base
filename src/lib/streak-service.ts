import { db } from '@/lib/db/database'
import type { UserStreak } from '@/types'

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return getDateString(yesterday) === dateStr
}

function isToday(dateStr: string): boolean {
  return getDateString(new Date()) === dateStr
}

export async function getUserStreak(userId: string): Promise<UserStreak | null> {
  return (await db.userStreaks.where('userId').equals(userId).first()) ?? null
}

export async function getOrCreateUserStreak(userId: string): Promise<UserStreak> {
  let streak = await getUserStreak(userId)

  if (!streak) {
    streak = {
      id: `streak_${userId}`,
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      totalStudyDays: 0,
      lastUpdated: new Date(),
    }
    await db.userStreaks.add(streak)
  }

  return streak
}

export async function recordStudyActivity(userId: string): Promise<UserStreak> {
  const streak = await getOrCreateUserStreak(userId)
  const today = getDateString(new Date())

  if (streak.lastStudyDate === today) {
    return streak
  }

  let newStreak = 1

  if (streak.lastStudyDate && isYesterday(streak.lastStudyDate)) {
    newStreak = streak.currentStreak + 1
  }

  const longestStreak = Math.max(streak.longestStreak, newStreak)
  const totalStudyDays = streak.lastStudyDate ? streak.totalStudyDays + 1 : 1

  const updatedStreak: UserStreak = {
    ...streak,
    currentStreak: newStreak,
    longestStreak,
    lastStudyDate: today,
    totalStudyDays,
    lastUpdated: new Date(),
  }

  await db.userStreaks.put(updatedStreak)

  return updatedStreak
}

export async function checkAndUpdateStreak(userId: string): Promise<UserStreak> {
  const streak = await getOrCreateUserStreak(userId)
  const today = getDateString(new Date())

  if (streak.lastStudyDate === today) {
    return streak
  }

  if (!streak.lastStudyDate || (!isYesterday(streak.lastStudyDate) && streak.lastStudyDate !== today)) {
    if (streak.currentStreak > 0 && streak.lastStudyDate) {
      return streak
    }
  }

  return recordStudyActivity(userId)
}

export function getStreakMilestone(streak: number): {
  level: string
  emoji: string
  next: number
} {
  if (streak >= 365) return { level: '学神', emoji: '👑', next: -1 }
  if (streak >= 100) return { level: '学霸', emoji: '🎓', next: 365 }
  if (streak >= 30) return { level: '学魔', emoji: '🧙', next: 100 }
  if (streak >= 7) return { level: '学痞', emoji: '😎', next: 30 }
  if (streak >= 3) return { level: '学员', emoji: '📚', next: 7 }
  return { level: '小白', emoji: '🌱', next: 3 }
}

export function isStreakAtRisk(lastStudyDate: string | null): boolean {
  if (!lastStudyDate) return false
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return getDateString(yesterday) === lastStudyDate
}

export function getMotivationalMessage(streak: number): string {
  if (streak === 0) return '今天开始你的学习之旅吧！🚀'
  if (streak === 1) return '第一天！好的开始是成功的一半！💪'
  if (streak < 7) return `已经连续学习 ${streak} 天了，继续保持！🔥`
  if (streak < 30) return `太棒了！${streak} 天连续学习！🌟`
  if (streak < 100) return `令人惊叹！${streak} 天坚持！🏆`
  return `你是学习界的传奇！${streak} 天！👑`
}

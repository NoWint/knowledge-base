"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Flame, Trophy, Calendar, Sparkles } from "lucide-react"
import { useUserStore } from "@/store/user-store"
import { getUserStreak, checkAndUpdateStreak, getStreakMilestone, getMotivationalMessage } from "@/lib/streak-service"
import type { UserStreak } from "@/types"

export function StreakDisplay() {
  const { currentUser } = useUserStore()
  const [streak, setStreak] = useState<UserStreak | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    async function loadStreak() {
      try {
        const updatedStreak = await checkAndUpdateStreak(currentUser.id)
        setStreak(updatedStreak)
      } catch (error) {
        console.error("Failed to load streak:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStreak()
  }, [currentUser])

  if (!currentUser || loading) {
    return null
  }

  if (!streak) {
    return null
  }

  const milestone = getStreakMilestone(streak.currentStreak)
  const message = getMotivationalMessage(streak.currentStreak)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={streak.currentStreak > 0 ? {
              scale: [1, 1.2, 1],
            } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
          >
            <Flame className="w-7 h-7" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{streak.currentStreak}</span>
              <span className="text-sm opacity-90">天连续学习</span>
            </div>
            <div className="flex items-center gap-1 text-xs opacity-80">
              <Trophy className="w-3 h-3" />
              <span>{milestone.emoji} {milestone.level}</span>
              {milestone.next > 0 && (
                <span>再坚持 {milestone.next - streak.currentStreak} 天升级！</span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-xs opacity-80">
            <Calendar className="w-3 h-3" />
            <span>最长: {streak.longestStreak} 天</span>
          </div>
          <div className="flex items-center gap-1 text-xs opacity-80 mt-1">
            <Sparkles className="w-3 h-3" />
            <span>共 {streak.totalStudyDays} 天</span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 pt-3 border-t border-white/20"
      >
        <p className="text-sm font-medium">{message}</p>
      </motion.div>
    </motion.div>
  )
}

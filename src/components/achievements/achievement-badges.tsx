"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, Lock, Check } from "lucide-react"
import { useUserStore } from "@/store/user-store"
import { checkAchievements, type UserAchievement } from "@/lib/achievements"
import { getUserStreak } from "@/lib/streak-service"
import { db } from "@/lib/db/database"

export function AchievementBadges() {
  const { currentUser } = useUserStore()
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    async function loadAchievements() {
      try {
        const streak = await getUserStreak(currentUser.id)
        const answers = await db.userAnswers.where("userId").equals(currentUser.id).toArray()

        const correctAnswers = answers.filter(a => a.isCorrect).length
        const stats = {
          currentStreak: streak?.currentStreak || 0,
          totalQuestions: answers.length,
          correctAnswers,
          subjectsStudied: 0,
          chaptersStudied: 0,
          knowledgePointsStudied: 0,
          studyDays: streak?.totalStudyDays || 0,
        }

        const userAchievements = checkAchievements(stats)
        setAchievements(userAchievements)
      } catch (error) {
        console.error("Failed to load achievements:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAchievements()
  }, [currentUser])

  if (!currentUser || loading) {
    return null
  }

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const totalCount = achievements.length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900">成就徽章</h3>
        </div>
        <span className="text-sm text-gray-500">
          {unlockedCount} / {totalCount}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {achievements.slice(0, 8).map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative flex flex-col items-center p-2 rounded-xl transition-all
                ${achievement.isUnlocked
                  ? "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"
                  : "bg-gray-50 border border-gray-200 opacity-60"
                }
              `}
            >
              <div className="text-2xl mb-1">
                {achievement.isUnlocked ? achievement.icon : "🔒"}
              </div>
              <div className="text-xs text-center font-medium text-gray-700 truncate w-full">
                {achievement.name}
              </div>

              {achievement.isUnlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}

              {!achievement.isUnlocked && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-xl overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(achievement.progress / achievement.requirement) * 100}%` }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

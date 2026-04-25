"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { motion, AnimatePresence } from "framer-motion"
import { Target, Plus, CheckCircle, Clock, TrendingUp, X, Flame } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import type { LearningGoal, GoalType, GoalStatus } from "@/types"
import { getAllKnowledgePoints } from "@/lib/data-access/subject-data"

const GOAL_TYPE_CONFIG: Record<GoalType, { label: string; icon: typeof Target; color: string; unit: string }> = {
  daily_questions: { label: "每日答题", icon: Target, color: "from-blue-500 to-blue-600", unit: "题" },
  weekly_streak: { label: "连续学习", icon: Flame, color: "from-orange-500 to-red-500", unit: "天" },
  mastery_level: { label: "掌握度", icon: TrendingUp, color: "from-green-500 to-emerald-600", unit: "%" },
}

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: "进行中", color: "text-blue-600", bgColor: "bg-blue-50" },
  completed: { label: "已完成", color: "text-green-600", bgColor: "bg-green-50" },
  expired: { label: "已过期", color: "text-gray-500", bgColor: "bg-gray-50" },
}

function isToday(date: Date): boolean {
  const today = new Date()
  return date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sortedDates = [...new Set(dates)].sort().reverse()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i - 1])
    const prev = new Date(sortedDates[i])
    const diffDays = (current.getTime() - prev.getTime()) / 86400000
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export default function GoalsPage() {
  const { currentUser } = useUserStore()
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [todayAnswers, setTodayAnswers] = useState(0)
  const [streak, setStreak] = useState(0)
  const [avgMastery, setAvgMastery] = useState(0)

  const [newGoal, setNewGoal] = useState({
    type: "daily_questions" as GoalType,
    targetValue: 10,
  })

  useEffect(() => {
    if (currentUser) {
      loadGoals()
      loadProgress()
    }
  }, [currentUser])

  async function loadGoals() {
    if (!currentUser) return
    setLoading(true)
    try {
      const userGoals = await db.learningGoals.where("userId").equals(currentUser.id).toArray()
      setGoals(userGoals)
    } catch (err) {
      console.error("Failed to load goals:", err)
    } finally {
      setLoading(false)
    }
  }

  async function loadProgress() {
    if (!currentUser) return
    try {
      const answers = await db.userAnswers.where("userId").equals(currentUser.id).toArray()
      const todayCount = answers.filter(a => isToday(new Date(a.answeredAt))).length
      setTodayAnswers(todayCount)

      const stats = await db.dailyStats.where("userId").equals(currentUser.id).toArray()
      const dates = stats.map(s => s.date)
      setStreak(calculateStreak(dates))

      const userAnswers = await db.userAnswers.where("userId").equals(currentUser.id).toArray()
      const answeredQuestionIds = new Set(userAnswers.map(a => a.questionId))
      const answeredQuestions = await db.questions.where("id").anyOf(Array.from(answeredQuestionIds)).toArray()
      const answeredKpIds = new Set(answeredQuestions.map(q => q.knowledgePointId))
      const allKps = await getAllKnowledgePoints()
      const studiedKps = allKps.filter(kp => answeredKpIds.has(kp.id))

      if (studiedKps.length > 0) {
        const avg = studiedKps.reduce((sum, kp) => sum + (kp.masteryLevel || 0), 0) / studiedKps.length
        setAvgMastery(Math.round(avg * 100))
      }
    } catch (err) {
      console.error("Failed to load progress:", err)
    }
  }

  async function createGoal() {
    if (!currentUser) return
    const now = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)

    const goal: LearningGoal = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      type: newGoal.type,
      targetValue: newGoal.targetValue,
      currentValue: 0,
      startDate: now,
      endDate,
      status: "active",
    }

    await db.learningGoals.add(goal)
    setShowCreateModal(false)
    setNewGoal({ type: "daily_questions", targetValue: 10 })
    loadGoals()
  }

  async function updateGoalStatus(id: string, status: GoalStatus) {
    await db.learningGoals.update(id, { status })
    loadGoals()
  }

  async function deleteGoal(id: string) {
    await db.learningGoals.delete(id)
    loadGoals()
  }

  function getCurrentValue(goal: LearningGoal): number {
    switch (goal.type) {
      case "daily_questions":
        return todayAnswers
      case "weekly_streak":
        return streak
      case "mastery_level":
        return avgMastery
      default:
        return goal.currentValue
    }
  }

  function getProgressPercentage(goal: LearningGoal): number {
    const current = getCurrentValue(goal)
    return Math.min(100, Math.round((current / goal.targetValue) * 100))
  }

  function isGoalExpired(goal: LearningGoal): boolean {
    return new Date() > new Date(goal.endDate)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Target className="h-12 w-12 animate-pulse text-gray-400" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: smoothEase }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">学习目标</h1>
              <p className="text-sm text-gray-500">设定目标，追踪学习进度</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium shadow-sm hover:shadow"
          >
            <Plus className="h-4 w-4" />
            创建目标
          </motion.button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "今日答题", value: todayAnswers, icon: Target, color: "text-blue-600", bgColor: "bg-blue-50" },
            { label: "连续学习", value: `${streak}天`, icon: Flame, color: "text-orange-600", bgColor: "bg-orange-50" },
            { label: "平均掌握度", value: `${avgMastery}%`, icon: TrendingUp, color: "text-green-600", bgColor: "bg-green-50" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25, ease: smoothEase }}
              className={`rounded-lg ${stat.bgColor} p-3`}
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {goals.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <Target className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">暂无学习目标</p>
              <p className="text-gray-400 text-sm mt-1">创建目标，开启你的学习之旅</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
              >
                创建第一个目标
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {goals.map((goal, index) => {
                  const config = GOAL_TYPE_CONFIG[goal.type]
                  const statusConfig = STATUS_CONFIG[goal.status]
                  const progress = getProgressPercentage(goal)
                  const current = getCurrentValue(goal)
                  const expired = isGoalExpired(goal)

                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ delay: index * 0.03, duration: 0.25, ease: smoothEase }}
                      className="rounded-xl border bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${config.color} text-white`}>
                            <config.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{config.label}</h3>
                            <p className="text-xs text-gray-500">
                              {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">当前进度</span>
                          <span className="font-medium text-gray-900">
                            {current} / {goal.targetValue} {config.unit}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: smoothEase }}
                            className={`h-full rounded-full ${
                              progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-blue-500" : "bg-orange-500"
                            }`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">{progress}%</p>
                      </div>

                      {goal.status === "active" && progress >= 100 && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => updateGoalStatus(goal.id, "completed")}
                          className="w-full py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          标记完成
                        </motion.button>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: smoothEase }}
              className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">创建学习目标</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">目标类型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(GOAL_TYPE_CONFIG) as GoalType[]).map(type => {
                      const config = GOAL_TYPE_CONFIG[type]
                      return (
                        <button
                          key={type}
                          onClick={() => setNewGoal({ ...newGoal, type })}
                          className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                            newGoal.type === type
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <config.icon className={`h-5 w-5 mx-auto mb-1 ${
                            newGoal.type === type ? "text-blue-500" : "text-gray-400"
                          }`} />
                          <p className={`text-xs font-medium ${
                            newGoal.type === type ? "text-blue-700" : "text-gray-600"
                          }`}>{config.label}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    目标值 ({GOAL_TYPE_CONFIG[newGoal.type].unit})
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={newGoal.targetValue}
                      onChange={e => setNewGoal({ ...newGoal, targetValue: parseInt(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">{GOAL_TYPE_CONFIG[newGoal.type].unit}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={createGoal}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium hover:from-blue-600 hover:to-indigo-700"
                  >
                    创建目标
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
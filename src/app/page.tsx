"use client"

import { useEffect, useState } from "react"
import { useUserStore } from "@/store/user-store"
import { db } from "@/lib/db/database"
import { motion } from "framer-motion"
import { AppLayout } from "@/components/layout/app-layout"
import dynamic from "next/dynamic"
import { StreakDisplay } from "@/components/streak/streak-display"
import { AchievementBadges } from "@/components/achievements/achievement-badges"
import {
  BookOpen,
  PenTool,
  AlertCircle,
  BarChart3,
  FolderOpen,
  Network,
  Target,
  Trophy,
  TrendingUp,
  Sparkles,
  Flame,
  Brain,
  Layers,
  Zap,
} from "lucide-react"

const NebulaKnowledgeGraph = dynamic(
  () => import("@/components/graph/nebula-graph").then(mod => ({ default: mod.NebulaKnowledgeGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-xs text-white/50">加载知识星云...</p>
        </div>
      </div>
    ),
  }
)

const springConfig = { type: "spring", stiffness: 300, damping: 25, mass: 0.8 }
const smoothEase = [0.25, 0.1, 0.25, 1]

export default function Home() {
  const { currentUser, initializeUser } = useUserStore()
  const [stats, setStats] = useState({ totalAnswers: 0, accuracy: 0, wrongCount: 0, studyDays: 1 })
  const [activeGoal, setActiveGoal] = useState<{ type: string; target: number; current: number; progress: number } | null>(null)

  useEffect(() => {
    initializeUser()
  }, [initializeUser])

  useEffect(() => {
    if (!currentUser) return
    const loadStats = async () => {
      const answers = await db.userAnswers.where("userId").equals(currentUser.id).toArray()
      const total = answers.length
      const correct = answers.filter(a => a.isCorrect).length
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
      const wrongs = await db.wrongQuestions.where("userId").equals(currentUser.id).filter(w => w.status === "wrong").count()
      const firstAnswer = answers.length > 0 ? answers.reduce((min, a) => a.answeredAt < min ? a.answeredAt : min, answers[0].answeredAt) : null
      const studyDays = firstAnswer ? Math.max(1, Math.ceil((Date.now() - firstAnswer.getTime()) / (1000 * 60 * 60 * 24))) : 1
      setStats({ totalAnswers: total, accuracy, wrongCount: wrongs, studyDays })

      const goals = await db.learningGoals.where("userId").equals(currentUser.id).filter(g => g.status === "active").toArray()
      if (goals.length > 0) {
        const goal = goals[0]
        let current = 0
        if (goal.type === "daily_questions") {
          const today = new Date().toISOString().split('T')[0]
          const todayAnswers = answers.filter(a => a.answeredAt.toISOString().startsWith(today)).length
          current = todayAnswers
        } else if (goal.type === "weekly_streak") {
          const dailyStats = await db.dailyStats.where("userId").equals(currentUser.id).toArray()
          const dates = dailyStats.map(s => s.date).sort().reverse()
          const today = new Date().toISOString().split('T')[0]
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          if (dates[0] === today || dates[0] === yesterday) {
            let streak = 1
            for (let i = 1; i < dates.length; i++) {
              const diff = (new Date(dates[i-1]).getTime() - new Date(dates[i]).getTime()) / 86400000
              if (diff === 1) streak++
              else break
            }
            current = streak
          } else {
            current = 0
          }
        }
        const progress = Math.min(100, Math.round((current / goal.targetValue) * 100))
        setActiveGoal({ type: goal.type, target: goal.targetValue, current, progress })
      }
    }
    loadStats()
  }, [currentUser])

  if (!currentUser) {
    return <WelcomeScreen />
  }

  return (
    <AppLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06, delayChildren: 0.05 },
          },
        }}
        className="space-y-6"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.35, ease: smoothEase },
            },
          }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-white"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -right-4 top-1/2 h-32 w-32 translate-y-1/2 rounded-full bg-white/5 blur-xl" />
            <div className="absolute left-1/2 -bottom-12 h-24 w-24 translate-x-1/2 rounded-full bg-purple-400/20 blur-2xl" />
            <svg className="absolute inset-0 h-full w-full opacity-10" viewBox="0 0 400 200">
              <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="150" cy="100" r="40" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="300" cy="80" r="25" stroke="white" strokeWidth="1" fill="none" />
              <line x1="80" y1="50" x2="110" y2="100" stroke="white" strokeWidth="1" />
              <line x1="190" y1="100" x2="275" y2="80" stroke="white" strokeWidth="1" />
            </svg>
          </div>
          <div className="relative">
            <h1 className="mb-1 text-xl font-bold">欢迎回来，{currentUser.name}！</h1>
            <p className="text-blue-100 text-sm">坚持学习，每天都有新的进步</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatItem icon={PenTool} label="总答题" value={String(stats.totalAnswers)} color="from-blue-400 to-cyan-400" />
              <StatItem icon={TrendingUp} label="正确率" value={`${stats.accuracy}%`} color="from-emerald-400 to-green-400" />
              <StatItem icon={AlertCircle} label="待订正" value={String(stats.wrongCount)} color="from-orange-400 to-red-400" />
              <StatItem icon={Trophy} label="学习天数" value={String(stats.studyDays)} color="from-purple-400 to-fuchsia-400" />
            </div>

            {activeGoal && (
              <div className="mt-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-300" />
                    <span className="text-sm text-white/80 font-medium">
                      {activeGoal.type === 'daily_questions' ? '📝 今日答题' : activeGoal.type === 'weekly_streak' ? '🔥 连续学习' : '📊 掌握度'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.span
                      key={activeGoal.current}
                      initial={{ scale: 1.3, color: "#fbbf24" }}
                      animate={{ scale: 1, color: "#ffffff" }}
                      transition={{ duration: 0.3 }}
                      className="text-lg font-bold text-white"
                    >
                      {activeGoal.current}
                    </motion.span>
                    <span className="text-white/50">/</span>
                    <span className="text-sm text-white/70">{activeGoal.target}</span>
                    {activeGoal.progress >= 100 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="text-lg"
                      >
                        🎉
                      </motion.span>
                    )}
                  </div>
                </div>
                <div className="relative h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${activeGoal.progress}%` }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
                    className={`h-full rounded-full ${
                      activeGoal.progress >= 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 
                      activeGoal.progress >= 50 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 
                      'bg-gradient-to-r from-orange-400 to-red-400'
                    }`}
                  />
                  <motion.div
                    animate={{ x: ["0%", `${activeGoal.progress}%`] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    className="absolute top-0 h-full w-4 bg-gradient-to-r from-white/50 to-transparent rounded-full"
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-white/50">
                  <span>{Math.round(activeGoal.progress)}% 完成</span>
                  <span>{activeGoal.target - activeGoal.current > 0 ? `还需 ${activeGoal.target - activeGoal.current} ` : '已达成!'}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: smoothEase } },
          }}
        >
          <StreakDisplay />
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: smoothEase } },
            }}
          >
            <AchievementBadges />
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: smoothEase } },
            }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="font-semibold">今日学习建议</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-white/90">📚 根据你的学习进度，推荐以下活动：</p>
              <ul className="space-y-1.5 text-white/80">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                  复习昨天的错题，巩固知识点
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  完成10道随机练习保持手感
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                  预习下一章节内容
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: smoothEase } },
          }}
          className="relative overflow-hidden rounded-2xl border border-gray-200/50 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)]" />
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-xs text-white/80 shadow-lg">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-3 w-3 text-amber-300" />
            </motion.div>
            <span className="font-medium">知识星云</span>
          </div>
          <div className="relative h-[400px] w-full">
            <NebulaKnowledgeGraph />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent p-4 pt-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-sm font-medium text-white/80">探索模式</span>
              </div>
              <div className="h-3 w-px bg-white/20" />
              <p className="text-xs text-white/50">点击节点查看详情 · 拖拽旋转视角 · 滚轮缩放</p>
            </div>
          </div>
        </motion.div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <motion.h2
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { duration: 0.3, ease: smoothEase } },
              }}
              className="text-base font-semibold text-gray-900"
            >
              快捷入口
            </motion.h2>
            <a href="/all-features" className="text-sm text-blue-600 hover:text-blue-700">查看全部 →</a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { title: "学科目录", icon: BookOpen, desc: "知识点", href: "/subjects", color: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
              { title: "知识图谱", icon: Network, desc: "关联图", href: "/knowledge/graph", color: "from-purple-500 to-purple-600", bg: "bg-purple-50" },
              { title: "自由练习", icon: PenTool, desc: "随机出题", href: "/practice", color: "from-green-500 to-green-600", bg: "bg-green-50" },
              { title: "模拟考试", icon: Target, desc: "限时测试", href: "/exam", color: "from-red-500 to-red-600", bg: "bg-red-50" },
              { title: "错题本", icon: AlertCircle, desc: "查漏补缺", href: "/wrong", color: "from-orange-500 to-orange-600", bg: "bg-orange-50" },
              { title: "复习计划", icon: Brain, desc: "艾宾浩斯", href: "/review", color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50" },
              { title: "闪卡记忆", icon: Layers, desc: "背诵卡片", href: "/cards", color: "from-pink-500 to-pink-600", bg: "bg-pink-50" },
              { title: "资料库", icon: FolderOpen, desc: "文件管理", href: "/files", color: "from-amber-500 to-amber-600", bg: "bg-amber-50" },
              { title: "学习目标", icon: Trophy, desc: "设定目标", href: "/goals", color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50" },
              { title: "数据统计", icon: BarChart3, desc: "学习报告", href: "/stats", color: "from-teal-500 to-teal-600", bg: "bg-teal-50" },
              { title: "学习资源", icon: Sparkles, desc: "推荐内容", href: "/knowledge/resources", color: "from-fuchsia-500 to-fuchsia-600", bg: "bg-fuchsia-50" },
              { title: "专项训练", icon: Zap, desc: "薄弱科目", href: "/practice?mode=subject", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" },
            ].map((action, i) => (
              <motion.a
                key={action.title}
                href={action.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.bg} mb-2 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`h-6 w-6 bg-gradient-to-br ${action.color} bg-clip-text`} />
                </div>
                <h3 className="font-medium text-gray-900 text-sm">{action.title}</h3>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  )
}

function WelcomeScreen() {
  const { setCurrentUser } = useUserStore()
  const [name, setName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateUser = async () => {
    if (!name.trim()) return
    setIsCreating(true)
    try {
      const newUser = {
        id: crypto.randomUUID(),
        name: name.trim(),
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await db.users.add(newUser)
      await db.userProfiles.add({
        id: crypto.randomUUID(),
        userId: newUser.id,
        currentGrade: "",
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await setCurrentUser(newUser)
    } catch (error) {
      console.error("Failed to create user:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-sm mx-4"
      >
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-sm">
              E
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Eric知识库</h1>
              <p className="text-xs text-gray-500">个人学习系统</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">昵称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入你的昵称"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                onKeyDown={(e) => e.key === "Enter" && handleCreateUser()}
                autoFocus
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateUser}
              disabled={!name.trim() || isCreating}
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? "创建中..." : "开始学习"}
            </motion.button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> 全学科</span>
            <span className="flex items-center gap-1"><PenTool className="h-3 w-3" /> 题库</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> 分析</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function StatItem({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`rounded-lg bg-gradient-to-br ${color || 'from-blue-400 to-indigo-500'} p-2 shadow-sm`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <motion.div 
          className="text-lg font-bold text-white"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {value}
        </motion.div>
        <div className="text-[11px] text-blue-100 font-medium">{label}</div>
      </div>
    </div>
  )
}

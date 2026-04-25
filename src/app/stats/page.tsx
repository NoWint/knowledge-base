"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useUserStore } from "@/store/user-store"
import { db } from "@/lib/db/database"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { TrendingUp, Target, Award, BookOpen, Brain, Flame } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import { Heatmap } from "@/components/charts/heatmap"
import { RadarChart } from "@/components/charts/radar-chart"
import { detectWeakPoints, type WeakPoint } from "@/lib/algorithms/weakness-detector"
import { getHeatmapData } from "@/lib/analytics/daily-stats"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

interface WeakPointWithName extends WeakPoint {
  name: string
  subject: string
}

export default function StatsPage() {
  const { currentUser } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [totalAnswers, setTotalAnswers] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [trendData, setTrendData] = useState<{ day: string; 正确: number; 错误: number; 正确率: number }[]>([])
  const [subjectData, setSubjectData] = useState<{ name: string; 正确率: number; 答题数: number; icon: string }[]>([])
  const [wrongPieData, setWrongPieData] = useState<{ name: string; value: number }[]>([])
  const [difficultyData, setDifficultyData] = useState<{ difficulty: string; 正确率: number; 答题数: number }[]>([])
  const [heatData, setHeatData] = useState<{ date: string; value: number }[]>([])
  const [weakPoints, setWeakPoints] = useState<WeakPointWithName[]>([])
  const [radarData, setRadarData] = useState<{ subject: string; mastery: number }[]>([])

  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }
    loadStats()
  }, [currentUser])

  const loadStats = async () => {
    if (!currentUser) return

    try {
      const [allAnswers, allWrongs, questions, knowledgePoints, chapters, subjects, heatmapResult, weakResult] = await Promise.all([
        db.userAnswers.where("userId").equals(currentUser.id).toArray(),
        db.wrongQuestions.where("userId").equals(currentUser.id).toArray(),
        db.questions.toArray(),
        db.knowledgePoints.toArray(),
        db.chapters.toArray(),
        db.subjects.toArray(),
        getHeatmapData(currentUser.id, 90),
        detectWeakPoints(currentUser.id, 3),
      ])

      setTotalAnswers(allAnswers.length)
      setCorrectCount(allAnswers.filter(a => a.isCorrect).length)
      setWrongCount(allWrongs.filter(w => w.status === "wrong").length)
      setHeatData(heatmapResult)

      const kpMap = new Map(knowledgePoints.map(kp => [kp.id, kp]))
      const chapterMap = new Map(chapters.map(c => [c.id, c]))
      const subjectMap = new Map(subjects.map(s => [s.id, s]))

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        d.setHours(0, 0, 0, 0)
        return d
      })

      const trend = last7Days.map((d, i) => {
        const dayEnd = new Date(d)
        dayEnd.setDate(dayEnd.getDate() + 1)
        const dayAnswers = allAnswers.filter(a => {
          const t = new Date(a.answeredAt)
          return t >= d && t < dayEnd
        })
        const dayCorrect = dayAnswers.filter(a => a.isCorrect).length
        return {
          day: `${d.getMonth() + 1}/${d.getDate()}`,
          正确: dayCorrect,
          错误: dayAnswers.length - dayCorrect,
          正确率: dayAnswers.length > 0 ? Math.round((dayCorrect / dayAnswers.length) * 100) : 0,
        }
      })
      setTrendData(trend)

      let currentStreak = 0
      for (let i = trend.length - 1; i >= 0; i--) {
        if (trend[i].正确率 >= 60) currentStreak++
        else break
      }
      setStreak(currentStreak)

      const subjectStats = new Map<string, { correct: number; total: number; name: string; icon: string }>()
      subjects.forEach(s => {
        subjectStats.set(s.id, { correct: 0, total: 0, name: s.name, icon: s.icon || "📚" })
      })

      const subjectMastery = new Map<string, { correct: number; total: number }>()

      allAnswers.forEach(answer => {
        const question = questions.find(q => q.id === answer.questionId)
        if (!question) return
        const kp = kpMap.get(question.knowledgePointId)
        if (!kp) return
        const chapter = chapterMap.get(kp.chapterId)
        if (!chapter) return
        const stats = subjectStats.get(chapter.subjectId)
        if (!stats) return
        stats.total++
        if (answer.isCorrect) stats.correct++

        const masteryStats = subjectMastery.get(chapter.subjectId) || { correct: 0, total: 0 }
        masteryStats.total++
        if (answer.isCorrect) masteryStats.correct++
        subjectMastery.set(chapter.subjectId, masteryStats)
      })

      const sData = subjects.map(s => {
        const stats = subjectStats.get(s.id) || { correct: 0, total: 0, name: s.name, icon: s.icon || "📚" }
        return {
          name: stats.name,
          icon: stats.icon,
          正确率: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
          答题数: stats.total,
        }
      }).filter(s => s.答题数 > 0)
      setSubjectData(sData)

      const rData = subjects.map(s => {
        const m = subjectMastery.get(s.id)
        return {
          subject: s.name,
          mastery: m && m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0,
        }
      }).filter(s => s.mastery > 0)
      setRadarData(rData)

      const wrongBySubject = new Map<string, number>()
      allWrongs.forEach(w => {
        const question = questions.find(q => q.id === w.questionId)
        if (!question) return
        const kp = kpMap.get(question.knowledgePointId)
        if (!kp) return
        const chapter = chapterMap.get(kp.chapterId)
        if (!chapter) return
        const subject = subjectMap.get(chapter.subjectId)
        if (!subject) return
        wrongBySubject.set(subject.name, (wrongBySubject.get(subject.name) || 0) + 1)
      })
      const pieData = Array.from(wrongBySubject.entries()).map(([name, value]) => ({ name, value }))
      setWrongPieData(pieData)

      const diffStats = new Map<number, { correct: number; total: number }>()
      allAnswers.forEach(answer => {
        const question = questions.find(q => q.id === answer.questionId)
        if (!question) return
        const diff = question.difficulty || 1
        if (!diffStats.has(diff)) diffStats.set(diff, { correct: 0, total: 0 })
        const stats = diffStats.get(diff)!
        stats.total++
        if (answer.isCorrect) stats.correct++
      })
      const dData = Array.from(diffStats.entries()).map(([diff, stats]) => ({
        difficulty: `${diff}星`,
        正确率: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        答题数: stats.total,
      }))
      setDifficultyData(dData)

      const weakWithNames: WeakPointWithName[] = weakResult.map(wp => {
        const kp = kpMap.get(wp.knowledgePointId)
        const chapter = kp ? chapterMap.get(kp.chapterId) : null
        const subject = chapter ? subjectMap.get(chapter.subjectId) : null
        return {
          ...wp,
          name: kp?.name || "未知知识点",
          subject: subject?.name || "未知学科",
        }
      })
      setWeakPoints(weakWithNames)

    } catch (err) {
      console.error("Failed to load stats:", err)
    } finally {
      setLoading(false)
    }
  }

  const accuracy = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0

  if (!currentUser) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <Brain className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">请先登录查看学习数据</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <Brain className="mx-auto h-12 w-12 animate-pulse text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">加载学习数据中...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: smoothEase }}
        >
          <h1 className="text-2xl font-bold text-gray-900">学习数据</h1>
          <p className="text-gray-600 mt-1">全面了解你的学习表现</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "总答题数", value: totalAnswers, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "正确率", value: `${accuracy}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", sub: `${correctCount}题正确` },
            { label: "待订正", value: wrongCount, icon: Award, color: "text-red-600", bg: "bg-red-50" },
            { label: "连续达标", value: `${streak}天`, icon: Flame, color: "text-orange-600", bg: "bg-orange-50", sub: "正确率≥60%" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: smoothEase }}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bg} ${item.color} mb-3`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{item.value}</div>
              <div className="text-sm text-gray-500">{item.label}</div>
              {item.sub && <div className="text-xs text-gray-400 mt-0.5">{item.sub}</div>}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">学习热力图（近90天）</h3>
          </div>
          {heatData.some(d => d.value > 0) ? (
            <Heatmap data={heatData} maxValue={10} />
          ) : (
            <div className="h-[100px] flex items-center justify-center text-gray-400 text-sm">
              暂无学习数据，开始练习后查看热力图
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">近7天答题趋势</h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> 总答题</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> 正确数</span>
              </div>
            </div>
            {trendData.some(t => t.正确 + t.错误 > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Line type="monotone" dataKey="正确" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
                  <Line type="monotone" dataKey="错误" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-gray-400 text-sm">
                暂无答题数据，开始练习后查看趋势
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">学科能力雷达图</h3>
            </div>
            {radarData.length > 0 ? (
              <div className="flex justify-center">
                <RadarChart data={radarData} size={220} />
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-gray-400 text-sm">
                暂无学科数据
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 mb-4">学科正确率</h3>
            {subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subjectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" fontSize={11} unit="%" />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={50} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(value: number) => [`${value}%`, "正确率"]}
                    labelFormatter={(label) => `学科: ${label}`}
                  />
                  <Bar dataKey="正确率" radius={[0, 4, 4, 0]}>
                    {subjectData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-gray-400 text-sm">
                暂无学科答题数据
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 mb-4">错题学科分布</h3>
            {wrongPieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={wrongPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {wrongPieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                      formatter={(value: number) => [`${value}题`, "错题数"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {wrongPieData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600 truncate flex-1">{item.name}</span>
                      <span className="text-gray-900 font-medium">{item.value}题</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">
                暂无错题数据
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 mb-4">按难度正确率</h3>
            {difficultyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={difficultyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="difficulty" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(value: number, name: string) => {
                      if (name === "正确率") return [`${value}%`, "正确率"]
                      return [value, "答题数"]
                    }}
                    labelFormatter={(label) => `难度: ${label}`}
                  />
                  <Bar dataKey="正确率" radius={[4, 4, 0, 0]}>
                    {difficultyData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">
                暂无难度分布数据
              </div>
            )}
          </motion.div>
        </div>

        {weakPoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">薄弱知识点（需加强练习）</h3>
            </div>
            <div className="space-y-2">
              {weakPoints.map((kp, i) => (
                <div key={kp.knowledgePointId} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition">
                  <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{kp.name}</p>
                    <p className="text-xs text-gray-500">{kp.subject}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-sm font-bold ${
                      kp.wrongRate >= 0.5 ? "text-red-600" : "text-amber-600"
                    }`}>{Math.round(kp.wrongRate * 100)}%</span>
                    <p className="text-xs text-gray-400">{kp.totalAttempts}次</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    kp.severity === 'high' ? 'bg-red-100 text-red-700' :
                    kp.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {kp.severity === 'high' ? '严重' : kp.severity === 'medium' ? '中等' : '轻微'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}

"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { BarChart3, TrendingUp, Users, BookOpen, ArrowRight, Calendar } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const weeklyData = [
  { day: "周一", questions: 245, avgScore: 78 },
  { day: "周二", questions: 312, avgScore: 82 },
  { day: "周三", questions: 287, avgScore: 75 },
  { day: "周四", questions: 356, avgScore: 80 },
  { day: "周五", questions: 298, avgScore: 85 },
  { day: "周六", questions: 189, avgScore: 88 },
  { day: "周日", questions: 156, avgScore: 90 },
]

const topicMastery = [
  { name: "二次函数", mastery: 85, trend: "+5%" },
  { name: "三角形全等", mastery: 72, trend: "+3%" },
  { name: "一元二次方程", mastery: 68, trend: "-2%" },
  { name: "几何证明", mastery: 58, trend: "+8%" },
  { name: "概率统计", mastery: 92, trend: "+2%" },
]

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester'>('week')
  const maxQuestions = Math.max(...weeklyData.map((d) => d.questions))

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">班级数据分析</h1>
          <p className="text-gray-500 mt-1">查看班级学习进度和成绩统计</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'semester'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                selectedPeriod === period
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {period === 'week' ? '本周' : period === 'month' ? '本月' : '本学期'}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+12%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">2,143</p>
          <p className="text-sm text-gray-500">本周做题数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+5%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">79.2%</p>
          <p className="text-sm text-gray-500">班级平均分</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+8</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">115</p>
          <p className="text-sm text-gray-500">活跃学生数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-xs text-yellow-600 font-medium">-3%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">85%</p>
          <p className="text-sm text-gray-500">作业完成率</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">周作业量与平均分</h3>
          <div className="flex items-end gap-4 h-48">
            {weeklyData.map((day, index) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{day.avgScore}%</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.questions / maxQuestions) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg min-h-[20px]"
                  />
                </div>
                <span className="text-xs text-gray-500">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">1,843</p>
              <p className="text-xs text-gray-500">本周总做题</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">79.2%</p>
              <p className="text-xs text-gray-500">本周平均分</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">97%</p>
              <p className="text-xs text-gray-500">本周完成率</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">知识点掌握度</h3>
          <div className="space-y-4">
            {topicMastery.map((topic) => (
              <div key={topic.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{topic.name}</span>
                  <span className={`text-xs font-medium ${topic.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {topic.trend}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topic.mastery}%` }}
                    transition={{ duration: 0.8 }}
                    className={cn(
                      "h-full rounded-full",
                      topic.mastery >= 80 ? "bg-green-500" : topic.mastery >= 60 ? "bg-yellow-500" : "bg-red-500"
                    )}
                  />
                </div>
                <span className="text-xs text-gray-400">{topic.mastery}%</span>
              </div>
            ))}
          </div>
          <Link
            href="/teacher/analytics/details"
            className="flex items-center justify-center gap-1 mt-4 pt-4 border-t text-sm text-blue-600 hover:text-blue-700"
          >
            查看详细分析 <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 p-5"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">需要关注的学生</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="pb-3">学生</th>
                <th className="pb-3">最近表现</th>
                <th className="pb-3">作业完成率</th>
                <th className="pb-3">平均分</th>
                <th className="pb-3">建议</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                      刘
                    </div>
                    <span className="font-medium text-gray-900">刘芳</span>
                  </div>
                </td>
                <td className="py-3 text-sm text-gray-500">近7天未登录</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '45%' }} />
                    </div>
                    <span className="text-sm text-gray-500">45%</span>
                  </div>
                </td>
                <td className="py-3 text-sm font-medium text-red-600">52</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded">
                    需要跟进
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                      赵
                    </div>
                    <span className="font-medium text-gray-900">赵鹏</span>
                  </div>
                </td>
                <td className="py-3 text-sm text-gray-500">正确率下降</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: '68%' }} />
                    </div>
                    <span className="text-sm text-gray-500">68%</span>
                  </div>
                </td>
                <td className="py-3 text-sm font-medium text-yellow-600">65</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded">
                    观察中
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

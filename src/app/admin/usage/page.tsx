"use client"

import { motion } from "framer-motion"
import { Users, Activity, TrendingUp, Clock, BarChart3, Download } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const dailyData = [
  { date: "01-14", users: 1234, logins: 2890, questions: 12450, minutes: 4560 },
  { date: "01-15", users: 1456, logins: 3200, questions: 14500, minutes: 5120 },
  { date: "01-16", users: 1389, logins: 3100, questions: 13800, minutes: 4890 },
  { date: "01-17", users: 1567, logins: 3450, questions: 15200, minutes: 5340 },
  { date: "01-18", users: 1678, logins: 3680, questions: 16800, minutes: 5780 },
  { date: "01-19", users: 1543, logins: 3290, questions: 15100, minutes: 5120 },
  { date: "01-20", users: 1234, logins: 2890, questions: 12450, minutes: 4560 },
]

const topSchools = [
  { name: "北京市第一中学", users: 2340, growth: "+5.2%" },
  { name: "上海市实验中学", users: 1890, growth: "+3.8%" },
  { name: "广州市第二中学", users: 1567, growth: "+7.1%" },
  { name: "深圳市外国语学校", users: 1234, growth: "+2.3%" },
  { name: "杭州市高级中学", users: 1098, growth: "+4.5%" },
]

const usageByFeature = [
  { name: "做题练习", usage: 85, trend: "+12%" },
  { name: "错题复习", usage: 72, trend: "+8%" },
  { name: "学习闪卡", usage: 45, trend: "+15%" },
  { name: "知识图谱", usage: 38, trend: "+22%" },
  { name: "模拟考试", usage: 62, trend: "+5%" },
]

export default function UsagePage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week')
  const maxUsers = Math.max(...dailyData.map((d) => d.users))

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">使用统计</h1>
          <p className="text-gray-500 mt-1">平台整体使用情况和用户活跃度分析</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  period === p
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {p === 'week' ? '本周' : p === 'month' ? '本月' : '本年'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            导出报告
          </button>
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
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+15%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">12,567</p>
          <p className="text-sm text-gray-500 mt-1">活跃用户</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+8%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">28.5K</p>
          <p className="text-sm text-gray-500 mt-1">总登录次数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+22%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">142K</p>
          <p className="text-sm text-gray-500 mt-1">总做题数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+12%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">45.8K</p>
          <p className="text-sm text-gray-500 mt-1">学习时长(分钟)</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">每日活跃用户趋势</h3>
          <div className="flex items-end gap-3 h-48">
            {dailyData.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{day.users}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.users / maxUsers) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg min-h-[20px]"
                />
                <span className="text-xs text-gray-500">{day.date}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">功能使用分布</h3>
          <div className="space-y-4">
            {usageByFeature.map((feature) => (
              <div key={feature.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                  <span className="text-xs text-green-600 font-medium">{feature.trend}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${feature.usage}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
                <span className="text-xs text-gray-400">{feature.usage}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 p-5"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">学校活跃度排名</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="pb-3">排名</th>
                <th className="pb-3">学校名称</th>
                <th className="pb-3">活跃用户</th>
                <th className="pb-3">增长率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topSchools.map((school, index) => (
                <tr key={school.name} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <span className={cn(
                      "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                      index === 0 ? "bg-yellow-100 text-yellow-700" :
                      index === 1 ? "bg-gray-100 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-50 text-gray-500"
                    )}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 font-medium text-gray-900">{school.name}</td>
                  <td className="py-3">{school.users.toLocaleString()}</td>
                  <td className="py-3">
                    <span className="text-sm text-green-600 font-medium">{school.growth}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

"use client"

import { motion } from "framer-motion"
import { CreditCard, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"
import { BillingTable } from "@/components/admin/billing-table"

const mockBillingRecords = [
  { id: "1", schoolName: "北京市第一中学", amount: 2990, currency: "CNY", status: "paid" as const, description: "Pro版年度订阅", dueDate: new Date("2024-01-01"), paidAt: new Date("2024-01-01"), createdAt: new Date("2023-12-15") },
  { id: "2", schoolName: "上海市实验中学", amount: 2990, currency: "CNY", status: "paid" as const, description: "Pro版年度订阅", dueDate: new Date("2024-01-01"), paidAt: new Date("2024-01-03"), createdAt: new Date("2023-12-20") },
  { id: "3", schoolName: "广州市第二中学", amount: 299, currency: "CNY", status: "pending" as const, description: "Pro版月度订阅", dueDate: new Date("2024-01-15"), paidAt: null, createdAt: new Date("2024-01-01") },
  { id: "4", schoolName: "深圳市外国语学校", amount: 2990, currency: "CNY", status: "paid" as const, description: "Pro版年度订阅", dueDate: new Date("2024-01-01"), paidAt: new Date("2023-12-28"), createdAt: new Date("2023-12-15") },
  { id: "5", schoolName: "杭州市高级中学", amount: 0, currency: "CNY", status: "failed" as const, description: "Pro版月度订阅 - 扣款失败", dueDate: new Date("2024-01-05"), paidAt: null, createdAt: new Date("2024-01-01") },
  { id: "6", schoolName: "南京市金陵中学", amount: 299, currency: "CNY", status: "pending" as const, description: "Pro版月度订阅", dueDate: new Date("2024-01-20"), paidAt: null, createdAt: new Date("2024-01-05") },
]

export default function BillingPage() {
  const totalRevenue = mockBillingRecords
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.amount, 0)

  const pendingRevenue = mockBillingRecords
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0)

  const failedCount = mockBillingRecords.filter((r) => r.status === "failed").length

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">账单管理</h1>
        <p className="text-gray-500 mt-1">查看和管理所有学校的账单记录</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+12%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">¥{totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">总收入（本月）</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">¥{pendingRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">待收款</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{failedCount}</p>
          <p className="text-sm text-gray-500 mt-1">失败交易</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+8</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">42</p>
          <p className="text-sm text-gray-500 mt-1">付费学校</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <BillingTable records={mockBillingRecords} />
      </motion.div>
    </div>
  )
}

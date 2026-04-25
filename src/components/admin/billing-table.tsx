"use client"

import { motion } from "framer-motion"
import { Download, Eye, MoreHorizontal, Search } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface BillingRecord {
  id: string
  schoolName: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  description: string
  dueDate: Date
  paidAt: Date | null
  createdAt: Date
}

interface BillingTableProps {
  records: BillingRecord[]
}

export function BillingTable({ records }: BillingTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = statusFilter === 'all' || record.status === statusFilter
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.ceil(filteredRecords.length / pageSize)
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date))
  }

  const totalAmount = filteredRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0)

  const pendingAmount = filteredRecords
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">账单记录</h3>
            <p className="text-sm text-gray-500 mt-1">
              已支付: <span className="text-green-600 font-medium">{formatCurrency(totalAmount, 'CNY')}</span>
              {' · '}
              待支付: <span className="text-yellow-600 font-medium">{formatCurrency(pendingAmount, 'CNY')}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学校名称或描述..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'paid', 'failed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status)
                  setCurrentPage(1)
                }}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  statusFilter === status
                    ? status === 'paid' ? "bg-green-100 text-green-700"
                    : status === 'pending' ? "bg-yellow-100 text-yellow-700"
                    : status === 'failed' ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {status === 'all' ? '全部'
                  : status === 'pending' ? '待支付'
                  : status === 'paid' ? '已支付'
                  : '失败'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学校</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建日期</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付日期</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                  没有找到匹配的记录
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record, index) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{record.schoolName}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{formatCurrency(record.amount, record.currency)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex px-2.5 py-1 text-xs font-medium rounded-full",
                        record.status === 'paid' && "bg-green-100 text-green-700",
                        record.status === 'pending' && "bg-yellow-100 text-yellow-700",
                        record.status === 'failed' && "bg-red-100 text-red-700",
                        record.status === 'refunded' && "bg-gray-100 text-gray-700"
                      )}
                    >
                      {record.status === 'paid' ? '已支付'
                        : record.status === 'pending' ? '待支付'
                        : record.status === 'failed' ? '失败'
                        : '已退款'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate">{record.description}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-500">{formatDate(record.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-500">
                      {record.paidAt ? formatDate(record.paidAt) : '-'}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)} 条记录，共 {filteredRecords.length} 条
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function BillingTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <th key={i} className="px-5 py-3">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t border-gray-100">
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <td key={j} className="px-5 py-4">
                  <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

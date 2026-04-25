"use client"

import { motion } from "framer-motion"
import { Search, Mail, MoreHorizontal, Shield, UserCheck } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  email: string
  avatar: string | null
  joinedAt: Date
  lastActive: Date | null
  totalQuestions: number
  averageScore: number
  status: 'active' | 'inactive'
  role: 'student' | 'assistant'
}

interface StudentListProps {
  students: Student[]
  classId: string
}

export function StudentList({ students, classId }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || student.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学生姓名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                filter === 'all' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              全部 ({students.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                filter === 'active' ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              活跃 ({students.filter(s => s.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                filter === 'inactive' ? "bg-gray-100 text-gray-700" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              不活跃 ({students.filter(s => s.status === 'inactive').length})
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>没有找到匹配的学生</p>
          </div>
        ) : (
          filteredStudents.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                    {student.avatar ? (
                      <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      student.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      {student.role === 'assistant' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          <UserCheck className="w-3 h-3" />
                          助教
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{student.averageScore}%</p>
                    <p className="text-xs text-gray-500">平均成绩</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{student.totalQuestions}</p>
                    <p className="text-xs text-gray-500">做题数</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {student.lastActive
                        ? `${Math.floor((Date.now() - new Date(student.lastActive).getTime()) / (1000 * 60 * 60 * 24))}天前`
                        : '从未活跃'}
                    </p>
                    <p className="text-xs text-gray-500">最近活动</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Mail className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {filteredStudents.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500">
            显示 {filteredStudents.length} / {students.length} 名学生
          </p>
        </div>
      )}
    </div>
  )
}

export function StudentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="h-9 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex gap-2">
            <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="flex gap-6">
                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

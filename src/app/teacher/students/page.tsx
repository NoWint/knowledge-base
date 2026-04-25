"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Users, Search, Download, UserPlus } from "lucide-react"
import { useState } from "react"
import { StudentList } from "@/components/teacher/student-list"

const mockStudents = [
  { id: "1", name: "张伟", email: "zhangwei@example.com", avatar: null, joinedAt: new Date("2024-01-01"), lastActive: new Date("2024-01-15"), totalQuestions: 256, averageScore: 85, status: "active" as const, role: "student" as const },
  { id: "2", name: "李娜", email: "lina@example.com", avatar: null, joinedAt: new Date("2024-01-01"), lastActive: new Date("2024-01-15"), totalQuestions: 312, averageScore: 78, status: "active" as const, role: "assistant" as const },
  { id: "3", name: "王明", email: "wangming@example.com", avatar: null, joinedAt: new Date("2024-01-03"), lastActive: new Date("2024-01-14"), totalQuestions: 189, averageScore: 72, status: "active" as const, role: "student" as const },
  { id: "4", name: "刘芳", email: "liufang@example.com", avatar: null, joinedAt: new Date("2024-01-05"), lastActive: new Date("2024-01-10"), totalQuestions: 145, averageScore: 68, status: "inactive" as const, role: "student" as const },
  { id: "5", name: "陈强", email: "chenqiang@example.com", avatar: null, joinedAt: new Date("2024-01-06"), lastActive: new Date("2024-01-15"), totalQuestions: 278, averageScore: 92, status: "active" as const, role: "student" as const },
]

export default function StudentsPage() {
  const classId = "1"

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
          <p className="text-gray-500 mt-1">管理班级学生和查看学习情况</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            导出名单
          </button>
          <Link
            href={`/teacher/classes/${classId}/invite`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            邀请学生
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{mockStudents.length}</p>
              <p className="text-sm text-gray-500">学生总数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{mockStudents.filter(s => s.status === 'active').length}</p>
              <p className="text-sm text-gray-500">活跃学生</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">79%</p>
              <p className="text-sm text-gray-500">平均完成率</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">79</p>
              <p className="text-sm text-gray-500">班级平均分</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <StudentList students={mockStudents} classId={classId} />
      </motion.div>
    </div>
  )
}

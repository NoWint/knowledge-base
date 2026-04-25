"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Users, BookOpen, Calendar, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClassCardProps {
  id: string
  name: string
  grade: string
  subject: string
  studentCount: number
  status: "active" | "inactive" | "archived"
  averageScore: number
  completionRate: number
}

export function ClassCard({
  id,
  name,
  grade,
  subject,
  studentCount,
  status,
  averageScore,
  completionRate,
}: ClassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{name}</h3>
          <p className="text-sm text-gray-500">{grade} · {subject}</p>
        </div>
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            status === "active"
              ? "bg-green-100 text-green-700"
              : status === "inactive"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {status === "active" ? "进行中" : status === "inactive" ? "暂停" : "已归档"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 mx-auto mb-1">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">{studentCount}</p>
          <p className="text-xs text-gray-500">学生</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 mx-auto mb-1">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">{averageScore}%</p>
          <p className="text-xs text-gray-500">平均分</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 mx-auto mb-1">
            <BookOpen className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">{completionRate}%</p>
          <p className="text-xs text-gray-500">完成率</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/teacher/classes/${id}`}
          className="flex-1 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg text-center hover:bg-blue-700 transition-colors"
        >
          管理班级
        </Link>
        <Link
          href={`/teacher/classes/${id}/students`}
          className="py-2 px-4 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          学生
        </Link>
      </div>
    </motion.div>
  )
}

interface ClassCardSkeletonProps {
  count?: number
}

export function ClassCardSkeleton({ count = 1 }: ClassCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-1" />
                <div className="h-5 w-8 bg-gray-200 rounded mx-auto mb-1" />
                <div className="h-3 w-6 bg-gray-100 rounded mx-auto" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
            <div className="h-9 w-20 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ))}
    </>
  )
}

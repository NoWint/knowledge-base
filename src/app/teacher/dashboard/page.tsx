"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { useUserStore } from "@/store/user-store"
import { getClassesByTeacher, getAssignmentsByTeacher, getTeacherDashboard, type SchoolClass, type Assignment } from "@/lib/teacher-data"
import { ClassCard } from "@/components/teacher/class-card"
import { BookOpen, Users, FileText, TrendingUp, Calendar, Clock, ArrowRight } from "lucide-react"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function TeacherDashboard() {
  const router = useRouter()
  const { currentUser } = useUserStore()
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!currentUser || currentUser.userType !== 'teacher') {
        setLoading(false)
        return
      }

      try {
        const [classesData, assignmentsData, dashboardData] = await Promise.all([
          getClassesByTeacher(currentUser.id),
          getAssignmentsByTeacher(currentUser.id),
          getTeacherDashboard(currentUser.id),
        ])

        setClasses(classesData)
        setAssignments(assignmentsData)
        setActivities(dashboardData.recentActivity)
      } catch (error) {
        console.error('Failed to load teacher data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.userType !== 'teacher') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">教师功能</h2>
        <p className="text-sm text-gray-500 mb-4">此功能仅对教师账号开放</p>
        <Link
          href="/auth/register"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          注册教师账号
        </Link>
      </div>
    )
  }

  const totalStudents = classes.reduce((sum, cls) => sum + cls.studentCount, 0)
  const pendingAssignments = assignments.filter(a => a.status === 'published').length
  const averageScore = classes.length > 0
    ? Math.round(classes.reduce((sum, cls) => sum + cls.averageScore, 0) / classes.length)
    : 0

  const upcomingAssignments = assignments
    .filter(a => a.status === 'published' && new Date(a.dueDate) > new Date())
    .slice(0, 3)

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">教师工作台</h1>
          <p className="text-gray-500 mt-1">欢迎回来，{currentUser.name}老师！</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/teacher/classes"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            班级管理
          </Link>
          <Link
            href="/teacher/assignments"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            布置作业
          </Link>
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          variants={item}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            {classes.length > 0 && (
              <span className="text-xs text-green-600 font-medium">+{classes.length}个班级</span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
          <p className="text-sm text-gray-500">我的班级</p>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
          <p className="text-sm text-gray-500">学生总数</p>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-yellow-600" />
            </div>
            {pendingAssignments > 0 && (
              <span className="text-xs text-yellow-600 font-medium">待批改</span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingAssignments}</p>
          <p className="text-sm text-gray-500">进行中作业</p>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
          <p className="text-sm text-gray-500">班级平均分</p>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">我的班级</h2>
            <Link
              href="/teacher/classes"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.slice(0, 3).map((cls) => (
                <ClassCard key={cls.id} {...cls} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">还没有创建班级</p>
              <Link
                href="/teacher/classes"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                创建班级
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">即将到期</h2>
            <Link
              href="/teacher/assignments"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {upcomingAssignments.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {upcomingAssignments.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.subject}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {new Date(item.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(item.submissionCount / item.questionCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {item.submissionCount}/{item.questionCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无进行中的作业</p>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h2>
        {activities.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {activities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activity.type === 'submission' ? 'bg-green-500' : 'bg-blue-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.student}</span>
                      {' '}
                      {activity.type === 'submission' ? '提交了' : activity.type === 'enrollment' ? '加入了' : '完成了'}
                      {activity.assignment && <span className="font-medium"> {activity.assignment}</span>}
                      {activity.class && <span className="text-gray-500"> ({activity.class})</span>}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">{formatTime(activity.time)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">暂无最近活动</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

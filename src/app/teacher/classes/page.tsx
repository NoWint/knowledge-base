"use client"

import { useEffect, useState } from "react"
import { useUserStore } from "@/store/user-store"
import { getClassesByTeacher, createClass, addStudentToClass, type SchoolClass } from "@/lib/teacher-data"
import { ClassCard } from "@/components/teacher/class-card"
import { motion } from "framer-motion"
import { BookOpen, Plus, Search, Users, X, Copy, Check } from "lucide-react"

export default function TeacherClassesPage() {
  const { currentUser } = useUserStore()
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [newClass, setNewClass] = useState({
    name: "",
    subject: "",
    grade: "",
    description: "",
  })
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    grade: "",
    parentPhone: "",
  })

  useEffect(() => {
    async function loadData() {
      if (!currentUser || currentUser.userType !== 'teacher') {
        setLoading(false)
        return
      }
      try {
        const data = await getClassesByTeacher(currentUser.id)
        setClasses(data)
      } catch (error) {
        console.error('Failed to load classes:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [currentUser])

  const handleCreateClass = async () => {
    if (!currentUser || !newClass.name || !newClass.subject) return
    try {
      const created = await createClass(newClass)
      setClasses([...classes, created])
      setShowCreateModal(false)
      setNewClass({ name: "", subject: "", grade: "", description: "" })
    } catch (error) {
      console.error('Failed to create class:', error)
    }
  }

  const handleAddStudent = async () => {
    if (!selectedClass || !newStudent.name || !newStudent.email) return
    try {
      await addStudentToClass(selectedClass.id, newStudent)
      const updated = await getClassesByTeacher(currentUser!.id)
      setClasses(updated)
      setShowAddStudentModal(false)
      setNewStudent({ name: "", email: "", grade: "", parentPhone: "" })
    } catch (error) {
      console.error('Failed to add student:', error)
    }
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentUser || currentUser.userType !== 'teacher') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">教师功能</h2>
        <p className="text-sm text-gray-500">此功能仅对教师账号开放</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">班级管理</h1>
          <p className="text-gray-500 mt-1">共 {classes.length} 个班级，{classes.reduce((s, c) => s + c.studentCount, 0)} 名学生</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          创建班级
        </button>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索班级名称或年级..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="relative">
              <ClassCard {...cls} />
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                  <span className="text-gray-500">邀请码:</span>
                  <code className="font-mono font-medium">{cls.inviteCode}</code>
                  <button
                    onClick={() => copyInviteCode(cls.inviteCode)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedCode === cls.inviteCode ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => { setSelectedClass(cls); setShowAddStudentModal(true) }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Users className="w-3 h-3" />
                  添加学生
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{searchQuery ? "未找到匹配的班级" : "还没有创建班级"}</p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              创建第一个班级
            </button>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">创建班级</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">班级名称</label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder="例如：初三数学A班"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
                <input
                  type="text"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  placeholder="例如：数学"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                <input
                  type="text"
                  value={newClass.grade}
                  onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                  placeholder="例如：九年级"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder="简要描述班级情况..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateClass}
                  disabled={!newClass.name || !newClass.subject}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  创建
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showAddStudentModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">添加学生到 {selectedClass.name}</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学生姓名</label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="输入学生姓名"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="输入邮箱地址"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                <input
                  type="text"
                  value={newStudent.grade}
                  onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                  placeholder="输入年级"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">家长电话（可选）</label>
                <input
                  type="tel"
                  value={newStudent.parentPhone}
                  onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                  placeholder="输入手机号"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={!newStudent.name || !newStudent.email}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

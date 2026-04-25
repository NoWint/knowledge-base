"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/auth-store"
import { Mail, Lock, User, GraduationCap, ArrowRight, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuthStore()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "student" as "student" | "teacher",
  })
  const [localError, setLocalError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "password" || name === "confirmPassword") {
      setLocalError("")
    }
    if (error) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError("")

    if (!formData.name || !formData.email || !formData.password) {
      setLocalError("请填写所有必填项")
      return
    }

    if (formData.password.length < 6) {
      setLocalError("密码至少6个字符")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("两次输入的密码不一致")
      return
    }

    const success = await register(
      formData.email,
      formData.password,
      formData.name,
      formData.userType
    )

    if (success) {
      router.push("/")
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-sm">
                E
              </div>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">创建账号</h1>
            <p className="text-sm text-gray-500 mt-1">加入知识库，开始你的学习之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">昵称</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="请输入昵称"
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="请输入邮箱"
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="至少6个字符"
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="再次输入密码"
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">用户类型</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, userType: "student" }))}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition ${
                    formData.userType === "student"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  学生
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, userType: "teacher" }))}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition ${
                    formData.userType === "teacher"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  教师
                </button>
              </div>
            </div>

            {displayError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600"
              >
                {displayError}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  创建账号
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            已有账号？{" "}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">
              立即登录
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

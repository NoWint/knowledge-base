"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppLayout } from "@/components/layout/app-layout"
import { useUserStore } from "@/store/user-store"
import { apiClient } from "@/lib/api/api-client"
import { Check, Sparkles, Crown, Building2, X, Loader2, ArrowRight } from "lucide-react"

const PLAN_FEATURES = {
  free: {
    name: "免费版",
    icon: Sparkles,
    price: 0,
    period: "",
    color: "from-gray-500 to-gray-600",
    features: [
      "基础题库",
      "SM-2间隔复习算法",
      "跨设备同步(限2设备)",
      "基础学习统计",
    ],
  },
  pro: {
    name: "专业版",
    icon: Crown,
    price: 99,
    period: "月/学校",
    color: "from-blue-500 to-indigo-600",
    features: [
      "免费版全部功能",
      "扩展题库",
      "班级管理(最多50学生)",
      "作业布置功能",
      "基础学情分析",
      "优先客服支持",
    ],
    recommended: true,
  },
  enterprise: {
    name: "旗舰版",
    icon: Building2,
    price: 299,
    period: "月/学校",
    color: "from-purple-500 to-pink-600",
    features: [
      "专业版全部功能",
      "无限班级",
      "AI智能出题",
      "高级数据分析",
      "学情报告生成",
      "API接入",
      "专属客服",
      "私有部署选项",
    ],
  },
} as const

export default function SubscriptionPage() {
  const { currentUser: user } = useUserStore()
  const [currentPlan, setCurrentPlan] = useState<string>("free")
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  useEffect(() => {
    setCurrentPlan("free")
  }, [user])

  const handleSelectPlan = async (plan: string) => {
    if (plan === currentPlan) return
    setShowConfirm(plan)
  }

  const confirmUpgrade = async () => {
    if (!showConfirm) return
    setIsLoading(true)

    try {
      const response = await apiClient.post("/subscription/create", { plan: showConfirm })
      if (response.success) {
        setCurrentPlan(showConfirm)
      }
    } catch (error) {
      console.error("Failed to create subscription:", error)
    } finally {
      setIsLoading(false)
      setShowConfirm(null)
    }
  }

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    try {
      await apiClient.post("/subscription/cancel")
      setCurrentPlan("free")
    } catch (error) {
      console.error("Failed to cancel subscription:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl font-bold text-gray-900">订阅管理</h1>
          <p className="text-gray-600 text-sm mt-0.5">选择适合你的学习方案</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(PLAN_FEATURES).map(([key, plan], index) => {
            const Icon = plan.icon
            const isCurrent = currentPlan === key
            const isRecommended = "recommended" in plan && plan.recommended

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  isCurrent
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                } ${isRecommended ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      推荐
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                      当前方案
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${plan.color} text-white mb-4`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">¥{plan.price}</span>
                    {plan.price > 0 && <span className="text-gray-500 text-sm">/{plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPlan(key)}
                  disabled={isCurrent || isLoading}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
                    isCurrent
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                  }`}
                >
                  {isCurrent ? "当前方案" : isRecommended ? "立即升级" : "选择此方案"}
                </motion.button>
              </motion.div>
            )
          })}
        </div>

        {currentPlan !== "free" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4">当前订阅</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES]?.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {currentPlan === "pro" && "包含50学生额度"}
                  {currentPlan === "enterprise" && "包含无限班级"}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                取消订阅
              </motion.button>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  确认升级到{PLAN_FEATURES[showConfirm as keyof typeof PLAN_FEATURES]?.name}
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  {showConfirm === "pro" && "专业版每月 ¥99，可管理50个学生班级，享受高级学情分析。"}
                  {showConfirm === "enterprise" && "旗舰版每月 ¥299，无限班级，AI智能出题，私有部署选项。"}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                  >
                    取消
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmUpgrade}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        确认升级
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AppLayout } from "@/components/layout/app-layout"
import { educationAPI } from "@/lib/api/education-api"
import {
  Key,
  CheckCircle,
  XCircle,
  ExternalLink,
  Shield,
  BookOpen,
  Sparkles,
} from "lucide-react"

export default function APISettingsPage() {
  const [baiduApiKey, setBaiduApiKey] = useState("")
  const [khanApiKey, setKhanApiKey] = useState("")
  const [nationalApiKey, setNationalApiKey] = useState("")
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ api: string; success: boolean; message: string } | null>(null)

  useEffect(() => {
    setBaiduApiKey(localStorage.getItem("baidu_api_key") || "")
    setKhanApiKey(localStorage.getItem("khan_api_key") || "")
    setNationalApiKey(localStorage.getItem("national_api_key") || "")
  }, [])

  const handleSave = () => {
    if (baiduApiKey) localStorage.setItem("baidu_api_key", baiduApiKey)
    else localStorage.removeItem("baidu_api_key")

    if (khanApiKey) localStorage.setItem("khan_api_key", khanApiKey)
    else localStorage.removeItem("khan_api_key")

    if (nationalApiKey) localStorage.setItem("national_api_key", nationalApiKey)
    else localStorage.removeItem("national_api_key")

    educationAPI.configure({ baiduApiKey })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const testAPI = async (apiName: string) => {
    setTesting(apiName)
    setTestResult(null)

    try {
      if (apiName === "baidu") {
        const results = await educationAPI.searchBaiduBaike("数学")
        setTestResult({
          api: "baidu",
          success: results.length > 0,
          message: results.length > 0 ? `成功获取 ${results.length} 条结果` : "未获取到结果",
        })
      }
    } catch {
      setTestResult({
        api: apiName,
        success: false,
        message: "API调用失败",
      })
    } finally {
      setTesting(null)
    }
  }

  const apis = [
    {
      id: "baidu",
      name: "百度百科",
      icon: BookOpen,
      description: "获取知识点详解和词条内容",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      docsUrl: "https://ai.baidu.com/ai-doc/REFERENCE/Qkdygd4xh",
      keyPlaceholder: "输入百度API Key",
    },
    {
      id: "khan",
      name: "Khan Academy",
      icon: Sparkles,
      description: "可汗学院免费课程资源",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      docsUrl: "https://github.com/learningequality/khan-api-python",
      keyPlaceholder: "输入Khan Academy Key",
      note: "需要OAuth认证，较复杂",
    },
    {
      id: "national",
      name: "国家智慧教育平台",
      icon: Shield,
      description: "官方教育资源，需申请接入",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      docsUrl: "https://system.smartedu.cn",
      keyPlaceholder: "输入平台接入Key",
      note: "需要提交申请并审批",
    },
  ]

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">API 设置</h1>
          <p className="text-gray-500 mt-1">
            配置外部教育API以获取更丰富的学科数据
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">免费API推荐</h3>
              <p className="text-sm text-blue-700 mt-1">
                百度百科API有免费额度，国家智慧教育平台需要机构申请。Khan Academy API已逐步停用。
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {apis.map((api) => {
            const Icon = api.icon
            const isTested = testResult?.api === api.id
            const isSuccess = isTested && testResult?.success

            return (
              <motion.div
                key={api.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className={`h-1 bg-gradient-to-r ${api.color}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${api.bgColor}`}>
                        <Icon className={`w-5 h-5 ${api.textColor}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{api.name}</h3>
                        <p className="text-sm text-gray-500">{api.description}</p>
                        {api.note && (
                          <p className="text-xs text-amber-600 mt-1">{api.note}</p>
                        )}
                      </div>
                    </div>
                    <a
                      href={api.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg hover:${api.bgColor} transition-colors`}
                    >
                      <ExternalLink className={`w-4 h-4 ${api.textColor}`} />
                    </a>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={
                        api.id === "baidu"
                          ? baiduApiKey
                          : api.id === "khan"
                          ? khanApiKey
                          : nationalApiKey
                      }
                      onChange={(e) => {
                        if (api.id === "baidu") setBaiduApiKey(e.target.value)
                        else if (api.id === "khan") setKhanApiKey(e.target.value)
                        else setNationalApiKey(e.target.value)
                      }}
                      placeholder={api.keyPlaceholder}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      onClick={() => testAPI(api.id)}
                      disabled={testing !== null || !(
                        (api.id === "baidu" && baiduApiKey) ||
                        (api.id === "khan" && khanApiKey) ||
                        (api.id === "national" && nationalApiKey)
                      )}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {testing === api.id ? "测试中..." : "测试"}
                    </button>
                  </div>

                  {isTested && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={`mt-3 flex items-center gap-2 text-sm ${
                        isSuccess ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {testResult?.message}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
          >
            保存设置
          </button>

          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-green-600"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">设置已保存</span>
            </motion.div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mt-6">
          <h4 className="font-medium text-gray-900 mb-2">如何获取API Key？</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">1.</span>
              <span>
                <strong>百度百科</strong>：访问{" "}
                <a href="https://ai.baidu.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  ai.baidu.com
                </a>
                ，注册后创建应用获取API Key
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">2.</span>
              <span>
                <strong>Khan Academy</strong>：API已逐步停用，建议使用百度百科
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">3.</span>
              <span>
                <strong>国家智慧教育平台</strong>：需要联系当地教育局申请机构接入
              </span>
            </li>
          </ul>
        </div>
      </motion.div>
    </AppLayout>
  )
}

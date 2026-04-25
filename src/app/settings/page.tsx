"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { motion } from "framer-motion"
import { Bell, Moon, Shield, Database, Trash2, Download, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { seedDatabase } from "@/data/seed"

export default function SettingsPage() {
  const { currentUser } = useUserStore()
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [dataStats, setDataStats] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    loadDataStats()
  }, [currentUser])

  const handleExportData = async () => {
    if (!currentUser) return
    setExportStatus("exporting")
    
    try {
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        subjects: await db.subjects.toArray(),
        chapters: await db.chapters.toArray(),
        knowledgePoints: await db.knowledgePoints.toArray(),
        questions: await db.questions.toArray(),
        questionOptions: await db.questionOptions.toArray(),
        testPapers: await db.testPapers.toArray(),
        testPaperQuestions: await db.testPaperQuestions.toArray(),
        knowledgeRelations: await db.knowledgeRelations.toArray(),
        userAnswers: await db.userAnswers.where("userId").equals(currentUser.id).toArray(),
        wrongQuestions: await db.wrongQuestions.where("userId").equals(currentUser.id).toArray(),
        userFiles: await db.userFiles.where("userId").equals(currentUser.id).toArray(),
        fileFolders: await db.fileFolders.where("userId").equals(currentUser.id).toArray(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `knowledge-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportStatus("success")
    } catch (error) {
      console.error("Export failed:", error)
      setExportStatus("error")
    }

    setTimeout(() => setExportStatus(null), 3000)
  }

  const handleImportData = async () => {
    if (!currentUser) return
    
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setImportStatus("importing")
      
      try {
        const text = await file.text()
        const importData = JSON.parse(text)

        if (!importData.version) {
          throw new Error("无效的备份文件")
        }

        await db.transaction(
          "rw",
          [
            db.subjects, db.chapters, db.knowledgePoints,
            db.questions, db.questionOptions, db.testPapers,
            db.testPaperQuestions, db.knowledgeRelations,
            db.userAnswers, db.wrongQuestions, db.userFiles, db.fileFolders,
          ],
          async () => {
            if (importData.subjects?.length) await db.subjects.bulkPut(importData.subjects)
            if (importData.chapters?.length) await db.chapters.bulkPut(importData.chapters)
            if (importData.knowledgePoints?.length) await db.knowledgePoints.bulkPut(importData.knowledgePoints)
            if (importData.questions?.length) await db.questions.bulkPut(importData.questions)
            if (importData.questionOptions?.length) await db.questionOptions.bulkPut(importData.questionOptions)
            if (importData.testPapers?.length) await db.testPapers.bulkPut(importData.testPapers)
            if (importData.testPaperQuestions?.length) await db.testPaperQuestions.bulkPut(importData.testPaperQuestions)
            if (importData.knowledgeRelations?.length) await db.knowledgeRelations.bulkPut(importData.knowledgeRelations)
            if (importData.userAnswers?.length) await db.userAnswers.bulkPut(importData.userAnswers)
            if (importData.wrongQuestions?.length) await db.wrongQuestions.bulkPut(importData.wrongQuestions)
            if (importData.userFiles?.length) await db.userFiles.bulkPut(importData.userFiles)
            if (importData.fileFolders?.length) await db.fileFolders.bulkPut(importData.fileFolders)
          }
        )

        setImportStatus("success")
      } catch (error) {
        console.error("Import failed:", error)
        setImportStatus("error")
      }

      setTimeout(() => setImportStatus(null), 3000)
    }
    input.click()
  }

  const handleClearData = async () => {
    if (!currentUser) return
    if (!confirm("确定要清除所有用户数据吗？此操作不可恢复！")) return

    await db.userAnswers.where("userId").equals(currentUser.id).delete()
    await db.wrongQuestions.where("userId").equals(currentUser.id).delete()
    await db.userFiles.where("userId").equals(currentUser.id).delete()
    await db.fileFolders.where("userId").equals(currentUser.id).delete()
    
    await loadDataStats()
  }

  const handleReseedData = async () => {
    await seedDatabase()
    await loadDataStats()
  }

  const loadDataStats = async () => {
    if (!currentUser) return
    
    const stats = {
      subjects: await db.subjects.count(),
      chapters: await db.chapters.count(),
      knowledgePoints: await db.knowledgePoints.count(),
      questions: await db.questions.count(),
      testPapers: await db.testPapers.count(),
      userAnswers: await db.userAnswers.where("userId").equals(currentUser.id).count(),
      wrongQuestions: await db.wrongQuestions.where("userId").equals(currentUser.id).count(),
      files: await db.userFiles.where("userId").equals(currentUser.id).count(),
    }
    setDataStats(stats)
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-gray-900">设置</h1>
          <p className="text-gray-600 mt-1">管理你的账户和应用设置</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">数据统计</h3>
            <button
              onClick={loadDataStats}
              className="ml-auto text-xs text-blue-600 hover:text-blue-700"
            >
              刷新
            </button>
          </div>
          {dataStats ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{dataStats.subjects}</p>
                <p className="text-xs text-gray-500">学科</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{dataStats.chapters}</p>
                <p className="text-xs text-gray-500">章节</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{dataStats.questions}</p>
                <p className="text-xs text-gray-500">题目</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{dataStats.files}</p>
                <p className="text-xs text-gray-500">文件</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">点击刷新加载统计数据</p>
          )}
        </motion.div>

        {[
          { title: "通知设置", desc: "管理提醒和通知偏好", icon: Bell },
          { title: "外观设置", desc: "主题和显示设置", icon: Moon },
          { title: "隐私与安全", desc: "数据隐私和安全选项", icon: Shield },
        ].map((item, index) => (
          <motion.button
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex w-full items-center gap-4 rounded-xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <item.icon className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          </motion.button>
        ))}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">数据管理</h3>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <button
                onClick={handleExportData}
                disabled={exportStatus === "exporting"}
                className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {exportStatus === "exporting" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent"
                    />
                  ) : exportStatus === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : exportStatus === "error" ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Download className="h-4 w-4 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">导出数据</p>
                    <p className="text-sm text-gray-500">将所有数据导出为JSON文件</p>
                  </div>
                </div>
                {exportStatus === "success" && <span className="text-sm text-green-600">导出成功！</span>}
                {exportStatus === "error" && <span className="text-sm text-red-600">导出失败</span>}
              </button>
            </div>

            <div className="relative">
              <button
                onClick={handleImportData}
                disabled={importStatus === "importing"}
                className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {importStatus === "importing" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent"
                    />
                  ) : importStatus === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : importStatus === "error" ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Upload className="h-4 w-4 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">导入数据</p>
                    <p className="text-sm text-gray-500">从JSON文件恢复数据</p>
                  </div>
                </div>
                {importStatus === "success" && <span className="text-sm text-green-600">导入成功！</span>}
                {importStatus === "error" && <span className="text-sm text-red-600">导入失败</span>}
              </button>
            </div>

            <button
              onClick={handleReseedData}
              className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition text-left"
            >
              <div>
                <p className="font-medium text-gray-900">初始化题库数据</p>
                <p className="text-sm text-gray-500">重新加载示例题目和学科数据</p>
              </div>
            </button>

            <button
              onClick={handleClearData}
              className="flex w-full items-center justify-between rounded-lg border border-red-200 p-3 hover:bg-red-50 transition text-left"
            >
              <div className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-4 w-4" />
                <div>
                  <p className="font-medium">清除用户数据</p>
                  <p className="text-sm text-red-400">清除答题记录、错题、文件等用户数据</p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  )
}

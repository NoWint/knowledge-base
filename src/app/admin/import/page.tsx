"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Database, CheckCircle, AlertCircle, Loader2, BookOpen, FileJson, RefreshCw } from 'lucide-react'
import { db } from '@/lib/db/database'
import { useToast } from '@/components/ui/toast'
import { importSubjects, importChapters } from '@/lib/data-import/importers'
import { AppLayout } from '@/components/layout/app-layout'

interface ImportResult {
  subject: string
  success: boolean
  count: number
  error?: string
}

interface ImportStats {
  subjects: number
  chapters: number
  knowledgePoints: number
  questions: number
  articles: number
}

interface SubjectDataStatus {
  id: string
  name: string
  hasCurriculum: boolean
  hasKnowledge: boolean
  hasQuestions: boolean
}

export default function DataImportPage() {
  const { showToast } = useToast()
  const [importing, setImporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<ImportResult[]>([])
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [lastImport, setLastImport] = useState<string | null>(null)
  const [dataStatus, setDataStatus] = useState<SubjectDataStatus[]>([])

  useEffect(() => {
    checkExistingData()
    const saved = localStorage.getItem('lastDataImport')
    if (saved) setLastImport(new Date(saved).toLocaleString('zh-CN'))
  }, [])

  const checkExistingData = async () => {
    setLoading(true)
    try {
      const dbStats = {
        subjects: await db.subjects.count(),
        chapters: await db.chapters.count(),
        knowledgePoints: await db.knowledgePoints.count(),
        questions: await db.questions.count(),
        articles: await db.articles.count(),
      }
      setStats(dbStats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleImportSubjects = async () => {
    setImporting(true)
    try {
      const count = await importSubjects()
      if (count > 0) {
        showToast(`成功导入 ${count} 个学科`, 'success')
      } else {
        showToast('学科已存在，跳过', 'info')
      }
      await checkExistingData()
    } catch (error) {
      showToast('导入失败', 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleImportChapters = async () => {
    setImporting(true)
    const newResults: ImportResult[] = []
    
    try {
      const subjects = await db.subjects.toArray()
      
      for (const subject of subjects) {
        try {
          const curriculum = await import(`@/data/subjects/${subject.id}/chapters/curriculum`).catch(() => null)
          if (curriculum?.default?.chapters) {
            const count = await importChapters(subject.id, curriculum.default.chapters)
            newResults.push({ 
              subject: subject.name, 
              success: true, 
              count 
            })
          } else {
            newResults.push({ 
              subject: subject.name, 
              success: false, 
              count: 0,
              error: '无章节数据' 
            })
          }
        } catch (error) {
          newResults.push({ 
            subject: subject.name, 
            success: false, 
            count: 0,
            error: String(error) 
          })
        }
      }
      
      setResults(newResults)
      await checkExistingData()
      showToast('章节导入完成', 'success')
    } catch (error) {
      showToast('导入失败', 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleClearDatabase = async () => {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return
    
    try {
      await db.delete()
      await db.open()
      localStorage.removeItem('lastDataImport')
      setStats(null)
      setResults([])
      setLastImport(null)
      showToast('数据库已清空', 'success')
    } catch (error) {
      showToast('清空失败', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const hasData = stats && stats.subjects > 0

  return (
    <AppLayout>
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            知识库数据导入
          </h1>
          <p className="text-gray-500 mt-2">将学科资料导入到本地 IndexedDB 数据库</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">导入说明</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">学科基础数据</h3>
                  <p className="text-sm text-blue-700 mt-1">包含10个中考学科的章节结构和知识点</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900">本地优先存储</h3>
                  <p className="text-sm text-green-700 mt-1">所有数据存储在浏览器本地 IndexedDB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {stats && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  当前数据库状态
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stats.subjects}</div>
                    <div className="text-xs text-indigo-500">学科</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.chapters}</div>
                    <div className="text-xs text-blue-500">章节</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.knowledgePoints}</div>
                    <div className="text-xs text-green-500">知识点</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.questions}</div>
                    <div className="text-xs text-orange-500">题目</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.articles}</div>
                    <div className="text-xs text-purple-500">文章</div>
                  </div>
                </div>
              </div>
            )}

            {!hasData ? (
              <button
                onClick={handleImportSubjects}
                disabled={importing}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>导入中...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span>导入学科基础数据</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleImportChapters}
                  disabled={importing}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-green-500/25 hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>导入章节数据...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5" />
                      <span>导入章节和知识点</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleClearDatabase}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                >
                  <AlertCircle className="h-5 w-5" />
                  <span>清空数据库</span>
                </button>
              </div>
            )}

            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                <h3 className="font-semibold text-gray-800 mb-3">导入结果</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        result.success ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                          {result.subject}
                        </span>
                      </div>
                      <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                        {result.success ? `+${result.count} 条` : result.error}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {lastImport && (
              <p className="text-center text-sm text-gray-500 mt-4">
                上次导入时间: {lastImport}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
    </AppLayout>
  )
}

"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { parseSubjectsExcel, parseChaptersExcel, parseKnowledgePointsExcel, parseQuestionsExcel, parseRelationsExcel } from "@/lib/import/excel-parser"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Database, Table, Zap } from "lucide-react"
import { smoothEase } from "@/lib/animations"

interface ImportResult {
  type: string
  count: number
  success: boolean
  error?: string
}

const templateInfo = [
  {
    title: "学科数据",
    icon: "📚",
    description: "导入学科目录（初中语数英物化生史地政体）",
    columns: ["id", "name", "icon", "gradeLevel", "description", "orderIndex"],
    example: "math,数学,🔢,7-9,代数几何概率统计,2",
  },
  {
    title: "章节数据",
    icon: "📖",
    description: "导入各学科的章节目录（支持多级章节）",
    columns: ["id", "subjectId", "parentId", "name", "orderIndex", "description"],
    example: "math-7-up,math,,七年级上册,1,",
  },
  {
    title: "知识点数据",
    icon: "💡",
    description: "导入章节下的知识点（含难度和内容）",
    columns: ["id", "chapterId", "name", "description", "difficulty", "content"],
    example: "kp-math-rational,math-7-up-1,正数负数,有理数概念,1,大于0的数...",
  },
  {
    title: "题目数据",
    icon: "❓",
    description: "导入题目和选项（支持单选/判断/多选）",
    columns: ["id", "knowledgePointId", "type", "difficulty", "content", "optionA", "optionB", "optionC", "optionD", "answer", "explanation", "source"],
    example: "q-001,kp-math-rational,single,1,哪个是正数?,+5,-3,0,-10,A,正数大于0,exam",
  },
  {
    title: "知识关联",
    icon: "🔗",
    description: "导入知识点间的关联关系（前置/后续/跨学科）",
    columns: ["id", "sourceKpId", "targetKpId", "relationType", "description"],
    example: "rel-001,kp-math-pythagoras,physics-force,prerequisite,勾股定理是力学基础",
  },
]

export default function ImportPage() {
  const [results, setResults] = useState<ImportResult[]>([])
  const [importing, setImporting] = useState(false)
  const [dragActive, setDragActive] = useState<string | null>(null)
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({})

  const handleFile = useCallback(async (type: string, file: File) => {
    setImporting(true)
    try {
      let result: ImportResult
      switch (type) {
        case "subjects": {
          const data = await parseSubjectsExcel(file)
          await db.subjects.bulkPut(data)
          result = { type: "学科数据", count: data.length, success: true }
          break
        }
        case "chapters": {
          const data = await parseChaptersExcel(file)
          await db.chapters.bulkPut(data)
          result = { type: "章节数据", count: data.length, success: true }
          break
        }
        case "knowledgePoints": {
          const data = await parseKnowledgePointsExcel(file)
          await db.knowledgePoints.bulkPut(data)
          result = { type: "知识点数据", count: data.length, success: true }
          break
        }
        case "questions": {
          const { questions, options } = await parseQuestionsExcel(file)
          await db.transaction('rw', [db.questions, db.questionOptions], async () => {
            await db.questions.bulkPut(questions)
            await db.questionOptions.bulkPut(options)
          })
          result = { type: "题目数据", count: questions.length, success: true }
          break
        }
        case "relations": {
          const data = await parseRelationsExcel(file)
          await db.knowledgeRelations.bulkPut(data)
          result = { type: "知识关联", count: data.length, success: true }
          break
        }
        default:
          result = { type, count: 0, success: false, error: "未知数据类型" }
      }
      setResults(prev => [result, ...prev])
    } catch (err) {
      setResults(prev => [{ type: templateInfo.find(t => {
        const map: Record<string, string> = { subjects: "学科数据", chapters: "章节数据", knowledgePoints: "知识点数据", questions: "题目数据", relations: "知识关联" }
        return map[t.title] === type
      })?.title || type, count: 0, success: false, error: err instanceof Error ? err.message : "导入失败" }])
    } finally {
      setImporting(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, type: string) => {
    e.preventDefault()
    setDragActive(null)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(type, file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0]
    if (file) handleFile(type, file)
  }, [handleFile])

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: smoothEase }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据导入</h1>
          <p className="text-gray-600 mt-1">通过 Excel 文件导入学科、题目、知识点等数据</p>
        </div>

        <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 p-4 flex items-start gap-3">
          <Database className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">数据导入说明</p>
            <p className="text-sm text-blue-700 mt-1">
              所有数据通过 Excel 文件导入，代码中不再硬编码。请按照下方模板格式准备 Excel 文件（.xlsx 格式），第一行为列名。
              支持拖拽上传或点击选择文件。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templateInfo.map((template, index) => (
            <motion.div
              key={template.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{template.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{template.title}</h3>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </div>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(template.title) }}
                onDragLeave={() => setDragActive(null)}
                onDrop={(e) => handleDrop(e, template.title === "学科数据" ? "subjects" : template.title === "章节数据" ? "chapters" : template.title === "知识点数据" ? "knowledgePoints" : template.title === "题目数据" ? "questions" : "relations")}
                className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                  dragActive === template.title ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">拖拽 Excel 文件到此处</p>
                <p className="text-xs text-gray-400 mt-1">或点击选择文件</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileInput(e, template.title === "学科数据" ? "subjects" : template.title === "章节数据" ? "chapters" : template.title === "知识点数据" ? "knowledgePoints" : template.title === "题目数据" ? "questions" : "relations")}
                  className="hidden"
                  ref={el => {
                    const key = template.title === "学科数据" ? "subjects" : template.title === "章节数据" ? "chapters" : template.title === "知识点数据" ? "knowledgePoints" : template.title === "题目数据" ? "questions" : "relations"
                    fileInputsRef.current[key] = el
                  }}
                  onClick={(e) => {
                    const input = e.target as HTMLInputElement
                    if (fileInputsRef.current[template.title === "学科数据" ? "subjects" : template.title === "章节数据" ? "chapters" : template.title === "知识点数据" ? "knowledgePoints" : template.title === "题目数据" ? "questions" : "relations"] === input) {
                      input.value = ''
                    }
                  }}
                />
                <button
                  onClick={() => fileInputsRef.current[template.title === "学科数据" ? "subjects" : template.title === "章节数据" ? "chapters" : template.title === "知识点数据" ? "knowledgePoints" : template.title === "题目数据" ? "questions" : "relations"]?.click()}
                  className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <FileSpreadsheet className="h-3 w-3" /> 选择文件
                </button>
              </div>

              <div className="mt-3 rounded-md bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-600 mb-1">列名要求：</p>
                <p className="text-xs text-gray-500">{template.columns.join(" | ")}</p>
              </div>
              <div className="mt-2 rounded-md bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-600 mb-1">示例数据：</p>
                <p className="text-xs text-gray-500 font-mono">{template.example}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="h-4 w-4" /> 导入记录
              </h3>
              {results.map((result, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`rounded-lg border p-3 flex items-center gap-3 ${
                    result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  {result.success ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{result.type}</p>
                    {result.success ? (
                      <p className="text-xs text-green-700">成功导入 {result.count} 条数据</p>
                    ) : (
                      <p className="text-xs text-red-700">{result.error}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppLayout>
  )
}

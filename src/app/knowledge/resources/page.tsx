"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import type { KnowledgePoint, Chapter, Question, QuestionOption, KnowledgeRelation } from "@/types"
import { BookOpen, ArrowLeft, FileText, ChevronRight, Target, Link } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import { useToast } from "@/components/ui/toast"

export default function KnowledgeResourcesPage() {
  return (
    <Suspense fallback={<AppLayout><div className="flex h-[400px] items-center justify-center"><div className="text-center"><BookOpen className="mx-auto h-12 w-12 animate-pulse text-gray-400" /><p className="mt-4 text-sm text-gray-500">加载知识资料...</p></div></div></AppLayout>}>
      <KnowledgeResourcesContent />
    </Suspense>
  )
}

function KnowledgeResourcesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()
  const kpId = searchParams.get("kp")
  
  const [knowledgePoint, setKnowledgePoint] = useState<KnowledgePoint | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [relatedQuestions, setRelatedQuestions] = useState<{ question: Question, options: QuestionOption[] }[]>([])
  const [relatedKps, setRelatedKps] = useState<{ kp: KnowledgePoint, relation: KnowledgeRelation, type: 'source' | 'target' }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!kpId) {
        setLoading(false)
        return
      }

      try {
        const kp = await db.knowledgePoints.get(kpId)
        if (!kp) {
          setLoading(false)
          return
        }
        setKnowledgePoint(kp)

        const ch = await db.chapters.get(kp.chapterId)
        setChapter(ch || null)

        const questions = await db.questions.where("knowledgePointId").equals(kpId).toArray()
        const questionsWithOptions = []
        for (const q of questions) {
          const opts = await db.questionOptions.where("questionId").equals(q.id).toArray()
          questionsWithOptions.push({ question: q, options: opts })
        }
        setRelatedQuestions(questionsWithOptions)

        const relations = await db.knowledgeRelations.toArray()
        const relatedKpList = []
        for (const rel of relations) {
          if (rel.sourceKpId === kpId) {
            const targetKp = await db.knowledgePoints.get(rel.targetKpId)
            if (targetKp) {
              relatedKpList.push({ kp: targetKp, relation: rel, type: 'target' as const })
            }
          }
          if (rel.targetKpId === kpId) {
            const sourceKp = await db.knowledgePoints.get(rel.sourceKpId)
            if (sourceKp) {
              relatedKpList.push({ kp: sourceKp, relation: rel, type: 'source' as const })
            }
          }
        }
        setRelatedKps(relatedKpList)
      } catch (err) {
        console.error("Failed to load knowledge resources:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [kpId])

  const handleKpClick = useCallback((kpId: string) => {
    router.push(`/knowledge/resources?kp=${kpId}`)
  }, [router])

  async function createFlashCard() {
    if (!knowledgePoint) return
    const front = knowledgePoint.name
    const back = knowledgePoint.description || knowledgePoint.content?.slice(0, 200) || ''

    await db.flashCards.add({
      id: crypto.randomUUID(),
      knowledgePointId: knowledgePoint.id,
      front,
      back,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    showToast('闪卡已创建！', 'success')
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 animate-pulse text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">加载知识资料...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!knowledgePoint) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">未找到该知识点</p>
            <button onClick={() => router.push("/knowledge")} className="mt-4 text-blue-600 hover:text-blue-700">
              返回知识图谱
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const relationTypeLabels: Record<string, string> = {
    prerequisite: '前置基础',
    successor: '后续进阶',
    related: '关联应用',
    cross_subject: '跨学科',
    extension: '拓展延伸',
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: smoothEase }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/knowledge")}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> 返回图谱
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {chapter && (
                <>
                  <span>{chapter.name}</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
              <span className="font-medium text-gray-900">{knowledgePoint.name}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{knowledgePoint.name}</h1>
          </div>
        </div>

        {knowledgePoint.description && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">知识点概述</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">{knowledgePoint.description}</p>
          </div>
        )}

        {knowledgePoint.content && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">详细内容</h2>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {knowledgePoint.content}
            </div>
          </div>
        )}

        {relatedQuestions.length > 0 && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-gray-900">相关练习 ({relatedQuestions.length}题)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedQuestions.map((item, idx) => (
                <motion.div
                  key={item.question.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="rounded-lg border bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      第 {idx + 1} 题
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{item.question.content}</p>
                      <div className="mt-2 space-y-1">
                        {item.options.map(opt => (
                          <p key={opt.id} className="text-xs text-gray-600">
                            <span className={`font-medium ${opt.isCorrect ? "text-green-700" : ""}`}>{opt.label}.</span> {opt.content}
                            {opt.isCorrect && <span className="ml-1 text-green-700">✓</span>}
                          </p>
                        ))}
                      </div>
                      {item.question.explanation && (
                        <p className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">解析：</span>{item.question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {relatedKps.length > 0 && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Link className="h-5 w-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">知识关联 ({relatedKps.length}条)</h2>
            </div>
            <div className="space-y-2">
              {relatedKps.map((item, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleKpClick(item.kp.id)}
                  className="w-full flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors text-left"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      item.type === 'source' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {item.type === 'source' ? "← 前置" : "→ 后续"}
                    </span>
                    <span className="text-sm text-gray-900">{item.kp.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{relationTypeLabels[item.relation.relationType] || item.relation.relationType}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">学习闪卡</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            将此知识点创建为闪卡，方便复习记忆
          </p>
          <button
            onClick={createFlashCard}
            className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            创建学习闪卡
          </button>
        </div>
      </motion.div>
    </AppLayout>
  )
}

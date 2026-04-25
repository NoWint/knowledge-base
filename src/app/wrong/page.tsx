"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, CheckCircle, RotateCcw, ChevronDown, BookOpen } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import { useToast } from "@/components/ui/toast"
import type { WrongQuestion, Question, QuestionOption, KnowledgePoint, WrongReason } from "@/types"
import { getAllKnowledgePoints } from "@/lib/data-access/subject-data"

const WRONG_REASON_OPTIONS: { value: WrongReason; label: string; emoji: string }[] = [
  { value: 'careless', label: '粗心', emoji: '😑' },
  { value: 'misunderstanding', label: '概念不清', emoji: '🤔' },
  { value: 'forgot', label: '遗忘', emoji: '😵' },
]

export default function WrongPage() {
  const { currentUser } = useUserStore()
  const { showToast } = useToast()
  const [wrongQuestions, setWrongQuestions] = useState<(WrongQuestion & { question: Question; kp: KnowledgePoint })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'wrong' | 'correcting' | 'mastered'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [redoState, setRedoState] = useState<{
    wq: WrongQuestion & { question: Question }
    options: QuestionOption[]
    selectedAnswer: string | null
    submitted: boolean
  } | null>(null)

  useEffect(() => {
    loadWrongQuestions()
  }, [currentUser])

  async function loadWrongQuestions() {
    if (!currentUser) return
    setLoading(true)
    try {
      const wqs = await db.wrongQuestions.where('userId').equals(currentUser.id).toArray()
      const questions = await db.questions.toArray()
      const kps = await getAllKnowledgePoints()

      const questionMap = new Map(questions.map(q => [q.id, q]))
      const kpMap = new Map(kps.map(kp => [kp.id, kp]))

      const enriched = wqs
        .map(wq => {
          const question = questionMap.get(wq.questionId)
          if (!question) return null
          const kp = kpMap.get(question.knowledgePointId) || null
          return { ...wq, question, kp }
        })
        .filter((wq): wq is WrongQuestion & { question: Question; kp: KnowledgePoint } => wq !== null)

      setWrongQuestions(enriched)
    } catch (err) {
      console.error('Failed to load wrong questions:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRedo(wq: WrongQuestion & { question: Question }) {
    if (!currentUser) return
    const options = await db.questionOptions.where('questionId').equals(wq.questionId).toArray()
    if (options.length === 0) return

    setExpandedId(null)
    setRedoState({ wq, options, selectedAnswer: null, submitted: false })
  }

  async function submitRedoAnswer() {
    if (!currentUser || !redoState || !redoState.selectedAnswer) return
    const { wq, options, selectedAnswer } = redoState
    const correctOption = options.find(o => o.isCorrect)
    const isCorrect = selectedAnswer === correctOption?.label
    const userId = currentUser.id

    await db.userAnswers.add({
      id: crypto.randomUUID(),
      userId,
      questionId: wq.questionId,
      answer: selectedAnswer,
      isCorrect,
      answeredAt: new Date(),
      timeSpent: 0,
    })

    if (isCorrect) {
      if (wq.status === 'wrong') {
        await updateStatus(wq.id, 'correcting')
      } else if (wq.status === 'correcting') {
        await updateStatus(wq.id, 'mastered')
      }
      showToast('回答正确！', 'success')
    } else {
      await db.wrongQuestions.update(wq.id, {
        wrongCount: wq.wrongCount + 1,
        lastWrongAt: new Date(),
      })
      showToast('回答错误，请继续订正', 'error')
    }
    setRedoState(null)
    loadWrongQuestions()
  }

  async function updateStatus(id: string, status: WrongQuestion['status']) {
    await db.wrongQuestions.update(id, {
      status,
      masteredAt: status === 'mastered' ? new Date() : null,
    })
    loadWrongQuestions()
  }

  async function updateWrongReason(id: string, reason: WrongReason) {
    await db.wrongQuestions.update(id, { wrongReason: reason })
    loadWrongQuestions()
  }

  async function createFlashCardFromWrong(wq: WrongQuestion & { question: Question }) {
    await db.flashCards.add({
      id: crypto.randomUUID(),
      knowledgePointId: wq.question.knowledgePointId,
      front: wq.question.content.slice(0, 100),
      back: wq.question.answer,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    showToast('闪卡已创建！', 'success')
  }

  const filteredQuestions = filter === 'all'
    ? wrongQuestions
    : wrongQuestions.filter(wq => wq.status === filter)

  const statusCounts = {
    all: wrongQuestions.length,
    wrong: wrongQuestions.filter(wq => wq.status === 'wrong').length,
    correcting: wrongQuestions.filter(wq => wq.status === 'correcting').length,
    mastered: wrongQuestions.filter(wq => wq.status === 'mastered').length,
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <AlertCircle className="h-12 w-12 animate-pulse text-gray-400" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: smoothEase }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">错题本</h1>
              <p className="text-sm text-gray-500">共 {wrongQuestions.length} 道错题</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'all' as const, label: '全部', icon: '📋', color: 'from-gray-500 to-slate-600' },
            { key: 'wrong' as const, label: '待订正', icon: '❌', color: 'from-red-500 to-rose-600' },
            { key: 'correcting' as const, label: '订正中', icon: '🔧', color: 'from-amber-500 to-orange-600' },
            { key: 'mastered' as const, label: '已掌握', icon: '✅', color: 'from-emerald-500 to-green-600' },
          ]).map(({ key, label, icon, color }) => (
            <motion.button
              key={key}
              onClick={() => setFilter(key)}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                filter === key
                  ? `bg-gradient-to-r ${color} text-white shadow-md`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs ${
                filter === key ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {statusCounts[key]}
              </span>
            </motion.button>
          ))}
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-3" />
            <p className="text-gray-600">
              {filter === 'all' ? '暂无错题，保持好成绩！' : '该分类下没有错题'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredQuestions.map((wq, index) => (
                <motion.div
                  key={wq.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-xl border bg-white shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === wq.id ? null : wq.id)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                      wq.status === 'mastered' ? 'bg-green-100 text-green-600' :
                      wq.status === 'correcting' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {wq.status === 'mastered' ? <CheckCircle className="h-4 w-4" /> : wq.wrongCount}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {wq.question?.content?.slice(0, 60)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {wq.kp?.name} · 错误 {wq.wrongCount} 次
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {wq.wrongReason && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                          {WRONG_REASON_OPTIONS.find(r => r.value === wq.wrongReason)?.emoji}
                        </span>
                      )}
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expandedId === wq.id ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedId === wq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t"
                      >
                        <div className="p-4 space-y-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">错误原因</p>
                            <div className="flex gap-2">
                              {WRONG_REASON_OPTIONS.map(option => (
                                <button
                                  key={option.value}
                                  onClick={() => updateWrongReason(wq.id, option.value)}
                                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                                    wq.wrongReason === option.value
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {option.emoji} {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {wq.question && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">正确答案</p>
                              <p className="text-sm text-green-600 font-medium">{wq.question.answer}</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {wq.status === 'wrong' && (
                              <button
                                onClick={() => updateStatus(wq.id, 'correcting')}
                                className="flex-1 px-3 py-2 rounded-lg bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600"
                              >
                                开始订正
                              </button>
                            )}
                            {wq.status === 'correcting' && (
                              <button
                                onClick={() => updateStatus(wq.id, 'mastered')}
                                className="flex-1 px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600"
                              >
                                已掌握
                              </button>
                            )}
                            <button
                              onClick={() => handleRedo(wq)}
                              className="flex-1 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-1.5"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> 重做
                            </button>
                            <button
                              onClick={() => createFlashCardFromWrong(wq)}
                              className="flex-1 px-3 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 flex items-center justify-center gap-1.5"
                            >
                              <BookOpen className="h-3.5 w-3.5" /> 创建闪卡
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {redoState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setRedoState(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-bold text-gray-900 mb-3">重做题目</h3>
                <p className="text-sm text-gray-700 mb-4">{redoState.wq.question.content}</p>
                <div className="space-y-2 mb-4">
                  {redoState.options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setRedoState({ ...redoState, selectedAnswer: opt.label })}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                        redoState.selectedAnswer === opt.label
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium mr-2">{opt.label}.</span> {opt.content}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRedoState(null)}
                    className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={submitRedoAnswer}
                    disabled={!redoState.selectedAnswer}
                    className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                  >
                    提交答案
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppLayout>
  )
}
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import type { TestPaper, TestPaperQuestion, Question, QuestionOption } from "@/types"
import { Clock, FileText, AlertCircle, Play, ArrowLeft, ArrowRight, CheckCircle, XCircle, Timer, Award, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { smoothEase } from "@/lib/animations"

type ExamPhase = "list" | "confirm" | "taking" | "results"

interface ExamQuestion {
  question: Question
  options: QuestionOption[]
}

export default function ExamPage() {
  const router = useRouter()
  const { currentUser } = useUserStore()
  const [phase, setPhase] = useState<ExamPhase>("list")
  const [papers, setPapers] = useState<TestPaper[]>([])
  const [selectedPaper, setSelectedPaper] = useState<TestPaper | null>(null)
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([])
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [score, setScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    db.testPapers.toArray().then(setPapers)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!selectedPaper || !currentUser || examQuestions.length === 0) return

    let correctCount = 0
    let answeredCount = 0
    const userId = currentUser.id

    await db.transaction('rw', [db.userAnswers, db.wrongQuestions], async () => {
      for (const eq of examQuestions) {
        const userAnswer = answers[eq.question.id]
        const correctOption = eq.options.find(o => o.isCorrect)
        const isAnswered = !!userAnswer
        const isCorrect = isAnswered && userAnswer === correctOption?.label
        if (isCorrect) correctCount++
        if (isAnswered) answeredCount++

        if (userAnswer) {
          await db.userAnswers.add({
            id: crypto.randomUUID(),
            userId,
            questionId: eq.question.id,
            answer: userAnswer,
            isCorrect,
            answeredAt: new Date(),
            timeSpent: 0,
          })
        }

        if (!isCorrect && userAnswer) {
          const existing = await db.wrongQuestions.where({ userId, questionId: eq.question.id }).first()
          if (existing) {
            await db.wrongQuestions.update(existing.id, {
              wrongCount: existing.wrongCount + 1,
              lastWrongAt: new Date(),
              status: "wrong",
              masteredAt: null,
            })
          } else {
            await db.wrongQuestions.add({
              id: crypto.randomUUID(),
              userId,
              questionId: eq.question.id,
              wrongCount: 1,
              lastWrongAt: new Date(),
              masteredAt: null,
              status: "wrong",
              createdAt: new Date(),
              wrongReason: null,
              lastWrongReason: "",
            })
          }
        }
      }
    })

    const calculatedScore = Math.round((correctCount / examQuestions.length) * selectedPaper.totalScore)
    setScore(calculatedScore)
    setPhase("results")
  }, [examQuestions, answers, selectedPaper, currentUser])

  useEffect(() => {
    if (phase !== "taking") return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  useEffect(() => {
    if (phase === "taking" && timeLeft === 0 && examQuestions.length > 0) {
      handleSubmit()
    }
  }, [timeLeft, phase, handleSubmit, examQuestions.length])

  const handleStartExam = async (paper: TestPaper) => {
    setSelectedPaper(paper)
    setPhase("confirm")
  }

  const handleConfirmStart = async () => {
    if (!selectedPaper) return

    const paperQuestions = await db.testPaperQuestions
      .where("testPaperId")
      .equals(selectedPaper.id)
      .sortBy("orderIndex")

    const questionsWithOptions: ExamQuestion[] = []
    for (const pq of paperQuestions) {
      const question = await db.questions.get(pq.questionId)
      if (question) {
        const options = await db.questionOptions.where("questionId").equals(question.id).toArray()
        questionsWithOptions.push({ question, options })
      }
    }

    setExamQuestions(questionsWithOptions)
    setTotalQuestions(questionsWithOptions.length)
    setTimeLeft((selectedPaper.timeLimit || 60) * 60)
    setAnswers({})
    setCurrentQIndex(0)
    setPhase("taking")
  }

  const handleSelectAnswer = (questionId: string, label: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: label }))
  }

  const handleRestart = () => {
    setPhase("list")
    setSelectedPaper(null)
    setExamQuestions([])
    setAnswers({})
    setCurrentQIndex(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const currentQuestion = examQuestions[currentQIndex]
  const answeredCount = Object.keys(answers).length
  const progressPercent = examQuestions.length > 0 ? (answeredCount / examQuestions.length) * 100 : 0

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        {phase === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: smoothEase }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">模拟考试</h1>
              <p className="text-gray-600 mt-1">限时模拟，体验中考环境</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {papers.map((paper, index) => {
                const colors = [
                  "from-blue-500 to-blue-600",
                  "from-red-500 to-rose-600",
                  "from-green-500 to-emerald-600",
                  "from-yellow-500 to-amber-600",
                  "from-purple-500 to-violet-600",
                ]
                return (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colors[index % colors.length]} text-white shadow-md`}>
                        <FileText className="h-6 w-6" />
                      </div>
                      <span className="px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600">{paper.subjectId}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">{paper.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{paper.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {paper.timeLimit}分钟</span>
                      <span className="flex items-center gap-1"><AlertCircle className="h-4 w-4" /> 满分{paper.totalScore}分</span>
                    </div>
                    <button
                      onClick={() => handleStartExam(paper)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-white font-medium hover:bg-gray-800 transition-colors"
                    >
                      <Play className="h-4 w-4" /> 开始考试
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {phase === "confirm" && selectedPaper && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: smoothEase }}
            className="mx-auto max-w-lg space-y-6"
          >
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">{selectedPaper.name}</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">考试时长</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedPaper.timeLimit} 分钟</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">满分</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedPaper.totalScore} 分</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-left text-sm text-gray-600">
                  <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> 倒计时自动交卷</p>
                  <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> 考后自动评分</p>
                  <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> 可查看错题解析</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setPhase("list")}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  返回
                </button>
                <button
                  onClick={handleConfirmStart}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  开始答题
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "taking" && currentQuestion && selectedPaper && (
          <motion.div
            key="taking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="sticky top-0 z-30 rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={handleRestart} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> 退出
                  </button>
                  <span className="font-medium text-gray-900">{selectedPaper.name}</span>
                </div>
                <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-semibold ${timeLeft < 300 ? "bg-red-100 text-red-700 animate-pulse" : "bg-gray-100 text-gray-900"}`}>
                  <Timer className="h-4 w-4" />
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-xs text-gray-500">{answeredCount}/{totalQuestions}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      第 {currentQIndex + 1} 题
                    </span>
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {currentQuestion.question.type === "single" ? "单选题" : "判断题"}
                    </span>
                  </div>
                  <p className="mb-6 text-lg text-gray-900">{currentQuestion.question.content}</p>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isSelected = answers[currentQuestion.question.id] === option.label
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSelectAnswer(currentQuestion.question.id, option.label)}
                          className={`w-full flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                            isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 text-gray-600"
                          }`}>
                            {option.label}
                          </div>
                          <span className="text-gray-900">{option.content}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-28 rounded-xl border bg-white p-4 shadow-sm">
                  <h3 className="mb-3 font-medium text-gray-900">答题卡</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {examQuestions.map((eq, idx) => {
                      const isAnswered = !!answers[eq.question.id]
                      const isCurrent = idx === currentQIndex
                      return (
                        <button
                          key={eq.question.id}
                          onClick={() => setCurrentQIndex(idx)}
                          className={`h-9 rounded-md text-xs font-medium transition-all ${
                            isCurrent
                              ? "bg-blue-600 text-white"
                              : isAnswered
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    交卷
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
                disabled={currentQIndex === 0}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> 上一题
              </button>
              <button
                onClick={() => setCurrentQIndex(Math.min(examQuestions.length - 1, currentQIndex + 1))}
                disabled={currentQIndex === examQuestions.length - 1}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一题 <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {phase === "results" && selectedPaper && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: smoothEase }}
            className="space-y-6"
          >
            <div className="rounded-xl border bg-white p-8 shadow-sm text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">考试结束</h2>
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-50 px-6 py-3">
                <span className="text-5xl font-bold text-gray-900">{score}</span>
                <span className="text-gray-500">/ {selectedPaper.totalScore} 分</span>
              </div>
              <div className="mt-6 grid grid-cols-4 gap-4 max-w-lg mx-auto">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-2xl font-bold text-green-600">
                    {examQuestions.filter(eq => {
                      const ua = answers[eq.question.id]
                      const co = eq.options.find(o => o.isCorrect)
                      return ua && ua === co?.label
                    }).length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">正确</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-2xl font-bold text-red-600">
                    {examQuestions.filter(eq => {
                      const ua = answers[eq.question.id]
                      const co = eq.options.find(o => o.isCorrect)
                      return ua && ua !== co?.label
                    }).length}
                  </p>
                  <p className="text-xs text-red-600 mt-1">错误</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3">
                  <p className="text-2xl font-bold text-yellow-600">
                    {examQuestions.filter(eq => !answers[eq.question.id]).length}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">未答</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-2xl font-bold text-gray-900">{examQuestions.length}</p>
                  <p className="text-xs text-gray-500 mt-1">总题数</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">答题详情</h3>
              {examQuestions.map((eq, idx) => {
                const userAnswer = answers[eq.question.id]
                const correctOption = eq.options.find(o => o.isCorrect)
                const isCorrect = userAnswer === correctOption?.label
                return (
                  <motion.div
                    key={eq.question.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`rounded-xl border p-5 shadow-sm ${isCorrect ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center ${isCorrect ? "bg-green-100" : "bg-red-100"}`}>
                        {isCorrect ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">第 {idx + 1} 题：{eq.question.content}</p>
                        <div className="mt-2 text-sm space-y-1">
                          <p>你的答案：<span className={`font-medium ${isCorrect ? "text-green-700" : "text-red-700"}`}>{userAnswer || "未作答"}</span></p>
                          {!isCorrect && <p>正确答案：<span className="font-medium text-green-700">{correctOption?.label}</span></p>}
                        </div>
                        {eq.question.explanation && (
                          <div className="mt-3 rounded-lg bg-white/80 p-3 text-sm text-gray-600">
                            <span className="font-medium">解析：</span>{eq.question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" /> 返回试卷列表
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

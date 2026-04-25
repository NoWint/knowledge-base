"use client"

import { useEffect, useState, useRef } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, Clock, CheckCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Sparkles } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import { calculateSM2, mapAnswerToQuality } from "@/lib/algorithms/sm2"
import { useReviewNotifications } from "@/hooks/use-review-notifications"
import type { Question, QuestionOption, ReviewSchedule } from "@/types"

interface ReviewQuestion extends Question {
  options: QuestionOption[]
  schedule: ReviewSchedule
}

export default function ReviewPage() {
  const { currentUser } = useUserStore()
  useReviewNotifications()
  const [dueReviews, setDueReviews] = useState<ReviewQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    loadDueReviews()
  }, [currentUser])

  useEffect(() => {
    if (isCorrect === null && dueReviews.length > 0) {
      startTimeRef.current = Date.now()
    }
  }, [currentIndex, dueReviews])

  async function loadDueReviews() {
    if (!currentUser) return
    setLoading(true)
    try {
      const now = new Date()
      const schedules = await db.reviewSchedules
        .where('userId').equals(currentUser.id)
        .filter(s => s.nextReviewDate <= now)
        .toArray()

      const questions = await db.questions.toArray()
      const options = await db.questionOptions.toArray()
      const questionMap = new Map(questions.map(q => [q.id, q]))

      const dueQuestions: ReviewQuestion[] = []
      for (const schedule of schedules) {
        const q = questionMap.get(schedule.questionId)
        if (!q) continue
        dueQuestions.push({
          ...q,
          options: options.filter(o => o.questionId === q.id),
          schedule,
        })
      }

      setDueReviews(dueQuestions)
    } catch (err) {
      console.error('Failed to load due reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!selectedAnswer || dueReviews.length === 0) return

    const currentQ = dueReviews[currentIndex]
    const correctOption = currentQ.options.find(o => o.isCorrect)
    const correct = selectedAnswer === correctOption?.label
    const spent = Math.round((Date.now() - startTimeRef.current) / 1000)
    setTimeSpent(spent)
    setIsCorrect(correct)

    if (correct) setScore(s => s + 1)

    await db.userAnswers.add({
      id: crypto.randomUUID(),
      userId: currentUser?.id || "",
      questionId: currentQ.id,
      answer: selectedAnswer,
      isCorrect: correct,
      answeredAt: new Date(),
      timeSpent: spent,
    })

    if (isUpdating) return
    setIsUpdating(true)

    try {
      const quality = mapAnswerToQuality(correct, spent, currentQ.estimatedTime)
      const result = calculateSM2({
        quality,
        easeFactor: currentQ.schedule.easeFactor,
        interval: currentQ.schedule.interval,
        repetitions: currentQ.schedule.repetitions,
      })

      await db.reviewSchedules.update(currentQ.schedule.id, {
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        nextReviewDate: result.nextReviewDate,
        lastReviewDate: new Date(),
        updatedAt: new Date(),
      })
    } catch (err) {
      console.error('Failed to update review schedule:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const nextQuestion = () => {
    if (currentIndex + 1 >= dueReviews.length) {
      setShowResult(true)
    } else {
      setCurrentIndex(i => i + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setTimeSpent(0)
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setTimeSpent(0)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Clock className="h-12 w-12 text-gray-400" />
          </motion.div>
        </div>
      </AppLayout>
    )
  }

  if (dueReviews.length === 0) {
    return (
      <AppLayout>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: smoothEase }}
          className="max-w-lg mx-auto text-center py-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">太棒了！</h2>
          <p className="text-gray-600">目前没有需要复习的内容，保持这个状态！</p>
        </motion.div>
      </AppLayout>
    )
  }

  if (showResult) {
    const accuracy = Math.round((score / dueReviews.length) * 100)
    return (
      <AppLayout>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: smoothEase }}
          className="max-w-lg mx-auto"
        >
          <div className="rounded-xl bg-white p-6 shadow-lg text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
              className="text-5xl mb-3"
            >
              {accuracy >= 80 ? "🎉" : accuracy >= 60 ? "👍" : "💪"}
            </motion.div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">复习完成！</h2>
            <p className="text-gray-600 text-sm mb-5">
              {accuracy >= 80 ? "太棒了！继续保持！" : accuracy >= 60 ? "不错，再接再厉！" : "加油，多复习就会进步！"}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "总题数", value: dueReviews.length, bgClass: "bg-blue-50", textClass: "text-blue-600", subClass: "text-blue-600/70" },
                { label: "正确", value: score, bgClass: "bg-green-50", textClass: "text-green-600", subClass: "text-green-600/70" },
                { label: "正确率", value: `${accuracy}%`, bgClass: "bg-purple-50", textClass: "text-purple-600", subClass: "text-purple-600/70" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-lg ${stat.bgClass} p-3`}>
                  <div className={`text-xl font-bold ${stat.textClass}`}>{stat.value}</div>
                  <div className={`text-xs ${stat.subClass}`}>{stat.label}</div>
                </div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowResult(false)
                setCurrentIndex(0)
                setScore(0)
                setSelectedAnswer(null)
                setIsCorrect(null)
                setTimeSpent(0)
                loadDueReviews()
              }}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white text-sm font-medium hover:from-orange-600 hover:to-amber-700 transition"
            >
              再次复习
            </motion.button>
          </div>
        </motion.div>
      </AppLayout>
    )
  }

  const currentQ = dueReviews[currentIndex]
  const progress = ((currentIndex) / dueReviews.length) * 100

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: smoothEase }}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">复习计划</h1>
            <p className="text-sm text-gray-500">今日待复习 {dueReviews.length} 题</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>进度</span>
            <span>{currentIndex + 1}/{dueReviews.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: smoothEase }}
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between"
        >
          <span className={`text-sm font-medium ${isCorrect === null ? "text-orange-600" : isCorrect ? "text-green-600" : "text-red-600"}`}>
            {isCorrect === null ? "答题中" : isCorrect ? "回答正确！" : "回答错误"}
          </span>
          <span className="text-sm text-gray-500">
            用时 {timeSpent}s | 得分: {score}
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: smoothEase }}
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h3 className="text-base font-medium text-gray-900 mb-5">{currentQ.content}</h3>
            <div className="space-y-2">
              {currentQ.options.map((option, index) => {
                const isSelected = selectedAnswer === option.label
                const showCorrect = isCorrect && option.isCorrect
                const showWrong = isSelected && !isCorrect && isCorrect !== null

                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2, ease: smoothEase }}
                    onClick={() => !isCorrect && setSelectedAnswer(option.label)}
                    disabled={!!isCorrect}
                    whileHover={!isCorrect ? { backgroundColor: "#f9fafb" } : {}}
                    whileTap={!isCorrect ? { scale: 0.99 } : {}}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      showCorrect
                        ? "border-green-500 bg-green-50"
                        : showWrong
                        ? "border-red-500 bg-red-50"
                        : isSelected
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all ${
                        showCorrect
                          ? "bg-green-500 text-white"
                          : showWrong
                          ? "bg-red-500 text-white"
                          : isSelected
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {showCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : showWrong ? <XCircle className="h-3.5 w-3.5" /> : option.label}
                    </span>
                    <span className="text-sm">{option.content}</span>
                    {option.isCorrect && isCorrect !== null && (
                      <span className="ml-auto text-xs text-green-600 font-medium">正确答案</span>
                    )}
                  </motion.button>
                )
              })}
            </div>
            <AnimatePresence>
              {isCorrect !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2, ease: smoothEase }}
                  className="mt-5 rounded-lg bg-gray-50 p-3 border border-gray-100"
                >
                  <div className="flex items-start gap-2.5">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium text-sm ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                        {isCorrect ? "回答正确！" : "回答错误"}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">解析：{currentQ.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-5 flex justify-between gap-2">
              <motion.button
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                whileHover={currentIndex !== 0 ? { x: -2 } : {}}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                上一题
              </motion.button>
              {!isCorrect ? (
                <motion.button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer || isUpdating}
                  whileHover={selectedAnswer ? { scale: 1.02 } : {}}
                  whileTap={selectedAnswer ? { scale: 0.98 } : {}}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white text-sm font-medium hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isUpdating ? "更新中..." : "提交答案"}
                </motion.button>
              ) : (
                <motion.button
                  onClick={nextQuestion}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white text-sm font-medium hover:from-orange-600 hover:to-amber-700 transition"
                >
                  {currentIndex + 1 >= dueReviews.length ? "查看结果" : "下一题"}
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {isCorrect !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex items-center justify-center gap-2 text-xs text-gray-500"
            >
              <Sparkles className="h-3 w-3" />
              <span>SM-2 算法已更新复习计划</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
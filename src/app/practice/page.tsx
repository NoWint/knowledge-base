"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useUserStore } from "@/store/user-store"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Clock, Target, RotateCcw, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react"
import type { Question, QuestionOption } from "@/types"
import { calculateSM2, mapAnswerToQuality } from "@/lib/algorithms/sm2"
import { loadAllQuestions, type LoadedQuestion } from "@/lib/data-access/question-loader"
import { db } from "@/lib/db/database"

const smoothEase = [0.25, 0.1, 0.25, 1]

type PracticeMode = "free" | "special" | "exam" | "wrong"

export default function PracticePage() {
  const { currentUser } = useUserStore()
  const [mode, setMode] = useState<PracticeMode | null>(null)
  const [questions, setQuestions] = useState<LoadedQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [allQuestions, setAllQuestions] = useState<LoadedQuestion[]>([])

  useEffect(() => {
    async function load() {
      const qs = await loadAllQuestions()
      setAllQuestions(qs)
    }
    load()
  }, [])

  const startPractice = async (practiceMode: PracticeMode) => {
    setMode(practiceMode)
    
    let selectedQuestions = [...allQuestions]
    if (practiceMode === 'exam') {
      selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5).slice(0, 20)
    } else {
      selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5).slice(0, 10)
    }

    setQuestions(selectedQuestions)
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setScore(0)
    setShowResult(false)
    setStartTime(Date.now())
  }

  const checkAnswer = async () => {
    if (!currentUser || !selectedAnswer) return
    const currentQ = questions[currentIndex]
    if (!currentQ) return
    const correctOption = currentQ.options.find(o => o.isCorrect)
    const correct = selectedAnswer === correctOption?.label
    setIsCorrect(correct)

    if (correct) setScore(s => s + 1)

    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    const userId = currentUser.id

    await db.transaction('rw', [db.userAnswers, db.wrongQuestions, db.reviewSchedules], async () => {
      await db.userAnswers.add({
        id: crypto.randomUUID(),
        userId,
        questionId: currentQ.id,
        answer: selectedAnswer,
        isCorrect: correct,
        answeredAt: new Date(),
        timeSpent,
      })

      if (!correct) {
        const existing = await db.wrongQuestions.where({ userId, questionId: currentQ.id }).first()
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
            questionId: currentQ.id,
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

      const existingSchedule = await db.reviewSchedules
        .where({ userId, questionId: currentQ.id })
        .first()

      const quality = mapAnswerToQuality(correct, timeSpent, 60)
      const sm2Result = calculateSM2({
        quality,
        easeFactor: existingSchedule?.easeFactor || 2.5,
        interval: existingSchedule?.interval || 0,
        repetitions: existingSchedule?.repetitions || 0,
      })

      if (existingSchedule) {
        await db.reviewSchedules.update(existingSchedule.id, {
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReviewDate: sm2Result.nextReviewDate,
          lastReviewDate: new Date(),
          updatedAt: new Date(),
        })
      } else {
        await db.reviewSchedules.add({
          id: crypto.randomUUID(),
          userId,
          questionId: currentQ.id,
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReviewDate: sm2Result.nextReviewDate,
          lastReviewDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    })
  }

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setShowResult(true)
    } else {
      setCurrentIndex(i => i + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setStartTime(Date.now())
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
    }
  }

  if (showResult && questions.length > 0) {
    const accuracy = Math.round((score / questions.length) * 100)
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
            <h2 className="text-xl font-bold text-gray-900 mb-1">练习完成！</h2>
            <p className="text-gray-600 text-sm mb-5">
              {accuracy >= 80 ? "太棒了！继续保持！" : accuracy >= 60 ? "不错，再接再厉！" : "加油，多练习就会进步！"}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "总题数", value: questions.length, bgClass: "bg-blue-50", textClass: "text-blue-600", subClass: "text-blue-600/70" },
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
              onClick={() => { setMode(null); setShowResult(false) }}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition"
            >
              返回练习列表
            </motion.button>
          </div>
        </motion.div>
      </AppLayout>
    )
  }

  if (mode && questions.length > 0 && currentIndex < questions.length) {
    const currentQ = questions[currentIndex]
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-between"
          >
            <span className="text-sm text-gray-500">第 {currentIndex + 1}/{questions.length} 题</span>
            <span className={`text-sm font-medium ${isCorrect === null ? "text-blue-600" : isCorrect ? "text-green-600" : "text-red-600"}`}>
              得分: {score}
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
                          ? "border-blue-500 bg-blue-50"
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
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {showCorrect ? <CheckCircle className="h-3.5 w-3.5" /> : showWrong ? <XCircle className="h-3.5 w-3.5" /> : option.label}
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
                {isCorrect === null ? (
                  <motion.button
                    onClick={checkAnswer}
                    disabled={!selectedAnswer}
                    whileHover={selectedAnswer ? { scale: 1.02 } : {}}
                    whileTap={selectedAnswer ? { scale: 0.98 } : {}}
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    提交答案
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={nextQuestion}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition"
                  >
                    {currentIndex + 1 >= questions.length ? "查看结果" : "下一题"}
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: smoothEase }}
        >
          <h1 className="text-xl font-bold text-gray-900">练习题库</h1>
          <p className="text-gray-600 text-sm mt-0.5">选择练习模式，开始刷题</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { id: "free" as PracticeMode, icon: Play, title: "自由练习", desc: "随机出题，无时间限制", gradient: "from-blue-500 via-blue-600 to-cyan-500", shadow: "hover:shadow-blue-500/20" },
            { id: "special" as PracticeMode, icon: Target, title: "专项训练", desc: "针对薄弱知识点练习", gradient: "from-emerald-500 via-green-600 to-teal-500", shadow: "hover:shadow-emerald-500/20" },
            { id: "exam" as PracticeMode, icon: Clock, title: "模拟考试", desc: "限时模拟中考环境", gradient: "from-violet-500 via-purple-600 to-fuchsia-500", shadow: "hover:shadow-purple-500/20" },
            { id: "wrong" as PracticeMode, icon: RotateCcw, title: "错题重做", desc: "回顾做错的题目", gradient: "from-rose-500 via-red-600 to-orange-500", shadow: "hover:shadow-red-500/20" },
          ].map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3, ease: smoothEase }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startPractice(item.id)}
              className="group relative cursor-pointer flex items-center gap-3 p-4 rounded-xl border border-gray-200/50 bg-white shadow-sm transition-all duration-300 hover:shadow-lg text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-lg`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="relative flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 0, x: 0 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </motion.div>
            </motion.button>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

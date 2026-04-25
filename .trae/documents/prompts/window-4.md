# 对话 4: 错题本 2.0 完整实现

**提示词**:

```
请执行以下任务：

## 任务 B.3: 重写错题本页面为错题本 2.0

修改文件: `src/app/wrong/page.tsx`

参考现有 `src/app/practice/page.tsx` 的风格，重写错题本页面，实现：

1. **错题列表**：显示用户所有错题，按学科/知识点分组
2. **错误原因标注**：每道错题可标注原因（粗心/概念不清/遗忘）
3. **状态流转**：wrong → correcting → mastered
4. **错题重做**：点击可重新练习该题
5. **薄弱点高亮**：连续错误 2 次以上的知识点高亮显示

```tsx
"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, CheckCircle, RotateCcw, Filter, ChevronDown } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import type { WrongQuestion, Question, QuestionOption, KnowledgePoint, WrongReason } from "@/types"

const WRONG_REASON_OPTIONS: { value: WrongReason; label: string; emoji: string }[] = [
  { value: 'careless', label: '粗心', emoji: '😑' },
  { value: 'misunderstanding', label: '概念不清', emoji: '🤔' },
  { value: 'forgot', label: '遗忘', emoji: '😵' },
]

export default function WrongPage() {
  const { currentUser } = useUserStore()
  const [wrongQuestions, setWrongQuestions] = useState<(WrongQuestion & { question: Question; kp: KnowledgePoint })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'wrong' | 'correcting' | 'mastered'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadWrongQuestions()
  }, [currentUser])

  async function loadWrongQuestions() {
    if (!currentUser) return
    setLoading(true)
    try {
      const wqs = await db.wrongQuestions.where('userId').equals(currentUser.id).toArray()
      const questions = await db.questions.toArray()
      const kps = await db.knowledgePoints.toArray()
      const chapters = await db.chapters.toArray()

      const questionMap = new Map(questions.map(q => [q.id, q]))
      const kpMap = new Map(kps.map(kp => [kp.id, kp]))
      const chapterMap = new Map(chapters.map(c => [c.id, c]))

      const enriched = wqs.map(wq => {
        const question = questionMap.get(wq.questionId)
        const kp = question ? kpMap.get(question.knowledgePointId) : null
        return { ...wq, question: question!, kp: kp! }
      }).filter(wq => wq.question)

      setWrongQuestions(enriched)
    } catch (err) {
      console.error('Failed to load wrong questions:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: WrongQuestion['status']) {
    await db.wrongQuestions.update(id, { status })
    if (status === 'mastered') {
      await db.wrongQuestions.update(id, { masteredAt: new Date() })
    }
    loadWrongQuestions()
  }

  async function updateWrongReason(id: string, reason: WrongReason) {
    await db.wrongQuestions.update(id, { wrongReason: reason })
    loadWrongQuestions()
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
          {(['all', 'wrong', 'correcting', 'mastered'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? '全部' : status === 'wrong' ? '待订正' : status === 'correcting' ? '订正中' : '已掌握'} ({statusCounts[status]})
            </button>
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
                              onClick={() => {/* TODO: Navigate to practice with this question */}}
                              className="flex-1 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-1.5"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> 重做
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
      </motion.div>
    </AppLayout>
  )
}
```

完成后，确保 TypeScript 编译无错误。
```

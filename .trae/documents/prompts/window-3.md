# 对话 3: 复习计划页面 + 错题本 2.0

**提示词**:

```
请执行以下任务：

## 任务 B.1: 创建复习提醒 Service Worker 工具

新建文件: `src/lib/notifications/review-notification.ts`

```typescript
export interface ReviewReminder {
  questionId: string
  nextReviewDate: Date
  knowledgePointName: string
}

export async function scheduleReviewReminder(reminder: ReviewReminder): Promise<void> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('Notification permission denied')
    return
  }

  const now = new Date()
  const delay = reminder.nextReviewDate.getTime() - now.getTime()

  if (delay <= 0) {
    return
  }

  setTimeout(() => {
    new Notification('📚 该复习了！', {
      body: `知识点 "${reminder.knowledgePointName}" 需要复习`,
      icon: '/icon.png',
      tag: `review-${reminder.questionId}`,
    })
  }, delay)
}

export async function checkDueReviews(userId: string): Promise<ReviewReminder[]> {
  const { db } = await import('@/lib/db/database')
  const { default: dayjs } = await import('dayjs')

  const now = new Date()
  const reviews = await db.reviewSchedules
    .where('userId').equals(userId)
    .filter(r => r.nextReviewDate <= now)
    .toArray()

  const questions = await db.questions.toArray()
  const kps = await db.knowledgePoints.toArray()
  const questionMap = new Map(questions.map(q => [q.id, q]))
  const kpMap = new Map(kps.map(kp => [kp.id, kp]))

  const reminders: ReviewReminder[] = []
  for (const review of reviews) {
    const question = questionMap.get(review.questionId)
    const kp = question ? kpMap.get(question.knowledgePointId) : null
    reminders.push({
      questionId: review.questionId,
      nextReviewDate: review.nextReviewDate,
      knowledgePointName: kp?.name || '未知知识点',
    })
  }

  return reminders
}
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务 B.2: 创建复习计划页面

新建文件: `src/app/review/page.tsx`

参考 `src/app/practice/page.tsx` 的风格，创建一个复习计划页面：

```tsx
"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { motion } from "framer-motion"
import { Review, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import type { Question, QuestionOption } from "@/types"

export default function ReviewPage() {
  const { currentUser } = useUserStore()
  const [dueReviews, setDueReviews] = useState<(Question & { options: QuestionOption[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    loadDueReviews()
  }, [currentUser])

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

      const dueQuestions = schedules
        .map(s => {
          const q = questionMap.get(s.questionId)
          if (!q) return null
          return {
            ...q,
            options: options.filter(o => o.questionId === q.id),
          }
        })
        .filter((q): q is Question & { options: QuestionOption[] } => q !== null)

      setDueReviews(dueQuestions)
    } catch (err) {
      console.error('Failed to load due reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Clock className="h-12 w-12 animate-pulse text-gray-400" />
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
          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">太棒了！</h2>
          <p className="text-gray-600">目前没有需要复习的内容，保持这个状态！</p>
        </motion.div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
            <Review className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">复习计划</h1>
            <p className="text-sm text-gray-500">今日待复习 {dueReviews.length} 题</p>
          </div>
        </div>

        <div className="text-sm text-gray-500 text-center">
          第 {currentIndex + 1} / {dueReviews.length} 题
        </div>

        {/* 答题 UI 参考 practice/page.tsx 实现 */}
        {/* 这里简化展示，实际需要复制 practice/page.tsx 的答题逻辑 */}

        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            上一题
          </button>
          <button
            onClick={() => {
              if (currentIndex < dueReviews.length - 1) {
                setCurrentIndex(currentIndex + 1)
                setSelectedAnswer(null)
                setShowResult(false)
              }
            }}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm"
          >
            {currentIndex < dueReviews.length - 1 ? '下一题' : '完成'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
```

完成后，确保 TypeScript 编译无错误。
```

# 6 对话并行执行 - 完整提示词

## 如何使用

复制每个对话窗口对应的提示词，粘贴到独立的 Trae IDE 对话中即可开始执行。

---

## 对话 1: 数据库类型 + 迁移工具

**文件**: `.trae/documents/prompts/window-1.md`

<details>
<summary>点击展开提示词</summary>

```
请执行以下任务：

## 任务 A.1: 扩展数据库类型定义

修改文件: `src/types/database.ts`

在现有文件基础上，添加以下新类型和扩展现有接口：

### 1. 新增类型定义（在文件末尾添加）

```typescript
export type WrongReason = 'careless' | 'misunderstanding' | 'forgot' | null
export type GoalType = 'daily_questions' | 'weekly_streak' | 'mastery_level'
export type GoalStatus = 'active' | 'completed' | 'expired'
export type SessionType = 'practice' | 'review' | 'cards' | 'exam'

export interface ReviewSchedule {
  id: string
  userId: string
  questionId: string
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
  lastReviewDate: Date | null
}

export interface LearningGoal {
  id: string
  userId: string
  type: GoalType
  targetValue: number
  currentValue: number
  startDate: Date
  endDate: Date
  status: GoalStatus
}

export interface StudySession {
  id: string
  userId: string
  startTime: Date
  endTime: Date | null
  type: SessionType
  contentSummary: string
}

export interface FlashCard {
  id: string
  knowledgePointId: string
  front: string
  back: string
  createdAt: Date
  updatedAt: Date
}

export interface UserFlashCardReview {
  id: string
  userId: string
  flashCardId: string
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
  lastReviewDate: Date | null
}

export interface DailyStats {
  id: string
  userId: string
  date: string
  totalQuestions: number
  correctCount: number
  studyMinutes: number
  topicsCovered: string[]
}
```

### 2. 扩展 WrongQuestion 接口（找到现有接口添加新字段）

在 WrongQuestion 接口中添加：
```typescript
wrongReason: WrongReason
lastWrongReason: string
```

### 3. 扩展 Question 接口（找到现有接口添加新字段）

在 Question 接口中添加：
```typescript
tags: string[]
estimatedTime: number
fromAI: boolean
```

### 4. 扩展 KnowledgePoint 接口（找到现有接口添加新字段）

在 KnowledgePoint 接口中添加：
```typescript
masteryLevel: number
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务 A.2: 创建数据库迁移工具

新建文件: `src/lib/db/migrations.ts`

```typescript
import { db } from './database'

const CURRENT_VERSION = 2

export async function runMigrations() {
  const storedVersion = localStorage.getItem('db_version') || '1'

  if (parseInt(storedVersion) < 2) {
    await migrateToV2()
    localStorage.setItem('db_version', '2')
  }
}

async function migrateToV2() {
  await db.version(2).stores({
    users: 'id, name, createdAt',
    userProfiles: 'id, userId, currentGrade',
    userSubjects: 'id, userId, subjectId',
    subjects: 'id, name, gradeLevel, orderIndex',
    chapters: 'id, subjectId, parentId, orderIndex',
    knowledgePoints: 'id, chapterId, name, difficulty',
    articles: 'id, knowledgePointId, type, createdAt',
    questions: 'id, knowledgePointId, type, difficulty, *tags',
    questionOptions: 'id, questionId, label, isCorrect',
    userAnswers: 'id, userId, questionId, answeredAt, isCorrect',
    wrongQuestions: 'id, userId, questionId, status, lastWrongAt',
    testPapers: 'id, name, subjectId',
    testPaperQuestions: 'id, testPaperId, questionId, orderIndex',
    knowledgeRelations: 'id, sourceKpId, targetKpId, relationType',
    userFiles: 'id, userId, folderId, fileName, fileType, createdAt',
    fileFolders: 'id, userId, parentId, folderName',
    fileTags: 'id, userId, tagName',
    fileKnowledgeLinks: 'id, fileId, knowledgePointId',
    reviewSchedules: 'id, userId, questionId, nextReviewDate',
    learningGoals: 'id, userId, type, status',
    studySessions: 'id, userId, startTime',
    flashCards: 'id, knowledgePointId, createdAt',
    userFlashCardReviews: 'id, userId, flashCardId, nextReviewDate',
    dailyStats: 'id, userId, date',
  })
}
```

完成后，确保 TypeScript 编译无错误。
```

</details>

---

## 对话 2: SM-2 算法 + 薄弱点检测

**文件**: `.trae/documents/prompts/window-2.md`

<details>
<summary>点击展开提示词</summary>

```
请执行以下任务：

## 任务 A.3: 创建 SM-2 间隔重复算法

新建文件: `src/lib/algorithms/sm2.ts`

```typescript
export interface SM2Input {
  quality: number
  easeFactor: number
  interval: number
  repetitions: number
}

export interface SM2Output {
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
}

export const QUALITY_LABELS: Record<number, string> = {
  0: '完全遗忘',
  1: '错误，想起很久',
  2: '错误，想起快',
  3: '正确，困难',
  4: '正确，稍难',
  5: '正确，简单',
}

export function calculateSM2(input: SM2Input): SM2Output {
  let { quality, easeFactor, interval, repetitions } = input

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  if (easeFactor < 1.3) easeFactor = 1.3

  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
  }
}

export function mapAnswerToQuality(
  isCorrect: boolean,
  timeSpent: number,
  estimatedTime: number
): number {
  if (!isCorrect) {
    return timeSpent < estimatedTime ? 1 : 0
  }
  const ratio = timeSpent / estimatedTime
  if (ratio > 2) return 3
  if (ratio > 1) return 4
  return 5
}

export function getNextReviewDate(interval: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + interval)
  return date
}
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务 A.4: 创建薄弱点检测算法

新建文件: `src/lib/algorithms/weakness-detector.ts`

```typescript
import { db } from '@/lib/db/database'

export interface WeakPoint {
  knowledgePointId: string
  wrongRate: number
  totalAttempts: number
  consecutiveWrong: number
  lastWrongAt: Date
  severity: 'high' | 'medium' | 'low'
}

export interface MasteryLevel {
  knowledgePointId: string
  mastery: number
  totalQuestions: number
  correctRate: number
  lastStudiedAt: Date | null
}

export async function detectWeakPoints(
  userId: string,
  minAttempts = 3
): Promise<WeakPoint[]> {
  const answers = await db.userAnswers.where('userId').equals(userId).toArray()
  const questions = await db.questions.toArray()
  const questionMap = new Map(questions.map(q => [q.id, q]))

  const kpStats = new Map<string, { total: number; wrong: number; lastWrong: Date | null; consecutive: number }>()

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId)
    if (!question) continue

    const kpId = question.knowledgePointId
    const stats = kpStats.get(kpId) || { total: 0, wrong: 0, lastWrong: null, consecutive: 0 }
    stats.total += 1

    if (!answer.isCorrect) {
      stats.wrong += 1
      stats.consecutive += 1
      if (!stats.lastWrong || answer.answeredAt > stats.lastWrong) {
        stats.lastWrong = answer.answeredAt
      }
    } else {
      stats.consecutive = 0
    }

    kpStats.set(kpId, stats)
  }

  const weakPoints: WeakPoint[] = []

  for (const [kpId, stats] of kpStats) {
    if (stats.total < minAttempts) continue

    const wrongRate = stats.wrong / stats.total

    if (wrongRate > 0.4 || stats.consecutive >= 2) {
      weakPoints.push({
        knowledgePointId: kpId,
        wrongRate,
        totalAttempts: stats.total,
        consecutiveWrong: stats.consecutive,
        lastWrongAt: stats.lastWrong || new Date(),
        severity: wrongRate > 0.7 ? 'high' : wrongRate > 0.5 ? 'medium' : 'low',
      })
    }
  }

  return weakPoints.sort((a, b) => b.wrongRate - a.wrongRate)
}

export async function calculateMasteryLevel(
  userId: string,
  knowledgePointId: string
): Promise<MasteryLevel> {
  const questions = await db.questions.where('knowledgePointId').equals(knowledgePointId).toArray()
  const questionIds = questions.map(q => q.id)

  const answers = await db.userAnswers
    .where('userId').equals(userId)
    .filter(a => questionIds.includes(a.questionId))
    .toArray()

  if (answers.length === 0) {
    return {
      knowledgePointId,
      mastery: 0,
      totalQuestions: questions.length,
      correctRate: 0,
      lastStudiedAt: null,
    }
  }

  const correct = answers.filter(a => a.isCorrect).length
  const correctRate = correct / answers.length
  const mastery = Math.round(correctRate * 100)

  const lastStudied = answers.reduce(
    (latest, a) => (a.answeredAt > latest ? a.answeredAt : latest),
    answers[0].answeredAt
  )

  return {
    knowledgePointId,
    mastery,
    totalQuestions: questions.length,
    correctRate,
    lastStudiedAt: lastStudied,
  }
}
```

完成后，确保 TypeScript 编译无错误。
```

</details>

---

## 对话 3: 复习提醒 + 复习计划页面

**文件**: `.trae/documents/prompts/window-3.md`

<details>
<summary>点击展开提示词</summary>

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
import { Review, Clock, CheckCircle } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import type { Question, QuestionOption } from "@/types"

export default function ReviewPage() {
  const { currentUser } = useUserStore()
  const [dueReviews, setDueReviews] = useState<(Question & { options: QuestionOption[] })[]>([])
  const [loading, setLoading] = useState(true)

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
        {/* 答题 UI 参考 practice/page.tsx 实现 */}
        <p className="text-center text-gray-500">答题功能待实现，可参考 practice/page.tsx</p>
      </div>
    </AppLayout>
  )
}
```

完成后，确保 TypeScript 编译无错误。
```

</details>

---

## 对话 4: 错题本 2.0 完整实现

**文件**: `.trae/documents/prompts/window-4.md`

<details>
<summary>点击展开提示词</summary>

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
import { AlertCircle, CheckCircle, RotateCcw, ChevronDown } from "lucide-react"
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

      const questionMap = new Map(questions.map(q => [q.id, q]))
      const kpMap = new Map(kps.map(kp => [kp.id, kp]))

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

</details>

---

## 对话 5: 闪卡系统

**文件**: `.trae/documents/prompts/window-5.md`

<details>
<summary>点击展开提示词</summary>

```
请执行以下任务：

## 任务 C.1: 创建闪卡列表页面

新建文件: `src/app/cards/page.tsx`

参考 `src/app/practice/page.tsx` 的风格，创建闪卡管理页面：

```tsx
"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Cards, Trash2, BookOpen } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import Link from "next/link"
import type { FlashCard, KnowledgePoint } from "@/types"

export default function CardsPage() {
  const { currentUser } = useUserStore()
  const [cards, setCards] = useState<(FlashCard & { knowledgePoint?: KnowledgePoint })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCards()
  }, [currentUser])

  async function loadCards() {
    if (!currentUser) return
    setLoading(true)
    try {
      const allCards = await db.flashCards.toArray()
      const kps = await db.knowledgePoints.toArray()
      const kpMap = new Map(kps.map(kp => [kp.id, kp]))

      const enrichedCards = allCards.map(card => ({
        ...card,
        knowledgePoint: kpMap.get(card.knowledgePointId),
      }))

      setCards(enrichedCards)
    } catch (err) {
      console.error('Failed to load cards:', err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteCard(id: string) {
    await db.flashCards.delete(id)
    await db.userFlashCardReviews.where('flashCardId').equals(id).delete()
    loadCards()
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 text-white">
              <Cards className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">学习闪卡</h1>
              <p className="text-sm text-gray-500">共 {cards.length} 张卡片</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/cards/review"
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 flex items-center gap-1.5"
            >
              开始复习
            </Link>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-12">
            <Cards className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">还没有创建闪卡</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        Q: {card.front}
                      </div>
                      <div className="text-sm text-gray-500">
                        A: {card.back}
                      </div>
                      {card.knowledgePoint && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-purple-600">
                          <BookOpen className="h-3 w-3" />
                          {card.knowledgePoint.name}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteCard(card.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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

---

```
## 任务 C.2: 创建翻转闪卡组件

新建文件: `src/components/cards/flash-card.tsx`

```tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface FlashCardProps {
  front: string
  back: string
  onFlip?: (isCorrect: boolean) => void
}

export function FlashCard({ front, back, onFlip }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto">
      <motion.div
        className="relative w-full h-64 cursor-pointer"
        onClick={handleFlip}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: -180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 180, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-6 flex flex-col items-center justify-center text-white shadow-xl"
            >
              <div className="text-xs uppercase tracking-wider mb-2 opacity-75">问题</div>
              <div className="text-lg font-medium text-center">{front}</div>
              <div className="absolute bottom-4 text-xs opacity-50">点击翻转</div>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -180, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 flex flex-col items-center justify-center text-white shadow-xl"
            >
              <div className="text-xs uppercase tracking-wider mb-2 opacity-75">答案</div>
              <div className="text-lg font-medium text-center">{back}</div>
              <div className="absolute bottom-4 text-xs opacity-50">点击返回</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务 C.3: 创建闪卡复习页面

新建文件: `src/app/cards/review/page.tsx`

```tsx
"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { db } from "@/lib/db/database"
import { useUserStore } from "@/store/user-store"
import { motion } from "framer-motion"
import { FlashCard } from "@/components/cards/flash-card"
import { Progress } from "@/components/ui/progress"
import { RotateCcw, Home } from "lucide-react"
import Link from "next/link"
import { smoothEase } from "@/lib/animations"
import type { FlashCard as FlashCardType } from "@/types"

export default function CardsReviewPage() {
  const { currentUser } = useUserStore()
  const [cards, setCards] = useState<FlashCardType[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCards()
  }, [currentUser])

  async function loadCards() {
    if (!currentUser) return
    setLoading(true)
    try {
      const allCards = await db.flashCards.toArray()
      const shuffled = allCards.sort(() => Math.random() - 0.5)
      setCards(shuffled)
      setResults([])
      setCurrentIndex(0)
    } catch (err) {
      console.error('Failed to load cards:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFlip = (isCorrect: boolean) => {
    setResults(prev => [...prev, isCorrect])
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1)
      }
    }, 500)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center text-gray-500">加载中...</div>
        </div>
      </AppLayout>
    )
  }

  if (cards.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[400px]">
          <p className="text-gray-600 mb-4">还没有闪卡可复习</p>
          <Link href="/cards" className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm">
            去创建闪卡
          </Link>
        </div>
      </AppLayout>
    )
  }

  if (currentIndex >= cards.length) {
    const correct = results.filter(r => r).length
    const accuracy = Math.round((correct / results.length) * 100)

    return (
      <AppLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center py-12"
        >
          <div className="text-6xl mb-4">{accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">复习完成！</h2>
          <p className="text-gray-600 mb-6">
            正确率 {accuracy}% ({correct}/{results.length})
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setCurrentIndex(0); setResults([]); loadCards(); }}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4" /> 再学一遍
            </button>
            <Link
              href="/cards"
              className="px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-1.5"
            >
              <Home className="h-4 w-4" /> 返回
            </Link>
          </div>
        </motion.div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>进度 {currentIndex + 1}/{cards.length}</span>
            <span>{results.length > 0 ? Math.round((results.filter(r => r).length / results.length) * 100) : 0}% 正确</span>
          </div>
          <Progress value={((currentIndex + 1) / cards.length) * 100} className="h-2" />
        </div>

        <FlashCard
          key={cards[currentIndex].id}
          front={cards[currentIndex].front}
          back={cards[currentIndex].back}
          onFlip={handleFlip}
        />
      </div>
    </AppLayout>
  )
}
```

注意：如果 `src/components/ui/progress.tsx` 不存在，需要先创建它（参考 window-6 的 Progress 组件）。

完成后，确保 TypeScript 编译无错误。
```

</details>

---

## 对话 6: 图表组件 + 每日统计

**文件**: `.trae/documents/prompts/window-6.md`

<details>
<summary>点击展开提示词</summary>

```
请执行以下任务：

## 任务 D.1: 创建每日统计聚合逻辑

新建文件: `src/lib/analytics/daily-stats.ts`

```typescript
import { db } from '@/lib/db/database'

export async function calculateDailyStats(userId: string, date: string): Promise<{
  totalQuestions: number
  correctCount: number
  studyMinutes: number
  topicsCovered: string[]
}> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const answers = await db.userAnswers
    .where('userId').equals(userId)
    .filter(a => a.answeredAt >= startOfDay && a.answeredAt <= endOfDay)
    .toArray()

  const questions = await db.questions.toArray()
  const questionMap = new Map(questions.map(q => [q.id, q]))

  const topicsCoveredSet = new Set<string>()

  let correctCount = 0
  for (const answer of answers) {
    if (answer.isCorrect) correctCount++
    const question = questionMap.get(answer.questionId)
    if (question) {
      topicsCoveredSet.add(question.knowledgePointId)
    }
  }

  const sessions = await db.studySessions
    .where('userId').equals(userId)
    .filter(s => s.startTime >= startOfDay && s.startTime <= endOfDay && s.endTime)
    .toArray()

  let studyMinutes = 0
  for (const session of sessions) {
    if (session.endTime) {
      const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60
      studyMinutes += duration
    }
  }

  return {
    totalQuestions: answers.length,
    correctCount,
    studyMinutes: Math.round(studyMinutes),
    topicsCovered: Array.from(topicsCoveredSet),
  }
}

export async function getWeeklyStats(userId: string): Promise<{ date: string; count: number; correct: number }[]> {
  const stats: { date: string; count: number; correct: number }[] = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dailyStats = await calculateDailyStats(userId, dateStr)
    stats.push({
      date: dateStr,
      count: dailyStats.totalQuestions,
      correct: dailyStats.correctCount,
    })
  }

  return stats
}

export async function getHeatmapData(userId: string, days = 90): Promise<{ date: string; value: number }[]> {
  const data: { date: string; value: number }[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dailyStats = await calculateDailyStats(userId, dateStr)
    data.push({
      date: dateStr,
      value: dailyStats.totalQuestions,
    })
  }

  return data
}
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务 D.2: 创建学习热力图组件

新建文件: `src/components/charts/heatmap.tsx`

```tsx
"use client"

import { useMemo } from "react"

interface HeatmapProps {
  data: { date: string; value: number }[]
  maxValue?: number
}

export function Heatmap({ data, maxValue = 10 }: HeatmapProps) {
  const weeks = useMemo(() => {
    const result: { date: string; value: number }[][] = []
    let currentWeek: { date: string; value: number }[] = []

    for (let i = 0; i < data.length; i++) {
      currentWeek.push(data[i])
      if (currentWeek.length === 7 || i === data.length - 1) {
        result.push(currentWeek)
        currentWeek = []
      }
    }

    return result
  }, [data])

  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-100'
    const ratio = Math.min(value / maxValue, 1)
    if (ratio < 0.25) return 'bg-green-200'
    if (ratio < 0.5) return 'bg-green-300'
    if (ratio < 0.75) return 'bg-green-400'
    return 'bg-green-500'
  }

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-0.5">
            {week.map((day, dayIndex) => {
              const date = new Date(day.date)
              const monthLabel = dayIndex === 0 ? months[date.getMonth()] : ''
              return (
                <div key={dayIndex} className="relative group">
                  {monthLabel && (
                    <span className="absolute -top-4 left-0 text-xs text-gray-400">{monthLabel}</span>
                  )}
                  <div
                    className={`w-3 h-3 rounded-sm ${getColor(day.value)} transition-colors`}
                    title={`${day.date}: ${day.value} 题`}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {day.date}: {day.value} 题
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务 D.3: 创建能力雷达图组件

新建文件: `src/components/charts/radar-chart.tsx`

```tsx
"use client"

import { useMemo } from "react"

interface RadarChartProps {
  data: { subject: string; mastery: number }[]
  size?: number
}

export function RadarChart({ data, size = 200 }: RadarChartProps) {
  const center = size / 2
  const maxRadius = size / 2 - 20

  const points = useMemo(() => {
    const angleStep = (2 * Math.PI) / data.length
    return data.map((item, index) => {
      const angle = angleStep * index - Math.PI / 2
      const radius = (item.mastery / 100) * maxRadius
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
        mastery: item.mastery,
        subject: item.subject,
      }
    })
  }, [data, center, maxRadius])

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  const gridLevels = [25, 50, 75, 100]

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {gridLevels.map(level => {
          const gridRadius = (level / 100) * maxRadius
          const gridPoints = data.map((_, index) => {
            const angleStep = (2 * Math.PI) / data.length
            const angle = angleStep * index - Math.PI / 2
            return `${center + gridRadius * Math.cos(angle)},${center + gridRadius * Math.sin(angle)}`
          }).join(' ')

          return (
            <polygon
              key={level}
              points={gridPoints}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )
        })}

        {data.map((_, index) => {
          const angleStep = (2 * Math.PI) / data.length
          const angle = angleStep * index - Math.PI / 2
          const x2 = center + maxRadius * Math.cos(angle)
          const y2 = center + maxRadius * Math.sin(angle)
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )
        })}

        <polygon
          points={polygonPoints}
          fill="rgba(139, 92, 246, 0.3)"
          stroke="#8b5cf6"
          strokeWidth="2"
        />

        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#8b5cf6"
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 max-w-[200px]">
        {data.map((item, index) => (
          <div key={index} className="text-xs text-gray-600">
            <span className="font-medium">{item.subject}</span>
            <span className="text-gray-400 ml-1">{item.mastery}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

完成后，确保 TypeScript 编译无错误。
```

---

```
## 任务: 创建 Progress UI 组件

检查 `src/components/ui/progress.tsx` 是否存在，如果不存在，创建它：

```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-purple-500 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

然后安装依赖：
```bash
npm install @radix-ui/react-progress
```

完成后，确保 TypeScript 编译无错误。
```

</details>

---

## 快速开始

1. 打开 6 个独立的 Trae IDE 对话窗口
2. 在每个窗口中加载项目上下文（项目目录）
3. 复制对应提示词并执行
4. 完成每个对话后，返回主对话汇报进度

## 文件清单

| 对话 | 任务 | 新建/修改文件 |
|-----|------|-------------|
| 1 | A.1, A.2 | `src/types/database.ts`, `src/lib/db/migrations.ts` |
| 2 | A.3, A.4 | `src/lib/algorithms/sm2.ts`, `src/lib/algorithms/weakness-detector.ts` |
| 3 | B.1, B.2 | `src/lib/notifications/review-notification.ts`, `src/app/review/page.tsx` |
| 4 | B.3 | `src/app/wrong/page.tsx` |
| 5 | C.1, C.2, C.3 | `src/app/cards/page.tsx`, `src/components/cards/flash-card.tsx`, `src/app/cards/review/page.tsx` |
| 6 | D.1, D.2, D.3, Progress | `src/lib/analytics/daily-stats.ts`, `src/components/charts/heatmap.tsx`, `src/components/charts/radar-chart.tsx`, `src/components/ui/progress.tsx` |

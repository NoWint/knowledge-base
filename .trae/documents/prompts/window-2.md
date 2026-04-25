# 对话 2: SM-2 算法 + 薄弱点检测

**提示词**:

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

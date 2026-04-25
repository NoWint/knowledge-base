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
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
    .filter(s => s.startTime >= startOfDay && s.startTime <= endOfDay && s.endTime !== null)
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
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (days - 1))
  startDate.setHours(0, 0, 0, 0)

  const answers = await db.userAnswers
    .where('userId').equals(userId)
    .filter(a => a.answeredAt >= startDate)
    .toArray()

  const dateCounts = new Map<string, number>()
  for (const answer of answers) {
    const dateStr = new Date(answer.answeredAt).toISOString().split('T')[0]
    dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1)
  }

  const data: { date: string; value: number }[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    data.push({
      date: dateStr,
      value: dateCounts.get(dateStr) || 0,
    })
  }

  return data
}

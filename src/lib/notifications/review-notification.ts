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
    new Notification('📚 该复习了！', {
      body: `知识点 "${reminder.knowledgePointName}" 需要复习`,
      tag: `review-${reminder.questionId}`,
    })
    return
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_REVIEW',
      payload: {
        questionId: reminder.questionId,
        delay,
        knowledgePointName: reminder.knowledgePointName,
      },
    })
  } else {
    if (delay < 86400000) {
      setTimeout(() => {
        new Notification('📚 该复习了！', {
          body: `知识点 "${reminder.knowledgePointName}" 需要复习`,
          tag: `review-${reminder.questionId}`,
        })
      }, delay)
    }
  }
}

export async function checkDueReviews(userId: string): Promise<ReviewReminder[]> {
  const { db } = await import('@/lib/db/database')
  const { getAllKnowledgePoints } = await import('@/lib/data-access/subject-data')

  const now = new Date()
  const reviews = await db.reviewSchedules
    .where('userId').equals(userId)
    .filter(r => r.nextReviewDate <= now)
    .toArray()

  const questions = await db.questions.toArray()
  const kps = await getAllKnowledgePoints()
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

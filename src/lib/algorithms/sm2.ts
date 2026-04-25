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
  const { quality } = input
  let { easeFactor, interval, repetitions } = input

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
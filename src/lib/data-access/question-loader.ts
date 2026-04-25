import type { Question, QuestionOption } from '@/types'

interface RawQuestion {
  id: string
  type?: string
  difficulty?: string
  question: string
  options?: string[]
  answer: string
  explanation?: string
  knowledgePoints?: string[]
}

interface ExamCategory {
  category: string
  questions: RawQuestion[]
}

interface ExamFile {
  examCategories?: ExamCategory[]
  title?: string
}

export interface LoadedQuestion extends Question {
  options: QuestionOption[]
}

let questionCache: LoadedQuestion[] | null = null

function parseExamQuestions(subjectId: string, categories: ExamCategory[]): LoadedQuestion[] {
  const result: LoadedQuestion[] = []
  for (const cat of categories) {
    for (const q of cat.questions) {
      const options: QuestionOption[] = (q.options || []).map((opt, idx) => ({
        id: `${q.id}-opt-${idx}`,
        questionId: q.id,
        label: String.fromCharCode(65 + idx),
        content: opt,
        isCorrect: String.fromCharCode(65 + idx) === q.answer,
      }))

      result.push({
        id: q.id,
        knowledgePointId: "",
        type: q.type === "选择题" ? "single" : q.type === "填空题" ? "fill" : "single",
        difficulty: q.difficulty === "困难" ? 3 : q.difficulty === "中等" ? 2 : 1,
        content: q.question,
        answer: q.answer,
        explanation: q.explanation || "",
        source: `${subjectId} - ${cat.category}`,
        tags: q.knowledgePoints || [],
        estimatedTime: 60,
        fromAI: false,
        options,
      })
    }
  }
  return result
}

async function loadExamFile(subjectId: string, fileName: string): Promise<LoadedQuestion[]> {
  try {
    const response = await fetch(`/data/subjects/${subjectId}/exams/${fileName}.json`)
    if (!response.ok) return []
    const data: ExamFile = await response.json()
    if (!data.examCategories) return []
    return parseExamQuestions(subjectId, data.examCategories)
  } catch {
    return []
  }
}

export async function loadAllQuestions(): Promise<LoadedQuestion[]> {
  if (questionCache) return questionCache

  const allQuestions: LoadedQuestion[] = []

  const examFiles: { subjectId: string; fileName: string }[] = [
    { subjectId: "chemistry", fileName: "chemistry-exam" },
    { subjectId: "chemistry", fileName: "mock-paper" },
    { subjectId: "geography", fileName: "geography-exam" },
    { subjectId: "geography", fileName: "mock-paper" },
  ]

  const results = await Promise.all(
    examFiles.map(({ subjectId, fileName }) => loadExamFile(subjectId, fileName))
  )

  for (const questions of results) {
    allQuestions.push(...questions)
  }

  questionCache = allQuestions
  return allQuestions
}

export async function getQuestionsBySubject(subjectId: string): Promise<LoadedQuestion[]> {
  const all = await loadAllQuestions()
  return all.filter(q => q.source?.startsWith(subjectId))
}

export function clearQuestionCache(): void {
  questionCache = null
}

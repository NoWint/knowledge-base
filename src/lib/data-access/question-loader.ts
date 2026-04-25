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

const questionCache: LoadedQuestion[] | null = null

export async function loadAllQuestions(): Promise<LoadedQuestion[]> {
  const allQuestions: LoadedQuestion[] = []
  const subjectIds = ['yuwen', 'math', 'yingyu', 'history', 'daofa', 'biology', 'physics', 'geography', 'chemistry', 'tiyu']

  for (const subjectId of subjectIds) {
    try {
      const examFiles = [`@/data/subjects/${subjectId}/exams/mock-paper`, `@/data/subjects/${subjectId}/exams/${subjectId}-exam`]
      
      for (const filePath of examFiles) {
        try {
          const module = await import(filePath).catch(() => null)
          if (!module?.default) continue

          const data: ExamFile = module.default
          const categories = data.examCategories || []
          
          for (const cat of categories) {
            for (const q of cat.questions) {
              const options: QuestionOption[] = (q.options || []).map((opt, idx) => ({
                id: `${q.id}-opt-${idx}`,
                questionId: q.id,
                label: String.fromCharCode(65 + idx),
                content: opt,
                isCorrect: String.fromCharCode(65 + idx) === q.answer,
              }))

              allQuestions.push({
                id: q.id,
                knowledgePointId: '',
                type: q.type === '选择题' ? 'single' : q.type === '填空题' ? 'fill' : 'single',
                difficulty: q.difficulty === '困难' ? 3 : q.difficulty === '中等' ? 2 : 1,
                content: q.question,
                answer: q.answer,
                explanation: q.explanation || '',
                source: `${subjectId} - ${cat.category}`,
                tags: q.knowledgePoints || [],
                estimatedTime: 60,
                fromAI: false,
                options,
              })
            }
          }
        } catch {
          // File not found, skip
        }
      }
    } catch (e) {
      console.warn(`Failed to load questions for ${subjectId}:`, e)
    }
  }

  return allQuestions
}

export async function getQuestionsBySubject(subjectId: string): Promise<LoadedQuestion[]> {
  const allQuestions = await loadAllQuestions()
  return allQuestions.filter(q => q.source?.startsWith(subjectId))
}

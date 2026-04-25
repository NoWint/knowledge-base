import type { Question, QuestionOption, ExamFile, LoadedQuestion } from './types'

let questionCache: LoadedQuestion[] | null = null

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function loadAllQuestions(): Promise<LoadedQuestion[]> {
  if (questionCache) {
    return questionCache
  }

  const examFiles: ExamFile[] = [
    { subjectId: 'yuwen', fileName: 'mock-paper' },
    { subjectId: 'yuwen', fileName: 'yuwen-exam' },
    { subjectId: 'math', fileName: 'mock-paper' },
    { subjectId: 'math', fileName: 'math-exam' },
    { subjectId: 'english', fileName: 'mock-paper' },
    { subjectId: 'english', fileName: 'english-exam' },
    { subjectId: 'history', fileName: 'mock-paper' },
    { subjectId: 'history', fileName: 'history-exam' },
    { subjectId: 'daofa', fileName: 'mock-paper' },
    { subjectId: 'daofa', fileName: 'daofa-exam' },
  ]

  const allQuestions: LoadedQuestion[] = []

  for (const ef of examFiles) {
    const data = await fetchJSON<ExamFile>(`/data/subjects/${ef.subjectId}/exams/${ef.fileName}.json`)
    if (!data?.examCategories) continue

    for (const cat of data.examCategories) {
      if (!cat.questions) continue
      for (const q of cat.questions) {
        const options: QuestionOption[] = (q.options || []).map((o: any) => ({
          id: o.id || '',
          label: o.label || '',
          content: o.content || o.text || '',
          isCorrect: o.isCorrect || false,
        }))

        allQuestions.push({
          id: q.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          knowledgePointId: q.knowledgePointId || cat.id || '',
          type: (q.type as Question['type']) || 'choice',
          difficulty: q.difficulty || 1,
          content: q.content || q.text || '',
          options,
          answer: q.answer || q.correctAnswer || '',
          explanation: q.explanation || '',
          source: q.source || `${ef.subjectId}/${ef.fileName}`,
          tags: q.tags || [],
          fromAI: false,
        })
      }
    }
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

import * as XLSX from 'xlsx'
import type { Subject, Chapter, KnowledgePoint, Question, QuestionOption, KnowledgeRelation } from '@/types'

export async function parseSubjectsExcel(file: File): Promise<Subject[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<any>(sheet)

  return rows.map((row, i) => ({
    id: row.id || `subject-${Date.now()}-${i}`,
    name: row.name || row['学科名称'] || '',
    icon: row.icon || row['图标'] || '📚',
    gradeLevel: row.gradeLevel || row['年级范围'] || '7-9',
    description: row.description || row['描述'] || '',
    orderIndex: row.orderIndex ?? row['排序'] ?? i + 1,
  }))
}

export async function parseChaptersExcel(file: File): Promise<Chapter[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<any>(sheet)

  return rows.map((row, i) => ({
    id: row.id || `chapter-${Date.now()}-${i}`,
    subjectId: row.subjectId || row['学科ID'] || '',
    parentId: row.parentId || row['父章节ID'] || null,
    name: row.name || row['章节名称'] || '',
    orderIndex: row.orderIndex ?? row['排序'] ?? i + 1,
    description: row.description || row['描述'] || '',
  }))
}

export async function parseKnowledgePointsExcel(file: File): Promise<KnowledgePoint[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<any>(sheet)

  return rows.map((row, i) => ({
    id: row.id || `kp-${Date.now()}-${i}`,
    chapterId: row.chapterId || row['章节ID'] || '',
    name: row.name || row['知识点名称'] || '',
    description: row.description || row['描述'] || '',
    difficulty: row.difficulty ?? row['难度'] ?? 1,
    content: row.content || row['内容'] || '',
    masteryLevel: row.masteryLevel ?? row['掌握程度'] ?? 0,
  }))
}

export async function parseQuestionsExcel(file: File): Promise<{ questions: Question[], options: QuestionOption[] }> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<any>(sheet)

  const questions: Question[] = []
  const options: QuestionOption[] = []

  for (const row of rows) {
    const qId = row.id || `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const question: Question = {
      id: qId,
      knowledgePointId: row.knowledgePointId || row['知识点ID'] || '',
      type: row.type || row['题型'] || 'single',
      difficulty: row.difficulty ?? row['难度'] ?? 1,
      content: row.content || row['题目内容'] || '',
      answer: row.answer || row['答案'] || '',
      explanation: row.explanation || row['解析'] || '',
      source: row.source || row['来源'] || 'import',
      tags: row.tags ? String(row.tags).split(',') : [],
      estimatedTime: row.estimatedTime ?? row['预估时间'] ?? 60,
      fromAI: row.fromAI ?? row['AI生成'] ?? false,
    }
    questions.push(question)

    if (row.optionA) {
      const labels = ['A', 'B', 'C', 'D', 'E', 'F']
      const optionContents = [row.optionA, row.optionB, row.optionC, row.optionD, row.optionE, row.optionF]
      const correctAnswer = question.answer

      for (let i = 0; i < optionContents.length && optionContents[i]; i++) {
        options.push({
          id: `${qId}-${labels[i].toLowerCase()}`,
          questionId: qId,
          label: labels[i],
          content: optionContents[i],
          isCorrect: correctAnswer.includes(labels[i]),
        })
      }
    }
  }

  return { questions, options }
}

export async function parseRelationsExcel(file: File): Promise<KnowledgeRelation[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<any>(sheet)

  return rows.map((row, i) => ({
    id: row.id || `rel-${Date.now()}-${i}`,
    sourceKpId: row.sourceKpId || row['源知识点ID'] || '',
    targetKpId: row.targetKpId || row['目标知识点ID'] || '',
    relationType: row.relationType || row['关联类型'] || 'related',
    description: row.description || row['描述'] || '',
  }))
}

import { db } from '@/lib/db/database'
import type { Subject, Chapter, KnowledgePoint, Question, Article } from '@/types'

export interface DataSubject {
  id: string
  name: string
  icon: string
  gradeLevel: string
  description: string
  orderIndex: number
}

export interface DataChapter {
  id: string
  subjectId: string
  parentId: string | null
  name: string
  orderIndex: number
  description: string
}

export interface DataKnowledgePoint {
  id: string
  chapterId: string
  name: string
  description: string
  difficulty: number
  content: string
  masteryLevel: number
}

export interface DataQuestion {
  id: string
  knowledgePointId: string
  type: 'single' | 'multiple' | 'fill' | 'judge' | 'essay'
  difficulty: number
  content: string
  answer: string
  explanation: string
  source: string
  tags: string[]
  estimatedTime: number
  fromAI: boolean
}

export interface DataArticle {
  id: string
  knowledgePointId: string
  title: string
  content: string
  type: 'teaching' | 'overview' | 'method' | 'analysis' | 'summary' | 'policy'
  author: string
  createdAt: Date
}

export async function importSubjects(): Promise<number> {
  const subjects: DataSubject[] = [
    { id: 'yuwen', name: '语文', icon: '📖', gradeLevel: '7-9', description: '人教版统编本', orderIndex: 1 },
    { id: 'shuxue', name: '数学', icon: '🔢', gradeLevel: '7-9', description: '北师大版', orderIndex: 2 },
    { id: 'yingyu', name: '英语', icon: '🔤', gradeLevel: '7-9', description: '沪教版', orderIndex: 3 },
    { id: 'lishi', name: '历史', icon: '📜', gradeLevel: '7-9', description: '人教版', orderIndex: 4 },
    { id: 'daofa', name: '道法', icon: '⚖️', gradeLevel: '7-9', description: '人教版道德与法治', orderIndex: 5 },
    { id: 'shengwu', name: '生物', icon: '🧬', gradeLevel: '7-9', description: '人教版', orderIndex: 6 },
    { id: 'wuli', name: '物理', icon: '⚡', gradeLevel: '8-9', description: '人教版', orderIndex: 7 },
    { id: 'dili', name: '地理', icon: '🌍', gradeLevel: '7-8', description: '湘教版', orderIndex: 8 },
    { id: 'huaxue', name: '化学', icon: '🧪', gradeLevel: '9', description: '人教版', orderIndex: 9 },
    { id: 'tiyu', name: '体育', icon: '🏃', gradeLevel: '7-9', description: '体育与健康', orderIndex: 10 },
  ]

  const existingCount = await db.subjects.count()
  if (existingCount > 0) {
    console.log('Subjects already exist, skipping...')
    return 0
  }

  await db.subjects.bulkAdd(subjects)
  return subjects.length
}

export async function importChapters(subjectId: string, chapters: any[]): Promise<number> {
  const flatChapters: Chapter[] = []
  
  function processChapter(chapter: any, parentId: string | null = null) {
    const chapterId = chapter.id || `${subjectId}-${chapter.order || flatChapters.length}`
    flatChapters.push({
      id: chapterId,
      subjectId,
      parentId,
      name: chapter.name || '',
      orderIndex: chapter.order || 0,
      description: chapter.description || '',
    })
    
    if (chapter.subChapters) {
      chapter.subChapters.forEach((sub: any) => processChapter(sub, chapterId))
    }
  }

  chapters.forEach(ch => processChapter(ch))
  
  const existingCount = await db.chapters.where('subjectId').equals(subjectId).count()
  if (existingCount > 0) {
    console.log(`Chapters for ${subjectId} already exist, skipping...`)
    return 0
  }

  await db.chapters.bulkAdd(flatChapters)
  return flatChapters.length
}

export async function importKnowledgePoints(
  subjectId: string,
  knowledgePoints: DataKnowledgePoint[]
): Promise<number> {
  const validKps = knowledgePoints
    .filter(kp => kp.chapterId)
    .map(kp => ({
      ...kp,
      masteryLevel: kp.masteryLevel || 0,
    }))
  
  const existingCount = await db.knowledgePoints.count()
  if (existingCount > 500) {
    console.log('Knowledge points already exist, skipping...')
    return 0
  }

  await db.knowledgePoints.bulkAdd(validKps)
  return validKps.length
}

export async function importQuestions(questions: DataQuestion[]): Promise<number> {
  const validQuestions = questions.map(q => ({
    ...q,
    source: q.source || '',
    tags: q.tags || [],
    estimatedTime: q.estimatedTime || 60,
    fromAI: q.fromAI || false,
  }))

  const existingCount = await db.questions.count()
  if (existingCount > 100) {
    console.log('Questions already exist, skipping...')
    return 0
  }

  await db.questions.bulkAdd(validQuestions)
  return validQuestions.length
}

export async function importArticles(articles: DataArticle[]): Promise<number> {
  const validArticles = articles.map(a => ({
    ...a,
    author: a.author || '',
    createdAt: a.createdAt || new Date(),
  }))

  const existingCount = await db.articles.count()
  if (existingCount > 50) {
    console.log('Articles already exist, skipping...')
    return 0
  }

  await db.articles.bulkAdd(validArticles)
  return validArticles.length
}

export async function importAllSubjectData(subjectId: string): Promise<{
  chapters: number
  knowledgePoints: number
  questions: number
  articles: number
}> {
  const result = {
    chapters: 0,
    knowledgePoints: 0,
    questions: 0,
    articles: 0,
  }

  try {
    const curriculumModule = await import(`@/data/subjects/${subjectId}/chapters/curriculum`).catch(() => null)
    if (curriculumModule?.default) {
      result.chapters = await importChapters(subjectId, curriculumModule.default.chapters || [])
    }

    const kpModule = await import(`@/data/subjects/${subjectId}/knowledge/core-points`).catch(() => null)
    if (kpModule?.default?.knowledgePoints) {
      result.knowledgePoints = await importKnowledgePoints(subjectId, kpModule.default.knowledgePoints)
    }

    const qModule = await import(`@/data/subjects/${subjectId}/questions`).catch(() => null)
    if (qModule?.default?.questions) {
      result.questions = await importQuestions(qModule.default.questions)
    }

    const articleModule = await import(`@/data/subjects/${subjectId}/articles`).catch(() => null)
    if (articleModule?.default?.articles) {
      result.articles = await importArticles(articleModule.default.articles)
    }
  } catch (error) {
    console.error(`Error importing ${subjectId}:`, error)
  }

  return result
}

export async function importAllData(): Promise<{
  subjects: number
  chapters: number
  knowledgePoints: number
  questions: number
  articles: number
}> {
  const result = {
    subjects: 0,
    chapters: 0,
    knowledgePoints: 0,
    questions: 0,
    articles: 0,
  }

  result.subjects = await importSubjects()

  const subjects = await db.subjects.toArray()
  for (const subject of subjects) {
    const subjectResult = await importAllSubjectData(subject.id)
    result.chapters += subjectResult.chapters
    result.knowledgePoints += subjectResult.knowledgePoints
    result.questions += subjectResult.questions
    result.articles += subjectResult.articles
  }

  return result
}

import { db } from '@/lib/db/database'
import type { Subject, Chapter, KnowledgePoint, KnowledgeRelation } from '@/types'

let subjectsCache: Subject[] | null = null
const chaptersCache: Map<string, Chapter[]> = new Map()
const kpCache: Map<string, KnowledgePoint[]> = new Map()

export async function getAllSubjects(): Promise<Subject[]> {
  if (subjectsCache) {
    return subjectsCache
  }

  try {
    const metadataModule = await import('@/data/subjects/metadata').catch(() => null)
    if (metadataModule?.default?.subjects) {
      subjectsCache = metadataModule.default.subjects.sort((a: Subject, b: Subject) => a.orderIndex - b.orderIndex)
      return subjectsCache
    }
  } catch (e) {
    console.warn('Failed to load subjects from JSON, falling back to database')
  }

  const subjects = await db.subjects.toArray()
  return subjects.sort((a, b) => a.orderIndex - b.orderIndex)
}

export async function getAllChapters(): Promise<Chapter[]> {
  const allChapters: Chapter[] = []
  const subjects = await getAllSubjects()

  for (const subject of subjects) {
    const chapters = await getSubjectChapters(subject.id)
    allChapters.push(...chapters)
  }

  return allChapters
}

export async function getAllKnowledgePoints(): Promise<KnowledgePoint[]> {
  const allKps: KnowledgePoint[] = []
  const subjects = await getAllSubjects()

  for (const subject of subjects) {
    const kps = await getSubjectKnowledgePoints(subject.id)
    allKps.push(...kps)
  }

  return allKps
}

export async function getAllKnowledgeRelations(): Promise<KnowledgeRelation[]> {
  try {
    return await db.knowledgeRelations.toArray()
  } catch (e) {
    console.warn('Failed to load relations from database, returning empty array')
    return []
  }
}

export async function getSubjectChapters(subjectId: string): Promise<Chapter[]> {
  if (chaptersCache.has(subjectId)) {
    return chaptersCache.get(subjectId)!
  }

  try {
    const curriculum = await import(`@/data/subjects/${subjectId}/chapters/curriculum`).catch(() => null)
    if (!curriculum?.default?.chapters) {
      const dbChapters = await db.chapters.where('subjectId').equals(subjectId).toArray()
      chaptersCache.set(subjectId, dbChapters)
      return dbChapters
    }

    const chapters: Chapter[] = []
    function processChapter(ch: any, parentId: string | null = null) {
      const id = ch.id || `${subjectId}-${ch.order || chapters.length}`
      chapters.push({
        id,
        subjectId,
        parentId,
        name: ch.name || '',
        orderIndex: ch.order || 0,
        description: ch.description || '',
      })
      if (ch.subChapters) {
        ch.subChapters.forEach((sub: any) => processChapter(sub, id))
      }
    }
    curriculum.default.chapters.forEach((ch: any) => processChapter(ch))
    
    chaptersCache.set(subjectId, chapters)
    return chapters
  } catch (e) {
    const dbChapters = await db.chapters.where('subjectId').equals(subjectId).toArray()
    chaptersCache.set(subjectId, dbChapters)
    return dbChapters
  }
}

export async function getSubjectKnowledgePoints(subjectId: string): Promise<KnowledgePoint[]> {
  if (kpCache.has(subjectId)) {
    return kpCache.get(subjectId)!
  }

  try {
    const kpModule = await import(`@/data/subjects/${subjectId}/knowledge/core-points`).catch(() => null)
    if (!kpModule?.default?.knowledgePoints) {
      const chapters = await getSubjectChapters(subjectId)
      const chapterIds = chapters.map(c => c.id)
      const dbKps = await db.knowledgePoints.where('chapterId').anyOf(chapterIds).toArray()
      kpCache.set(subjectId, dbKps)
      return dbKps
    }

    const kps: KnowledgePoint[] = kpModule.default.knowledgePoints.map((kp: any, idx: number) => ({
      id: kp.id || `${subjectId}-kp-${idx}`,
      chapterId: kp.chapterId || '',
      name: kp.name || '',
      description: kp.description || '',
      difficulty: kp.difficulty || 1,
      content: kp.content || '',
      masteryLevel: kp.masteryLevel || 0,
    }))

    kpCache.set(subjectId, kps)
    return kps
  } catch (e) {
    const chapters = await getSubjectChapters(subjectId)
    const chapterIds = chapters.map(c => c.id)
    const dbKps = await db.knowledgePoints.where('chapterId').anyOf(chapterIds).toArray()
    kpCache.set(subjectId, dbKps)
    return dbKps
  }
}

export async function searchKnowledgePoints(query: string, subjectId?: string): Promise<KnowledgePoint[]> {
  const subjects = subjectId ? [subjectId] : (await getAllSubjects()).map(s => s.id)
  const results: KnowledgePoint[] = []

  for (const sid of subjects) {
    const kps = await getSubjectKnowledgePoints(sid)
    const filtered = kps.filter(kp =>
      kp.name.includes(query) ||
      kp.description.includes(query) ||
      kp.content.includes(query)
    )
    results.push(...filtered)
  }

  return results
}

export async function getKnowledgePointById(kpId: string): Promise<KnowledgePoint | null> {
  const allKps = await getAllKnowledgePoints()
  return allKps.find(kp => kp.id === kpId) || null
}

export async function getChapterById(chapterId: string): Promise<Chapter | null> {
  const allChapters = await getAllChapters()
  return allChapters.find(ch => ch.id === chapterId) || null
}

export function clearCache() {
  subjectsCache = null
  chaptersCache.clear()
  kpCache.clear()
}

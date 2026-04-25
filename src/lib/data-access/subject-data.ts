import { db } from '@/lib/db/database'
import type { Subject, Chapter, KnowledgePoint, KnowledgeRelation } from '@/types'

let subjectsCache: Subject[] | null = null
const chaptersCache: Map<string, Chapter[]> = new Map()
const kpCache: Map<string, KnowledgePoint[]> = new Map()

const DATA_BASE_URL = ''

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function getAllSubjects(): Promise<Subject[]> {
  if (subjectsCache) {
    return subjectsCache
  }

  const data = await fetchJSON<{ subjects: Subject[] }>(`${DATA_BASE_URL}/data/subjects/metadata.json`)
  if (data?.subjects) {
    subjectsCache = data.subjects.sort((a, b) => a.orderIndex - b.orderIndex)
    return subjectsCache
  }

  try {
    const subjects = await db.subjects.toArray()
    return subjects.sort((a, b) => a.orderIndex - b.orderIndex)
  } catch {
    return []
  }
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
  } catch {
    return []
  }
}

function processChapterData(chapters: any[], subjectId: string, parentId: string | null = null): Chapter[] {
  const result: Chapter[] = []
  chapters.forEach((ch, idx) => {
    const id = ch.id || `${subjectId}-${ch.order || idx}`
    result.push({
      id,
      subjectId,
      parentId,
      name: ch.name || '',
      orderIndex: ch.order || idx,
      description: ch.description || '',
    })
    if (ch.subChapters) {
      result.push(...processChapterData(ch.subChapters, subjectId, id))
    }
  })
  return result
}

export async function getSubjectChapters(subjectId: string): Promise<Chapter[]> {
  if (chaptersCache.has(subjectId)) {
    return chaptersCache.get(subjectId)!
  }

  const data = await fetchJSON<{ chapters: any[] }>(`/data/subjects/${subjectId}/chapters/curriculum.json`)
  if (data?.chapters) {
    const chapters = processChapterData(data.chapters, subjectId)
    chaptersCache.set(subjectId, chapters)
    return chapters
  }

  try {
    const dbChapters = await db.chapters.where('subjectId').equals(subjectId).toArray()
    chaptersCache.set(subjectId, dbChapters)
    return dbChapters
  } catch {
    return []
  }
}

export async function getSubjectKnowledgePoints(subjectId: string): Promise<KnowledgePoint[]> {
  if (kpCache.has(subjectId)) {
    return kpCache.get(subjectId)!
  }

  const data = await fetchJSON<{ knowledgePoints: any[] }>(`/data/subjects/${subjectId}/knowledge/core-points.json`)
  if (data?.knowledgePoints) {
    const kps: KnowledgePoint[] = data.knowledgePoints.map((kp, idx) => ({
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
  }

  try {
    const chapters = await getSubjectChapters(subjectId)
    const chapterIds = chapters.map(c => c.id)
    if (chapterIds.length === 0) return []
    const dbKps = await db.knowledgePoints.where('chapterId').anyOf(chapterIds).toArray()
    kpCache.set(subjectId, dbKps)
    return dbKps
  } catch {
    return []
  }
}

export async function searchKnowledgePoints(query: string, subjectId?: string): Promise<KnowledgePoint[]> {
  const subjects = subjectId ? [subjectId] : (await getAllSubjects()).map(s => s.id)
  const results: KnowledgePoint[] = []

  for (const sid of subjects) {
    const kps = await getSubjectKnowledgePoints(sid)
    const filtered = kps.filter(kp =>
      kp.name.includes(query) ||
      (kp.description && kp.description.includes(query)) ||
      (kp.content && kp.content.includes(query))
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

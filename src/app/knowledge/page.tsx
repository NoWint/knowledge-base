"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { AppLayout } from "@/components/layout/app-layout"
import type { Subject, Chapter, KnowledgePoint } from "@/types"
import { Lightbulb, Search, BookOpen, ChevronRight, Network, Database } from "lucide-react"
import { smoothEase } from "@/lib/animations"
import { getAllSubjects, getSubjectChapters, getSubjectKnowledgePoints } from "@/lib/data-access/subject-data"

export default function KnowledgeCenterPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadData = async () => {
      try {
        const s = await getAllSubjects()
        setSubjects(s)
        
        const allChapters: Chapter[] = []
        const allKps: KnowledgePoint[] = []
        
        for (const subj of s) {
          const chs = await getSubjectChapters(subj.id)
          const kps = await getSubjectKnowledgePoints(subj.id)
          allChapters.push(...chs)
          allKps.push(...kps)
        }
        
        setChapters(allChapters)
        setKnowledgePoints(allKps)
      } catch (err) {
        console.error("Failed to load knowledge data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const toggleChapter = useCallback((chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapterId)) next.delete(chapterId)
      else next.add(chapterId)
      return next
    })
  }, [])

  const filteredSubjectIds = useMemo(() => {
    if (!search) return new Set(subjects.map(s => s.id))
    const lower = search.toLowerCase()
    const matchingKpChapterIds = new Set(
      knowledgePoints.filter(kp => kp.name.toLowerCase().includes(lower)).map(kp => kp.chapterId)
    )
    const matchingChapterIds = new Set(
      chapters.filter(c => {
        if (c.name.toLowerCase().includes(lower)) return true
        return matchingKpChapterIds.has(c.id)
      }).map(c => c.id)
    )
    const matchingSubjectIds = new Set(
      subjects.filter(s => {
        if (s.name.toLowerCase().includes(lower)) return true
        return chapters.some(c => c.subjectId === s.id && matchingChapterIds.has(c.id))
      }).map(s => s.id)
    )
    return matchingSubjectIds.size > 0 ? matchingSubjectIds : new Set(subjects.map(s => s.id))
  }, [search, subjects, chapters, knowledgePoints])

  const filteredSubjects = useMemo(() => {
    if (!search) {
      return selectedSubject ? subjects.filter(s => s.id === selectedSubject) : subjects
    }
    return subjects.filter(s => filteredSubjectIds.has(s.id))
  }, [subjects, search, filteredSubjectIds, selectedSubject])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <Database className="mx-auto h-12 w-12 animate-pulse text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">加载知识数据...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const totalKp = knowledgePoints.length
  const totalChapters = chapters.filter(c => c.parentId === null).length

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: smoothEase }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">知识中心</h1>
              <p className="text-sm text-gray-500">浏览和搜索所有知识点</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 px-3 py-1.5">
              <span className="text-xs text-blue-600">{subjects.length} 学科</span>
            </div>
            <div className="rounded-lg bg-green-50 px-3 py-1.5">
              <span className="text-xs text-green-600">{totalChapters} 章节</span>
            </div>
            <div className="rounded-lg bg-amber-50 px-3 py-1.5">
              <span className="text-xs text-amber-600">{totalKp} 知识点</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索学科、章节或知识点..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm transition focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <button
            onClick={() => router.push("/knowledge/graph")}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <Network className="h-4 w-4" /> 知识图谱
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedSubject(null)}
            className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              !selectedSubject
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            全部学科
          </button>
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id === selectedSubject ? null : s.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedSubject === s.id
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{s.icon}</span> {s.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredSubjects.map((subject, sIdx) => {
              const subjectChapters = chapters.filter(c => c.subjectId === subject.id && c.parentId === null)
              const subjectKps = knowledgePoints.filter(kp => {
                const chapterIds = new Set(subjectChapters.map(c => c.id))
                const childIds = new Set(chapters.filter(c => c.parentId && chapterIds.has(c.parentId)).map(c => c.id))
                return chapterIds.has(kp.chapterId) || childIds.has(kp.chapterId)
              })

              if (!search && subjectKps.length === 0) return null

              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sIdx * 0.04 }}
                  className="rounded-xl border bg-white shadow-sm overflow-hidden"
                >
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b">
                    <span className="text-2xl">{subject.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                      <p className="text-xs text-gray-500">{subject.description}</p>
                    </div>
                    <span className="text-xs text-gray-500">{subjectKps.length} 个知识点</span>
                  </div>

                  <div className="divide-y">
                    {subjectChapters.map(chapter => {
                      const isExpanded = expandedChapters.has(chapter.id)
                      const childChapters = chapters.filter(c => c.parentId === chapter.id)
                      const allChapterIds = new Set([chapter.id, ...childChapters.map(c => c.id)])
                      const chapterKps = knowledgePoints.filter(kp => allChapterIds.has(kp.chapterId))

                      if (!search && chapterKps.length === 0) return null

                      return (
                        <div key={chapter.id}>
                          <button
                            onClick={() => toggleChapter(chapter.id)}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </motion.div>
                            <BookOpen className="h-4 w-4 text-gray-400" />
                            <span className="flex-1 text-sm font-medium text-gray-700">{chapter.name}</span>
                            <span className="text-xs text-gray-400">{chapterKps.length}</span>
                          </button>

                          <AnimatePresence>
                            {isExpanded && chapterKps.length > 0 && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 py-2 pl-12 bg-gray-50/50">
                                  <div className="flex flex-wrap gap-2">
                                    {chapterKps.map((kp, kpIdx) => {
                                      const colors = [
                                        "bg-amber-100 text-amber-700 hover:bg-amber-200",
                                        "bg-orange-100 text-orange-700 hover:bg-orange-200",
                                        "bg-red-100 text-red-700 hover:bg-red-200",
                                      ]
                                      return (
                                        <motion.button
                                          key={kp.id}
                                          onClick={() => router.push(`/knowledge/resources?kp=${kp.id}`)}
                                          initial={{ opacity: 0, scale: 0.9 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ delay: kpIdx * 0.02 }}
                                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                            colors[Math.min(kp.difficulty - 1, 2)]
                                          }`}
                                        >
                                          {kp.name}
                                        </motion.button>
                                      )
                                    })}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filteredSubjects.length === 0 && (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">未找到匹配的知识数据</p>
            </div>
          )}
        </div>
      </motion.div>
    </AppLayout>
  )
}

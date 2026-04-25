"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useUserStore } from "@/store/user-store"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, FolderOpen, FileText, BookMarked } from "lucide-react"
import type { Chapter, Subject } from "@/types"
import { getAllSubjects, getSubjectChapters } from "@/lib/data-access/subject-data"

const smoothEase = [0.25, 0.1, 0.25, 1]

const SUBJECT_COLORS: Record<string, string> = {
  yuwen: "from-red-500 to-rose-600",
  math: "from-blue-500 to-blue-600",
  english: "from-green-500 to-emerald-600",
  physics: "from-yellow-500 to-amber-600",
  chemistry: "from-purple-500 to-violet-600",
  biology: "from-teal-500 to-cyan-600",
  history: "from-orange-500 to-red-600",
  geography: "from-sky-500 to-blue-600",
  daofa: "from-indigo-500 to-purple-600",
  tiyu: "from-lime-500 to-green-600",
}

export default function SubjectsPage() {
  const { currentUser } = useUserStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [chapters, setChapters] = useState<Chapter[]>([])

  useEffect(() => {
    async function loadData() {
      const subs = await getAllSubjects()
      setSubjects(subs)
    }
    loadData()
  }, [])

  useEffect(() => {
    async function loadChapters() {
      if (selectedSubject) {
        const chs = await getSubjectChapters(selectedSubject)
        setChapters(chs)
      } else {
        setChapters([])
      }
    }
    loadChapters()
  }, [selectedSubject])

  const currentSubject = subjects.find(s => s.id === selectedSubject)

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: smoothEase }}
        >
          <h1 className="text-xl font-bold text-gray-900">学科目录</h1>
          <p className="text-gray-600 text-sm mt-0.5">浏览初中全学科知识点</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedSubject ? (
            <motion.div
              key="subject-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {subjects.map((subject, index) => (
                <motion.button
                  key={subject.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3, ease: smoothEase }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSubject(subject.id)}
                  className="group cursor-pointer flex items-center gap-3 p-4 rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md text-left"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${SUBJECT_COLORS[subject.id] || 'from-gray-500 to-gray-600'} text-lg`}>
                    {subject.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-gray-500">{subject.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="subject-detail"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: smoothEase }}
              className="space-y-3"
            >
              <motion.button
                whileHover={{ x: -2 }}
                onClick={() => setSelectedSubject(null)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                返回学科列表
              </motion.button>

              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className={`flex items-center gap-3 p-4 bg-gradient-to-r ${SUBJECT_COLORS[currentSubject?.id || ''] || 'from-gray-500 to-gray-600'} rounded-t-xl`}>
                  <span className="text-2xl">{currentSubject?.icon}</span>
                  <div className="text-white">
                    <h2 className="text-lg font-bold">{currentSubject?.name}</h2>
                    <p className="text-white/80 text-xs">{currentSubject?.description || '初中全册内容'}</p>
                  </div>
                </div>

                <div className="divide-y">
                  {(() => {
                    // Get all grade-level chapters (those with no parent that belong to this subject)
                    const gradeChapters = chapters.filter(c => c.subjectId === selectedSubject && c.parentId === null)
                    
                    return gradeChapters.map((grade) => {
                      const childChapters = chapters.filter(c => c.parentId === grade.id)
                      const isExpanded = expandedChapters.has(grade.id)

                      return (
                        <div key={grade.id}>
                          <motion.button
                            whileHover={{ backgroundColor: "rgb(249 250 251)" }}
                            onClick={() => toggleChapter(grade.id)}
                            className="flex w-full items-center justify-between p-3 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <FolderOpen className={`h-4 w-4 ${isExpanded ? "text-blue-600" : "text-gray-400"}`} />
                              <span className="font-medium text-gray-900 text-sm">{grade.name}</span>
                              {childChapters.length > 0 && (
                                <span className="text-xs text-gray-400">({childChapters.length}章)</span>
                              )}
                            </div>
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2, ease: smoothEase }}
                            >
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </motion.div>
                          </motion.button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: smoothEase }}
                                className="overflow-hidden"
                              >
                                <div className="ml-8 border-l-2 border-gray-200 pl-3 pb-2">
                                  {childChapters.length > 0 ? (
                                    childChapters.map((chapter) => (
                                      <button
                                        key={chapter.id}
                                        className="flex w-full items-center gap-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                                      >
                                        <FileText className="h-3.5 w-3.5" />
                                        {chapter.name}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="py-3 text-xs text-gray-400">
                                      <BookMarked className="h-3 w-3 inline mr-1" />
                                      章节内容待添加...
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}

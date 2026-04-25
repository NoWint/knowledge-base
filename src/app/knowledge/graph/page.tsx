"use client"

import { useCallback, useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { motion, AnimatePresence } from "framer-motion"
import { AppLayout } from "@/components/layout/app-layout"
import {
  Network,
  Search,
  BookOpen,
  ArrowLeftRight,
  Lightbulb,
  Database,
  ExternalLink,
  ChevronDown,
  Layers,
  Eye,
} from "lucide-react"
import type { Subject, Chapter, KnowledgePoint, KnowledgeRelation } from "@/types"
import { smoothEase } from "@/lib/animations"
import {
  getAllSubjects,
  getAllChapters,
  getAllKnowledgePoints,
  getAllKnowledgeRelations,
} from "@/lib/data-access/subject-data"

const relationTypeLabels: Record<string, string> = {
  prerequisite: "前置基础",
  successor: "后续进阶",
  related: "关联应用",
  cross_subject: "跨学科",
  extension: "拓展延伸",
}

const relationColors: Record<string, string> = {
  prerequisite: "#10b981",
  successor: "#3b82f6",
  related: "#f59e0b",
  cross_subject: "#8b5cf6",
  extension: "#ec4899",
}

const DIFFICULTY_COLORS = [
  "from-amber-400 to-yellow-500",
  "from-orange-500 to-orange-600",
  "from-red-500 to-red-600",
]

function SubjectNode({ data }: { data: { label: string; icon: string; count: number } }) {
  return (
    <div className="group relative">
      <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 px-5 py-3.5 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{data.icon}</span>
          <div>
            <span className="font-semibold text-sm">{data.label}</span>
            <div className="text-xs text-blue-100 opacity-80">{data.count} 个知识点</div>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 !h-2" />
    </div>
  )
}

function ChapterNode({ data }: { data: { label: string; level: number } }) {
  const bgClass = data.level === 0
    ? "from-green-500 to-emerald-600"
    : "from-teal-500 to-cyan-600"

  return (
    <div className="group relative">
      <div className={`rounded-lg bg-gradient-to-br ${bgClass} px-4 py-2.5 text-white shadow-md hover:shadow-lg transition-all duration-200`}>
        <span className="text-xs font-medium whitespace-nowrap">{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-green-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-2 !h-2" />
    </div>
  )
}

function KnowledgeNode({
  data,
}: {
  data: { label: string; difficulty: number; knowledgePointId: string; mastery?: number }
}) {
  const router = useRouter()
  const difficultyIndex = Math.min(Math.max(data.difficulty - 1, 0), 2)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/knowledge/resources?kp=${data.knowledgePointId}`)
  }

  return (
    <div className="group relative">
      <motion.div
        onClick={handleClick}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`
          cursor-pointer rounded-lg border-2 border-white/50 bg-gradient-to-br px-3 py-2 shadow-md
          hover:shadow-xl transition-all duration-200 min-w-[80px] max-w-[140px]
          ${DIFFICULTY_COLORS[difficultyIndex]}
        `}
      >
        <div className="text-xs font-medium text-white text-center leading-tight">
          {data.label.length > 15 ? data.label.slice(0, 15) + "..." : data.label}
        </div>
        {data.mastery !== undefined && (
          <div className="mt-1.5 h-1 rounded-full bg-black/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.mastery}%` }}
              className="h-full bg-white rounded-full"
            />
          </div>
        )}
      </motion.div>
      <Handle type="target" position={Position.Top} className="!bg-amber-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-amber-500 !w-2 !h-2" />
    </div>
  )
}

const nodeTypes = {
  subject: SubjectNode,
  chapter: ChapterNode,
  knowledge: KnowledgeNode,
}

interface GraphStats {
  subjects: number
  chapters: number
  knowledge: number
  relations: number
}

export default function KnowledgePage() {
  const router = useRouter()
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<GraphStats>({ subjects: 0, chapters: 0, knowledge: 0, relations: 0 })
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showMinimap, setShowMinimap] = useState(true)
  const [showRelations, setShowRelations] = useState(true)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [allSubjects, chapters, knowledgePoints, relations] = await Promise.all([
        getAllSubjects(),
        getAllChapters(),
        getAllKnowledgePoints(),
        getAllKnowledgeRelations(),
      ])

      setSubjects(allSubjects)
      setStats({
        subjects: allSubjects.length,
        chapters: chapters.length,
        knowledge: knowledgePoints.length,
        relations: relations.length,
      })

      const filteredChapters = selectedSubject
        ? chapters.filter((c) => c.subjectId === selectedSubject)
        : chapters

      const filteredSubjectIds = new Set(filteredChapters.map((c) => c.subjectId))
      const filteredSubjects = selectedSubject
        ? allSubjects.filter((s) => s.id === selectedSubject)
        : allSubjects.filter((s) => filteredSubjectIds.has(s.id))

      const chapterIds = new Set(filteredChapters.map((c) => c.id))
      const childChapterIds = new Set(
        chapters.filter((c) => c.parentId && chapterIds.has(c.parentId)).map((c) => c.id)
      )
      const allChapterIds = new Set([...chapterIds, ...childChapterIds])
      const filteredKnowledgePoints = knowledgePoints.filter((kp) =>
        allChapterIds.has(kp.chapterId)
      )

      const filteredKpIds = new Set(filteredKnowledgePoints.map((kp) => kp.id))
      const filteredRelations = showRelations
        ? relations.filter(
            (r) => filteredKpIds.has(r.sourceKpId) && filteredKpIds.has(r.targetKpId)
          )
        : []

      const newNodes: Node[] = []
      const newEdges: Edge[] = []
      const nodeMap = new Map<string, Node>()

      const subjectSpacing = Math.max(280, filteredSubjects.length * 60)
      filteredSubjects.forEach((s, i) => {
        const node: Node = {
          id: `subject-${s.id}`,
          type: "subject",
          position: { x: 100 + i * subjectSpacing, y: 50 },
          data: {
            label: s.name,
            icon: s.icon || "📚",
            count: filteredKnowledgePoints.filter((kp) => {
              const chapter = chapters.find((c) => c.id === kp.chapterId)
              return chapter?.subjectId === s.id
            }).length,
          },
        }
        newNodes.push(node)
        nodeMap.set(`subject-${s.id}`, node)
      })

      const chapterSpacing = 180
      const chapterGroups = new Map<string, Chapter[]>()
      filteredChapters
        .filter((c) => !c.parentId)
        .forEach((c) => {
          if (!chapterGroups.has(c.subjectId)) chapterGroups.set(c.subjectId, [])
          chapterGroups.get(c.subjectId)!.push(c)
        })

      const kpNodeWidth = 120
      const kpNodeMargin = 20

      chapterGroups.forEach((subjectChapters, subjectId) => {
        const subjectNode = nodeMap.get(`subject-${subjectId}`)
        const baseX = subjectNode ? subjectNode.position.x + 50 : 100

        subjectChapters.forEach((c, idx) => {
          const parentNode: Node = {
            id: `chapter-${c.id}`,
            type: "chapter",
            position: { x: baseX + idx * chapterSpacing, y: 160 },
            data: { label: c.name, level: 0 },
          }
          newNodes.push(parentNode)
          nodeMap.set(`chapter-${c.id}`, parentNode)

          if (subjectNode) {
            newEdges.push({
              id: `e-subject-${c.id}`,
              source: `subject-${subjectId}`,
              target: `chapter-${c.id}`,
              animated: true,
              style: { stroke: "#10b981", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
            })
          }

          const childChapters = chapters.filter((ch) => ch.parentId === c.id)
          childChapters.forEach((child, childIdx) => {
            const childNode: Node = {
              id: `chapter-${child.id}`,
              type: "chapter",
              position: { x: parentNode.position.x + (childIdx - childChapters.length / 2) * 100, y: 250 },
              data: { label: child.name, level: 1 },
            }
            newNodes.push(childNode)
            nodeMap.set(`chapter-${child.id}`, childNode)

            newEdges.push({
              id: `e-chapter-parent-${child.id}`,
              source: `chapter-${c.id}`,
              target: `chapter-${child.id}`,
              animated: true,
              style: { stroke: "#10b981", strokeWidth: 1.5, strokeDasharray: "4,4" },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
            })

            const kpChildren = filteredKnowledgePoints.filter((kp) => kp.chapterId === child.id)
            const totalKpWidth = kpChildren.length * (kpNodeWidth + kpNodeMargin) - kpNodeMargin
            kpChildren.forEach((kp, kpIdx) => {
              const kpNode: Node = {
                id: `kp-${kp.id}`,
                type: "knowledge",
                position: {
                  x: childNode.position.x - totalKpWidth / 2 + kpIdx * (kpNodeWidth + kpNodeMargin),
                  y: 350,
                },
                data: {
                  label: kp.name,
                  difficulty: kp.difficulty,
                  knowledgePointId: kp.id,
                  mastery: (kp as any).masteryLevel,
                },
              }
              newNodes.push(kpNode)
              nodeMap.set(`kp-${kp.id}`, kpNode)

              newEdges.push({
                id: `e-chapter-kp-${kp.id}`,
                source: `chapter-${child.id}`,
                target: `kp-${kp.id}`,
                style: { stroke: "#f59e0b", strokeWidth: 1.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
              })
            })
          })

          const directKPs = filteredKnowledgePoints.filter((kp) => kp.chapterId === c.id)
          const totalKpWidth = directKPs.length * (kpNodeWidth + kpNodeMargin) - kpNodeMargin
          directKPs.forEach((kp, kpIdx) => {
            const kpNode: Node = {
              id: `kp-${kp.id}`,
              type: "knowledge",
              position: {
                x: parentNode.position.x - totalKpWidth / 2 + kpIdx * (kpNodeWidth + kpNodeMargin),
                y: 350,
              },
              data: {
                label: kp.name,
                difficulty: kp.difficulty,
                knowledgePointId: kp.id,
              },
            }
            newNodes.push(kpNode)
            nodeMap.set(`kp-${kp.id}`, kpNode)

            newEdges.push({
              id: `e-chapter-kp-${kp.id}`,
              source: `chapter-${c.id}`,
              target: `kp-${kp.id}`,
              style: { stroke: "#f59e0b", strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
            })
          })
        })
      })

      filteredRelations.forEach((r) => {
        const sourceNode = nodeMap.get(`kp-${r.sourceKpId}`)
        const targetNode = nodeMap.get(`kp-${r.targetKpId}`)

        if (sourceNode && targetNode) {
          const color = relationColors[r.relationType] || "#8b5cf6"
          newEdges.push({
            id: `e-rel-${r.id}`,
            source: `kp-${r.sourceKpId}`,
            target: `kp-${r.targetKpId}`,
            label: relationTypeLabels[r.relationType] || r.relationType,
            animated: true,
            style: {
              stroke: color,
              strokeDasharray: "6,3",
              strokeWidth: 2,
            },
            labelStyle: {
              fill: color,
              fontWeight: 600,
              fontSize: 10,
            },
            labelBgStyle: {
              fill: "#ffffff",
              fillOpacity: 0.95,
            },
            labelBgPadding: [4, 4] as [number, number],
            labelBgBorderRadius: 4,
            markerEnd: { type: MarkerType.ArrowClosed, color },
          })
        }
      })

      setNodes(newNodes)
      setEdges(newEdges)
    } catch (err) {
      console.error("Failed to load knowledge graph:", err)
    } finally {
      setLoading(false)
    }
  }, [selectedSubject, showRelations])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    []
  )

  const filteredNodes = useMemo(() => {
    if (!search) return nodes
    const searchLower = search.toLowerCase()
    return nodes.filter((n) => {
      const label = n.data?.label as string
      return label?.toLowerCase().includes(searchLower)
    })
  }, [nodes, search])

  const filteredEdges = useMemo(() => {
    if (!search && filteredNodes.length === nodes.length) return edges
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
    return edges.filter(
      (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    )
  }, [edges, filteredNodes, search, nodes.length])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto h-14 w-14">
              <div className="absolute inset-0 animate-ping rounded-full bg-teal-400 opacity-20" />
              <Database className="relative h-14 w-14 animate-pulse text-teal-500" />
            </div>
            <p className="mt-4 text-sm text-gray-500">正在构建知识图谱...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const totalNodes = filteredNodes.length

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: smoothEase }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg">
              <Network className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">知识图谱</h1>
              <p className="text-sm text-gray-500">
                共 {totalNodes} 个节点 · 点击知识点查看详情
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={selectedSubject || ""}
                onChange={(e) => setSelectedSubject(e.target.value || null)}
                className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
              >
                <option value="">全部学科</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>

            <button
              onClick={() => setShowRelations(!showRelations)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                showRelations
                  ? "border-teal-200 bg-teal-50 text-teal-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              关联线
            </button>

            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                showMinimap
                  ? "border-teal-200 bg-teal-50 text-teal-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              小地图
            </button>

            <div className="flex items-center gap-1 rounded-lg bg-gray-100 px-1">
              <div className="flex h-7 items-center gap-0.5 rounded-md bg-white px-1 shadow-sm">
                <div className="flex h-5 items-center gap-0.5 rounded bg-blue-50 px-1.5 text-xs text-blue-600">
                  {stats.subjects}
                </div>
                <div className="flex h-5 items-center gap-0.5 rounded bg-green-50 px-1.5 text-xs text-green-600">
                  {stats.chapters}
                </div>
                <div className="flex h-5 items-center gap-0.5 rounded bg-amber-50 px-1.5 text-xs text-amber-600">
                  {stats.knowledge}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索知识点、章节或学科..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div className="flex items-center gap-2 border-l pl-3 text-xs text-gray-500">
            <ExternalLink className="h-3 w-3" />
            <span>点击节点查看资料</span>
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-teal-600 hover:text-teal-700"
            >
              清除
            </button>
          )}
        </div>

        <div
          ref={reactFlowWrapper}
          className="relative h-[650px] overflow-hidden rounded-xl border bg-white shadow-sm"
        >
          {totalNodes === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Search className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">没有找到匹配的节点</p>
                <button
                  onClick={() => {
                    setSearch("")
                    setSelectedSubject(null)
                  }}
                  className="mt-2 text-xs text-teal-600 hover:text-teal-700"
                >
                  清除筛选
                </button>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={filteredNodes}
              edges={filteredEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes as any}
              fitView
              fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
              minZoom={0.1}
              maxZoom={2}
              defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#e5e7eb" gap={20} size={1} />
              <Controls
                showZoom={true}
                showFitView={true}
                showInteractive={false}
                className="!rounded-lg !border !border-gray-200 !bg-white !shadow-sm"
              />
              <AnimatePresence>
                {showMinimap && (
                  <MiniMap
                    nodeColor={(node) => {
                      if (node.type === "subject") return "#3b82f6"
                      if (node.type === "chapter") return "#10b981"
                      if (node.type === "knowledge") return "#f59e0b"
                      return "#8b5cf6"
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                    className="!rounded-lg !border !border-gray-200 !bg-white !shadow-sm"
                    style={{ width: 120, height: 80 }}
                  />
                )}
              </AnimatePresence>
            </ReactFlow>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">学科</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.subjects}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <Layers className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">章节</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.chapters}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <Lightbulb className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-xs text-gray-500">知识点</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.knowledge}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <ArrowLeftRight className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-xs text-gray-500">关联</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.relations}</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">学科关联</h3>
            </div>
            <p className="text-sm text-gray-600">
              展示各学科间的知识联系，如数学在物理、化学中的应用。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">跨学科连接</h3>
            </div>
            <p className="text-sm text-gray-600">
              探索不同学科间的交叉点，如运动生理学结合生物和体育。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">难度递进</h3>
            </div>
            <p className="text-sm text-gray-600">
              知识点按难度分级：黄色基础，橙色进阶，红色高阶。
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  )
}
